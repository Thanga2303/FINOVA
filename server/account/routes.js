// Accounts, billing and membership-gated API routes.
import crypto from "node:crypto";
import express from "express";
import { endSession, httpError, publicUser, rateLimit, register, requireUser, sameOrigin, sessionMiddleware, startSession, verifyPassword, newId } from "./auth.js";
import { read, write } from "./db.js";
import { PAID, planById, publicPlans } from "./plans.js";
import { googlePlay, providerStatus, razorpay, testMode } from "./providers.js";
import { activate, aiUsage, consumeAi, effectivePlan, getSub, logEvent, runLifecycle, scheduleDowngrade, setCancel, setStatus } from "./subscriptions.js";
import { MASTERCLASSES } from "../data/masterclasses.js";

const h = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.json(out ?? { ok: true });
  } catch (e) {
    const status = e.status ?? 500;
    if (status === 500) console.error(`[account] ${req.method} ${req.path}:`, e.message);
    res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : e.message });
  }
};

const ip = (req) => String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0].trim();
const quotaKey = (req) => (req.user ? `user:${req.user.id}` : `anon:${crypto.createHash("sha256").update(ip(req)).digest("hex").slice(0, 16)}`);

function serialiseFeatures(f) {
  return { ...f, journalLimit: Number.isFinite(f.journalLimit) ? f.journalLimit : null };
}

function statusFor(req) {
  const plan = effectivePlan(req.user?.id);
  const sub = req.user ? getSub(req.user.id) : null;
  return {
    user: publicUser(req.user),
    plan: { id: plan.id, name: plan.name, tier: plan.tier },
    features: serialiseFeatures(plan.features),
    subscription: sub && PAID.includes(sub.plan) ? {
      plan: sub.plan, status: sub.status, provider: sub.provider, test: sub.test,
      currentPeriodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd, scheduledPlan: sub.scheduledPlan, startedAt: sub.startedAt,
    } : null,
    ai: { used: aiUsage(quotaKey(req)), limit: plan.features.aiDailyLimit },
    providers: providerStatus(),
  };
}

/** Server-side feature gate. Never trusts anything the browser says about its plan. */
const requireFeature = (check, message) => (req, res, next) => {
  const plan = effectivePlan(req.user?.id);
  if (check(plan.features)) { req.plan = plan; return next(); }
  res.status(402).json({ error: message, upgrade: true, plan: plan.id });
};

// One-time AI tickets: each question consumes daily quota once; /api/chat requires a valid ticket.
const tickets = new Map();
export function takeTicket(id) {
  const t = tickets.get(id);
  if (!t || t.exp < Date.now()) return false;
  tickets.delete(id);
  return true;
}

export function mountWebhooks(app) {
  // Razorpay webhook needs the raw body for signature verification, so it is mounted before JSON parsing elsewhere.
  app.post("/api/billing/webhook/razorpay", express.raw({ type: "application/json", limit: "256kb" }), h(async (req) => {
    const sig = req.headers["x-razorpay-signature"];
    if (!razorpay.verifyWebhook(req.body, sig)) throw httpError(400, "Invalid signature");
    const eventId = String(req.headers["x-razorpay-event-id"] ?? "");
    if (eventId && read().webhookIds[eventId]) return { ok: true, duplicate: true };
    const evt = JSON.parse(req.body.toString("utf8"));
    const sub = evt?.payload?.subscription?.entity;
    const userId = sub?.notes?.finova_user;
    if (sub && userId && read().users[userId]) {
      // Re-fetch from Razorpay rather than trusting the payload alone.
      const live = await razorpay.fetchSubscription(sub.id);
      const plan = razorpay.planFromProviderPlan(live.plan_id);
      if (plan) {
        if (["subscription.activated", "subscription.charged", "subscription.resumed"].includes(evt.event) && ["active", "authenticated"].includes(live.status)) {
          const amount = evt.event === "subscription.charged" ? evt?.payload?.payment?.entity?.amount ?? planById(plan).priceMonthly : null;
          await activate(userId, { plan, provider: "razorpay", providerRef: live.id, periodEnd: live.current_end ? live.current_end * 1000 : undefined, amount });
        } else if (["subscription.halted", "subscription.pending"].includes(evt.event)) {
          await setStatus(userId, "past_due", { reason: evt.event });
        } else if (["subscription.cancelled", "subscription.completed"].includes(evt.event)) {
          await setStatus(userId, "canceled", { reason: evt.event, endedAt: Date.now() });
        }
      }
    }
    if (eventId) await write((d) => { d.webhookIds[eventId] = Date.now(); });
    return { ok: true };
  }));

  // Google Play Real-time Developer Notifications (Pub/Sub push). The message is only a hint:
  // the purchase token is always re-verified with Google before anything changes.
  app.post("/api/billing/webhook/google-play", express.json({ limit: "64kb" }), h(async (req) => {
    if (!googlePlay.configured()) throw httpError(503, "Google Play Billing is not configured.");
    const data = req.body?.message?.data ? JSON.parse(Buffer.from(req.body.message.data, "base64").toString("utf8")) : null;
    const token = data?.subscriptionNotification?.purchaseToken;
    if (!token) return { ok: true };
    await applyPlayPurchase(token, null);
    return { ok: true };
  }));

}

