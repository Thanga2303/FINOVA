import { read, write } from "./db.js";
import { PAID, planById } from "./plans.js";

/**
 * Revenue & conversion analytics. Client events are aggregated into anonymous daily counters
 * (event × platform × one whitelisted dimension). Money figures for subscriptions come only from
 * server-verified subscription records; ad revenue is the SDK's client-reported estimate, and the AdMob
 * console remains the source of truth for payouts.
 */
const EVENTS = {
  pricing_view: [], checkout_view: ["plan"], checkout_start: ["plan", "provider"], paywall_view: ["feature"], upgrade_click: ["plan", "from"],
  ad_consent: ["result"], ad_impression: ["format", "placement"], ad_paid: ["format", "currency", "precision"],
};
const PLATFORMS = new Set(["web", "android", "ios"]);
const clean = (v) => String(v ?? "").replace(/[^a-z0-9_\-]/gi, "").slice(0, 32) || "none";
const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export async function recordClientEvents(list) {
  const events = (Array.isArray(list) ? list : []).slice(0, 50);
  await write((d) => {
    d.metrics = d.metrics ?? {};
    for (const ev of events) {
      const dims = EVENTS[ev?.e];
      if (!dims) continue;
      const p = ev.p ?? {};
      const plat = PLATFORMS.has(p.platform) ? p.platform : "web";
      const dkey = day();
      const bucket = (d.metrics[dkey] = d.metrics[dkey] ?? {});
      const key = [ev.e, plat, ...dims.map((k) => clean(p[k]))].join("|");
      bucket[key] = (bucket[key] ?? 0) + 1;
      if (ev.e === "ad_paid") {
        const micros = Math.max(0, Math.min(Number(p.valueMicros) || 0, 50_000_000)); // clamp: one impression can't be worth > 50 units
        const rk = `ad_revenue_micros|${plat}|${clean(p.currency)}`;
        bucket[rk] = (bucket[rk] ?? 0) + micros;
      }
    }
    // keep 400 days
    const keys = Object.keys(d.metrics).sort();
    while (keys.length > 400) delete d.metrics[keys.shift()];
  });
}

/** Admin report for the last `days` days. */
export function report(days = 30) {
  const d = read();
  const since = Date.now() - days * 864e5;
  const subs = Object.values(d.subscriptions);
  const now = Date.now();
  const live = subs.filter((s) => PAID.includes(s.plan) && ["active", "past_due", "trialing"].includes(s.status) && s.currentPeriodEnd > now - 3 * 864e5);
  const real = live.filter((s) => !s.test);
  const byPlan = {}; const byProvider = {};
  for (const s of real) { byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1; byProvider[s.provider] = (byProvider[s.provider] ?? 0) + 1; }
  const mrrPaise = real.filter((s) => !s.cancelAtPeriodEnd).reduce((a, s) => a + planById(s.plan).priceMonthly, 0);

  const events = d.events.filter((e) => e.at >= since);
  const count = (type, pred = () => true) => events.filter((e) => e.type === type && pred(e)).length;
  const realEv = (e) => !e.detail?.test;
  const invoices = d.invoices.filter((i) => i.at >= since && !i.test && i.status === "paid");
  const revenueByProvider = {};
  for (const i of invoices) revenueByProvider[i.provider] = (revenueByProvider[i.provider] ?? 0) + i.amount;

  // client counters
  const counters = {}; const daily = [];
  for (const [dk, bucket] of Object.entries(d.metrics ?? {}).sort()) {
    if (Date.parse(dk) < since - 864e5) continue;
    const row = { day: dk, pricing_views: 0, checkout_starts: 0, ad_impressions: 0, ad_revenue_micros: 0 };
    for (const [k, v] of Object.entries(bucket)) {
      counters[k] = (counters[k] ?? 0) + v;
      const [name] = k.split("|");
      if (name === "pricing_view") row.pricing_views += v;
      if (name === "checkout_start") row.checkout_starts += v;
      if (name === "ad_impression") row.ad_impressions += v;
      if (name === "ad_revenue_micros") row.ad_revenue_micros += v;
    }
    daily.push(row);
  }
  const sum = (prefix) => Object.entries(counters).filter(([k]) => k.startsWith(prefix + "|")).reduce((a, [, v]) => a + v, 0);
  const newSubs = count("subscribed", realEv);
  const adRevenue = {};
  for (const [k, v] of Object.entries(counters)) if (k.startsWith("ad_revenue_micros|")) { const cur = k.split("|")[2]; adRevenue[cur] = (adRevenue[cur] ?? 0) + v; }

  return {
    window: { days, since },
    subscriptions: { active: real.length, byPlan, byProvider, testActive: live.length - real.length, mrrPaise, cancelling: real.filter((s) => s.cancelAtPeriodEnd).length },
    revenue: { verifiedPaise: invoices.reduce((a, i) => a + i.amount, 0), byProvider: revenueByProvider, invoices: invoices.length, note: "Sum of server-verified payments (provider fees and taxes not deducted)." },
    conversion: {
      signups: count("account_created"), pricingViews: sum("pricing_view"), paywallViews: sum("paywall_view"), checkoutViews: sum("checkout_view"), checkoutStarts: sum("checkout_start"),
      newSubscriptions: newSubs, upgrades: count("upgraded", realEv), cancellations: count("cancel_scheduled"), expirations: count("expired") + count("status_expired"), restores: count("restore_attempted"),
      checkoutToPaid: sum("checkout_start") ? newSubs / sum("checkout_start") : null,
    },
    ads: { impressions: sum("ad_impression"), estimatedRevenueMicros: adRevenue, consent: Object.fromEntries(Object.entries(counters).filter(([k]) => k.startsWith("ad_consent|")).map(([k, v]) => [k.split("|").slice(1).join(" · "), v])), note: "Client-reported AdMob paid events (estimates). Use the AdMob console for actual earnings." },
    daily,
  };
}
