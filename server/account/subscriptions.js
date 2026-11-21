// Subscription lifecycle and entitlements. The ONLY source of truth for a user's plan is this server-side record,
// written after a verified payment (provider API check, signature-verified webhook, or explicit test mode).
import { newId } from "./auth.js";
import { read, write } from "./db.js";
import { GRACE_DAYS, PAID, planById, PLANS } from "./plans.js";

const MONTH_MS = 30 * 864e5;

export function getSub(userId) {
  return read().subscriptions[userId] ?? null;
}

/** Resolve the effective plan right now, applying expiry, cancellation and grace rules. */
export function effectivePlan(userId) {
  const s = userId ? getSub(userId) : null;
  if (!s || !PAID.includes(s.plan)) return PLANS.free;
  const now = Date.now();
  if (s.status === "active" || s.status === "trialing") {
    if (s.currentPeriodEnd > now) return planById(s.plan);
    if (s.currentPeriodEnd + GRACE_DAYS * 864e5 > now && !s.cancelAtPeriodEnd) return planById(s.plan); // late renewal grace
  }
  if (s.status === "past_due" && s.currentPeriodEnd + GRACE_DAYS * 864e5 > now) return planById(s.plan);
  return PLANS.free;
}

export async function logEvent(userId, type, detail = {}) {
  await write((d) => { d.events.push({ id: newId("evt"), userId, type, detail, at: Date.now() }); if (d.events.length > 20000) d.events.splice(0, d.events.length - 20000); });
}

export async function addInvoice(userId, inv) {
  await write((d) => { d.invoices.push({ id: newId("inv"), userId, at: Date.now(), ...inv }); });
}

/** Activate or renew a paid plan after verification. */
export async function activate(userId, { plan, provider, providerRef, periodEnd, amount, test = false, status = "active" }) {
  const prev = getSub(userId);
  const now = Date.now();
  const sub = {
    userId, plan, provider, providerRef: providerRef ?? prev?.providerRef ?? null, status, test,
    startedAt: prev?.plan === plan && prev?.status === "active" ? prev.startedAt : now,
    currentPeriodStart: now, currentPeriodEnd: periodEnd ?? now + MONTH_MS,
    cancelAtPeriodEnd: false, scheduledPlan: null, updatedAt: now,
  };
  await write((d) => { d.subscriptions[userId] = sub; });
  const kind = !prev || !PAID.includes(prev.plan) || effectivePlan(userId).id === "free" ? "subscribed" : prev.plan === plan ? "renewed" : planById(plan).tier > planById(prev.plan).tier ? "upgraded" : "changed";
  await logEvent(userId, kind, { plan, provider, test, providerRef: sub.providerRef });
  if (amount != null) await addInvoice(userId, { plan, amount, currency: "INR", provider, status: "paid", test, providerRef: sub.providerRef, periodEnd: sub.currentPeriodEnd });
  return sub;
}

export async function setCancel(userId, cancel) {
  const s = getSub(userId);
  if (!s || !PAID.includes(s.plan)) throw Object.assign(new Error("You don't have a paid plan to cancel."), { status: 400 });
  await write((d) => { d.subscriptions[userId] = { ...s, cancelAtPeriodEnd: cancel, scheduledPlan: cancel ? "free" : null, updatedAt: Date.now() }; });
  await logEvent(userId, cancel ? "cancel_scheduled" : "cancel_reverted", { plan: s.plan, periodEnd: s.currentPeriodEnd });
  return getSub(userId);
}

export async function scheduleDowngrade(userId, plan) {
  const s = getSub(userId);
  if (!s) throw Object.assign(new Error("No subscription to change."), { status: 400 });
  await write((d) => { d.subscriptions[userId] = { ...s, scheduledPlan: plan, cancelAtPeriodEnd: plan === "free", updatedAt: Date.now() }; });
  await logEvent(userId, "downgrade_scheduled", { from: s.plan, to: plan, effectiveAt: s.currentPeriodEnd });
  return getSub(userId);
}

export async function setStatus(userId, status, extra = {}) {
  const s = getSub(userId);
  if (!s) return null;
  await write((d) => { d.subscriptions[userId] = { ...s, status, ...extra, updatedAt: Date.now() }; });
  await logEvent(userId, `status_${status}`, { plan: s.plan, ...extra });
  return getSub(userId);
}

/**
 * Periodic lifecycle pass: ends cancelled plans at period end, applies scheduled downgrades,
 * and auto-renews TEST-mode subscriptions (real provider renewals arrive via verified webhooks).
 */
export async function runLifecycle() {
  const now = Date.now();
  for (const s of Object.values(read().subscriptions)) {
    if (!PAID.includes(s.plan) || s.currentPeriodEnd > now) continue;
    if (s.cancelAtPeriodEnd || s.scheduledPlan === "free") {
      await write((d) => { d.subscriptions[s.userId] = { ...s, status: "canceled", endedAt: now, updatedAt: now }; });
      await logEvent(s.userId, "expired", { plan: s.plan, reason: "canceled at period end" });
    } else if (s.scheduledPlan && s.scheduledPlan !== s.plan && s.test) {
      await activate(s.userId, { plan: s.scheduledPlan, provider: s.provider, providerRef: s.providerRef, amount: planById(s.scheduledPlan).priceMonthly, test: true });
    } else if (s.test && s.status === "active") {
      await activate(s.userId, { plan: s.plan, provider: s.provider, providerRef: s.providerRef, amount: planById(s.plan).priceMonthly, test: true });
    } else if (s.status === "active" && s.currentPeriodEnd + GRACE_DAYS * 864e5 < now) {
      await write((d) => { d.subscriptions[s.userId] = { ...s, status: "expired", updatedAt: now }; });
      await logEvent(s.userId, "expired", { plan: s.plan, reason: "no renewal payment received" });
    }
  }
}

// ---- AI usage quotas (server-enforced) ----
const day = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function aiUsage(key) {
  const u = read().usage[key];
  return u && u.day === day() ? u.count : 0;
}

export async function consumeAi(key, limit) {
  const used = aiUsage(key);
  if (used >= limit) return { ok: false, used, limit };
  await write((d) => { d.usage[key] = { day: day(), count: used + 1 }; });
  return { ok: true, used: used + 1, limit };
}