export function mountAccount(app) {
  app.use(sessionMiddleware);
  app.use("/api/auth", sameOrigin);
  app.use("/api/billing", sameOrigin);

  // ---------- Auth ----------
  app.post("/api/auth/register", h(async (req, res) => {
    if (!rateLimit(`reg:${ip(req)}`, 5, 15 * 60e3)) throw httpError(429, "Too many attempts. Please wait a few minutes.");
    const user = await register(req.body ?? {});
    await logEvent(user.id, "account_created", {});
    await startSession(res, req, user);
    req.user = user;
    return statusFor(req);
  }));
  app.post("/api/auth/login", h(async (req, res) => {
    if (!rateLimit(`login:${ip(req)}`, 10, 15 * 60e3)) throw httpError(429, "Too many attempts. Please wait a few minutes.");
    const user = await verifyPassword(req.body?.email, req.body?.password);
    if (!user) throw httpError(401, "Email or password is incorrect.");
    await startSession(res, req, user);
    req.user = user;
    return statusFor(req);
  }));
  app.post("/api/auth/logout", h(async (req, res) => { await endSession(req, res); return { ok: true }; }));
  app.get("/api/auth/me", h(async (req) => statusFor(req)));

  // ---------- Plans & status ----------
  app.get("/api/billing/plans", h(async () => ({ plans: publicPlans(), providers: providerStatus() })));
  app.get("/api/billing/status", h(async (req) => statusFor(req)));
  app.get("/api/billing/history", requireUser, h(async (req) => ({
    events: read().events.filter((e) => e.userId === req.user.id).slice(-100).reverse(),
    invoices: read().invoices.filter((i) => i.userId === req.user.id).slice(-100).reverse(),
  })));

  // ---------- Checkout ----------
  app.post("/api/billing/checkout", requireUser, h(async (req) => {
    const plan = String(req.body?.plan ?? "");
    const provider = String(req.body?.provider ?? "razorpay");
    if (!PAID.includes(plan)) throw httpError(400, "Choose a paid plan.");
    const current = effectivePlan(req.user.id);
    if (current.id === plan) throw httpError(400, `You're already on ${current.name}.`);
    if (planById(plan).tier < current.tier) throw httpError(400, "To move to a lower plan, use “Change plan” in your billing dashboard; it takes effect at renewal.");
    if (provider === "razorpay") {
      if (!razorpay.configured()) throw httpError(503, "Online payments are not configured yet.");
      const sub = await razorpay.createSubscription(plan, req.user);
      const id = newId("chk");
      await write((d) => { d.checkouts[id] = { id, userId: req.user.id, plan, provider, providerRef: sub.id, createdAt: Date.now() }; });
      await logEvent(req.user.id, "checkout_started", { plan, provider });
      return { provider, checkoutId: id, keyId: razorpay.keyId(), subscriptionId: sub.id, name: "FINOVA", description: planById(plan).name, prefill: { email: req.user.email, name: req.user.name } };
    }
    if (provider === "test") {
      if (!testMode()) throw httpError(403, "Test checkout is disabled.");
      const id = newId("chk");
      await write((d) => { d.checkouts[id] = { id, userId: req.user.id, plan, provider: "test", createdAt: Date.now() }; });
      await logEvent(req.user.id, "checkout_started", { plan, provider: "test" });
      return { provider: "test", checkoutId: id, amount: planById(plan).priceMonthly };
    }
    if (provider === "google_play") {
      if (!googlePlay.configured()) throw httpError(503, "Google Play Billing is not configured.");
      return { provider, productId: googlePlay.productFor(plan), obfuscatedAccountId: googlePlay.accountTag(req.user.id) };
    }
    throw httpError(400, "Unknown payment provider.");
  }));

  // Razorpay: verify the Checkout signature, then confirm the subscription state with Razorpay's API.
  app.post("/api/billing/verify/razorpay", requireUser, h(async (req) => {
    if (!razorpay.configured()) throw httpError(503, "Online payments are not configured yet.");
    const { checkoutId, razorpay_payment_id: paymentId, razorpay_subscription_id: subscriptionId, razorpay_signature: signature } = req.body ?? {};
    const chk = read().checkouts[checkoutId];
    if (!chk || chk.userId !== req.user.id || chk.providerRef !== subscriptionId) throw httpError(400, "This checkout doesn't match your account.");
    if (!razorpay.verifyCheckoutSignature({ paymentId, subscriptionId, signature })) throw httpError(400, "Payment signature could not be verified.");
    const live = await razorpay.fetchSubscription(subscriptionId);
    if (live?.notes?.finova_user !== req.user.id || !["active", "authenticated"].includes(live.status)) throw httpError(400, "Subscription is not active yet. If you were charged, it will activate automatically within a few minutes.");
    const prev = getSub(req.user.id);
    await activate(req.user.id, { plan: chk.plan, provider: "razorpay", providerRef: subscriptionId, periodEnd: live.current_end ? live.current_end * 1000 : undefined, amount: planById(chk.plan).priceMonthly });
    // Upgrade: stop the old Razorpay subscription immediately so the member is never billed twice.
    if (prev?.provider === "razorpay" && prev.providerRef && prev.providerRef !== subscriptionId) {
      await razorpay.api("POST", `/subscriptions/${encodeURIComponent(prev.providerRef)}/cancel`, { cancel_at_cycle_end: 0 }).catch((e) => console.error("[billing] could not cancel previous subscription:", e.message));
    }
    await write((d) => { delete d.checkouts[checkoutId]; });
    return statusFor(req);
  }));

  // Test mode: activates without any payment. Only available when BILLING_TEST_MODE=true on the server.
  app.post("/api/billing/verify/test", requireUser, h(async (req) => {
    if (!testMode()) throw httpError(403, "Test checkout is disabled.");
    const chk = read().checkouts[req.body?.checkoutId];
    if (!chk || chk.userId !== req.user.id || chk.provider !== "test") throw httpError(400, "This checkout doesn't match your account.");
    await activate(req.user.id, { plan: chk.plan, provider: "test", providerRef: chk.id, amount: planById(chk.plan).priceMonthly, test: true });
    await write((d) => { delete d.checkouts[chk.id]; });
    return statusFor(req);
  }));

  // Google Play: the Android app sends the purchase token; the server verifies it with Google.
  app.post("/api/billing/verify/google-play", requireUser, h(async (req) => {
    if (!googlePlay.configured()) throw httpError(503, "Google Play Billing is not configured.");
    const token = String(req.body?.purchaseToken ?? "");
    if (!token || token.length > 4096) throw httpError(400, "Missing purchase token.");
    await applyPlayPurchase(token, req.user.id);
    return statusFor(req);
  }));

  // ---------- Manage ----------
  app.post("/api/billing/change", requireUser, h(async (req) => {
    const plan = String(req.body?.plan ?? "");
    if (!["free", ...PAID].includes(plan)) throw httpError(400, "Unknown plan.");
    const current = effectivePlan(req.user.id);
    if (plan === current.id) throw httpError(400, "You're already on this plan.");
    if (planById(plan).tier > current.tier) return { action: "checkout", plan }; // upgrades go through checkout (payment first)
    const sub = getSub(req.user.id);
    if (sub?.provider === "razorpay" && plan === "free" && razorpay.configured()) await razorpay.cancelAtCycleEnd(sub.providerRef);
    if (sub?.provider === "google_play") throw httpError(400, "Plans bought on Google Play are changed from the Play Store subscriptions screen.");
    await scheduleDowngrade(req.user.id, plan);
    return { action: "scheduled", ...statusFor(req) };
  }));

  app.post("/api/billing/cancel", requireUser, h(async (req) => {
    const sub = getSub(req.user.id);
    if (sub?.provider === "google_play") throw httpError(400, "Cancel Google Play subscriptions from the Play Store subscriptions screen.");
    if (sub?.provider === "razorpay" && razorpay.configured()) await razorpay.cancelAtCycleEnd(sub.providerRef);
    await setCancel(req.user.id, true);
    return statusFor(req);
  }));

  app.post("/api/billing/resume", requireUser, h(async (req) => {
    const sub = getSub(req.user.id);
    if (!sub || sub.currentPeriodEnd < Date.now()) throw httpError(400, "This subscription has already ended. Please subscribe again.");
    if (sub.provider === "razorpay") throw httpError(400, "Razorpay subscriptions can't be resumed after cancellation; you can subscribe again when the period ends.");
    await setCancel(req.user.id, false);
    return statusFor(req);
  }));

  // ---------- AI quota ----------
  app.post("/api/ai/ticket", h(async (req) => {
    const plan = effectivePlan(req.user?.id);
    const r = await consumeAi(quotaKey(req), plan.features.aiDailyLimit);
    if (!r.ok) return Promise.reject(Object.assign(new Error(`You've used today's ${r.limit} FINOVA AI questions on the ${plan.name} plan.${plan.id === "elite" ? "" : " Upgrade for more."}`), { status: 429 }));
    const id = crypto.randomBytes(16).toString("hex");
    tickets.set(id, { exp: Date.now() + 5 * 60e3 });
    return { ticket: id, used: r.used, limit: r.limit };
  }));

  // ---------- Premium analytics & content (server-gated) ----------
  app.post("/api/analytics/trading", h(async (req) => {
    const plan = effectivePlan(req.user?.id);
    return tradingAnalytics(cleanOrders(req.body?.orders), plan.features.tradingAnalytics);
  }));
  app.post("/api/analytics/portfolio", requireFeature((f) => f.portfolioAnalytics !== "basic", "Advanced portfolio analytics are part of FINOVA Pro."), h(async (req) => {
    return portfolioAnalytics(cleanHoldings(req.body?.holdings), req.plan.features.portfolioAnalytics === "insights");
  }));
  app.get("/api/content/masterclasses", h(async (req) => ({
    unlocked: effectivePlan(req.user?.id).features.masterclasses,
    items: MASTERCLASSES.map(({ id, title, summary, minutes, topics }) => ({ id, title, summary, minutes, topics })),
  })));
  app.get("/api/content/masterclasses/:id", requireFeature((f) => f.masterclasses, "Masterclasses are part of FINOVA Elite."), h(async (req) => {
    const m = MASTERCLASSES.find((x) => x.id === req.params.id);
    if (!m) throw httpError(404, "Masterclass not found.");
    return m;
  }));

  // Lifecycle: renewals (test mode), period-end cancellations, scheduled downgrades, grace expiry.
  runLifecycle().catch(() => {});
  setInterval(() => runLifecycle().catch((e) => console.error("[billing] lifecycle:", e.message)), 10 * 60e3).unref();
}

async function applyPlayPurchase(token, expectedUserId) {
  const p = await googlePlay.verify(token);
  const item = p.lineItems?.[0];
  const plan = googlePlay.planFromProduct(item?.productId);
  if (!plan) throw httpError(400, "Unknown Google Play product.");
  const tag = p.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  const userId = expectedUserId ?? Object.values(read().users).find((u) => googlePlay.accountTag(u.id) === tag)?.id;
  if (!userId || googlePlay.accountTag(userId) !== tag) throw httpError(403, "This purchase belongs to a different FINOVA account.");
  const state = p.subscriptionState;
  if (["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"].includes(state)) {
    await activate(userId, { plan, provider: "google_play", providerRef: token.slice(0, 40), periodEnd: Date.parse(item.expiryTime), amount: null, status: state.endsWith("GRACE_PERIOD") ? "past_due" : "active" });
    if (p.acknowledgementState !== "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") await googlePlay.acknowledge(item.productId, token);
  } else if (["SUBSCRIPTION_STATE_CANCELED"].includes(state)) {
    await setStatus(userId, "active", { cancelAtPeriodEnd: true, currentPeriodEnd: Date.parse(item.expiryTime) });
  } else {
    await setStatus(userId, state === "SUBSCRIPTION_STATE_ON_HOLD" ? "past_due" : "canceled", { reason: state });
  }
}

// ---------- analytics helpers (validated inputs) ----------
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function cleanOrders(list) {
  return (Array.isArray(list) ? list.slice(0, 2000) : []).filter((o) => o && o.status === "EXECUTED").map((o) => ({
    symbol: String(o.symbol ?? "").slice(0, 24), name: String(o.name ?? "").slice(0, 80), kind: o.kind === "fund" ? "fund" : "stock",
    side: o.side === "SELL" ? "SELL" : "BUY", qty: num(o.qty), price: num(o.price), amount: num(o.amount), charges: num(o.charges),
    pnl: o.pnl == null ? null : num(o.pnl), at: num(o.executedAt ?? o.placedAt),
  }));
}
function cleanHoldings(list) {
  return (Array.isArray(list) ? list.slice(0, 500) : []).map((h) => ({
    symbol: String(h.symbol ?? "").slice(0, 24), name: String(h.name ?? "").slice(0, 80), kind: h.kind === "fund" ? "fund" : "stock",
    qty: num(h.qty), avg: num(h.avg), price: num(h.price), category: String(h.category ?? "").slice(0, 80),
  })).filter((h) => h.qty > 0);
}

function tradingAnalytics(orders, level) {
  const sells = orders.filter((o) => o.side === "SELL" && o.pnl != null);
  const wins = sells.filter((o) => o.pnl > 0), losses = sells.filter((o) => o.pnl <= 0);
  const realised = sells.reduce((a, o) => a + o.pnl, 0);
  const basic = { level, trades: orders.length, buys: orders.filter((o) => o.side === "BUY").length, sells: sells.length, realised, charges: orders.reduce((a, o) => a + o.charges, 0) };
  if (level === "basic") return basic;
  const sum = (a) => a.reduce((x, o) => x + o.pnl, 0);
  const avgWin = wins.length ? sum(wins) / wins.length : 0, avgLoss = losses.length ? sum(losses) / losses.length : 0;
  const bySymbol = Object.values(sells.reduce((m, o) => { const k = o.symbol; m[k] = m[k] ?? { symbol: k, name: o.name, trades: 0, pnl: 0, wins: 0 }; m[k].trades++; m[k].pnl += o.pnl; if (o.pnl > 0) m[k].wins++; return m; }, {})).sort((a, b) => b.pnl - a.pnl);
  const advanced = {
    ...basic, winRate: sells.length ? wins.length / sells.length : null, avgWin, avgLoss,
    profitFactor: losses.length && sum(losses) !== 0 ? sum(wins) / Math.abs(sum(losses)) : null,
    expectancy: sells.length ? realised / sells.length : null,
    best: sells.reduce((b, o) => (!b || o.pnl > b.pnl ? o : b), null), worst: sells.reduce((b, o) => (!b || o.pnl < b.pnl ? o : b), null),
    bySymbol: bySymbol.slice(0, 20),
  };
  if (level !== "report") return advanced;
  const sorted = [...sells].sort((a, b) => a.at - b.at);
  let eq = 0, peak = 0, maxDd = 0, streak = 0, bestStreak = 0, worstStreak = 0;
  const curve = sorted.map((o) => {
    eq += o.pnl; peak = Math.max(peak, eq); maxDd = Math.min(maxDd, eq - peak);
    streak = o.pnl > 0 ? (streak > 0 ? streak + 1 : 1) : (streak < 0 ? streak - 1 : -1);
    bestStreak = Math.max(bestStreak, streak); worstStreak = Math.min(worstStreak, streak);
    return { at: o.at, equity: Math.round(eq * 100) / 100 };
  });
  const monthly = Object.values(sorted.reduce((m, o) => { const k = new Date(o.at).toISOString().slice(0, 7); m[k] = m[k] ?? { month: k, trades: 0, pnl: 0, wins: 0 }; m[k].trades++; m[k].pnl += o.pnl; if (o.pnl > 0) m[k].wins++; return m; }, {}));
  return { ...advanced, report: { curve, maxDrawdown: maxDd, longestWinStreak: bestStreak, longestLossStreak: -worstStreak, monthly, generatedAt: Date.now() } };
}

function portfolioAnalytics(holdings, insights) {
  const rows = holdings.map((h) => ({ ...h, value: (h.price || h.avg) * h.qty, cost: h.avg * h.qty }));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  const cls = (r) => (r.kind === "stock" ? "Stocks" : /Liquid|Overnight|Money Market|Debt|Bond|Gilt|Duration|Credit|Income/i.test(r.category) ? "Debt funds" : /Hybrid|Balanced|Asset Allocation|Arbitrage/i.test(r.category) ? "Hybrid funds" : "Equity funds");
  const byClass = Object.entries(rows.reduce((m, r) => { m[cls(r)] = (m[cls(r)] ?? 0) + r.value; return m; }, {})).map(([name, value]) => ({ name, value, weight: value / total }));
  const weights = rows.map((r) => r.value / total).sort((a, b) => b - a);
  const hhi = weights.reduce((a, w) => a + w * w, 0);
  const out = {
    total, cost: rows.reduce((a, r) => a + r.cost, 0), byClass, topWeight: weights[0] ?? 0,
    effectiveHoldings: hhi ? 1 / hhi : 0, diversificationScore: Math.round(Math.min(100, (1 - hhi) * 100 * Math.min(1, byClass.length / 3 + 0.34))),
    winners: rows.filter((r) => r.value > r.cost).length, losers: rows.filter((r) => r.value < r.cost).length,
  };
  if (!insights) return out;
  const notes = [];
  if (out.topWeight > 0.35) notes.push({ level: "warn", text: `Your largest holding is ${(out.topWeight * 100).toFixed(0)}% of the portfolio. A single position above ~20–25% means one company or fund drives most of your result.` });
  if (byClass.length === 1) notes.push({ level: "warn", text: `Everything is in ${byClass[0].name.toLowerCase()}. Adding a different asset type (e.g. debt funds) usually reduces swings.` });
  const equity = byClass.filter((c) => c.name === "Stocks" || c.name === "Equity funds").reduce((a, c) => a + c.weight, 0);
  notes.push({ level: "info", text: `About ${(equity * 100).toFixed(0)}% of your portfolio is equity. Equity-heavy portfolios can fall 30%+ in bad years; match this to your time horizon.` });
  if (out.effectiveHoldings < 5 && rows.length >= 1) notes.push({ level: "info", text: `By weight, your portfolio behaves like about ${out.effectiveHoldings.toFixed(1)} equal holdings. More, smaller positions spread company-specific risk.` });
  if (out.losers > out.winners) notes.push({ level: "info", text: "More holdings are below cost than above. Review each against your original reason for buying rather than the price alone." });
  return { ...out, insights: notes };
}
