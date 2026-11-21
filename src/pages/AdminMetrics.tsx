import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { rupees, useAccount } from "../lib/account";
import { Page } from "../components/ui";

/** Revenue & conversion dashboard. The server only returns data to accounts listed in ADMIN_EMAILS. */
type Report = {
  window: { days: number };
  subscriptions: { active: number; byPlan: Record<string, number>; byProvider: Record<string, number>; testActive: number; mrrPaise: number; cancelling: number };
  revenue: { verifiedPaise: number; byProvider: Record<string, number>; invoices: number; note: string };
  conversion: { signups: number; pricingViews: number; paywallViews: number; checkoutViews: number; checkoutStarts: number; newSubscriptions: number; upgrades: number; cancellations: number; expirations: number; restores: number; checkoutToPaid: number | null };
  ads: { impressions: number; estimatedRevenueMicros: Record<string, number>; consent: Record<string, number>; note: string };
  daily: { day: string; pricing_views: number; checkout_starts: number; ad_impressions: number }[];
};

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="glass rounded-2xl p-4"><div className="text-xs text-muted">{label}</div><div className="font-display text-2xl font-semibold mt-1 tabular-nums">{value}</div>{sub && <div className="text-[11px] text-faint mt-0.5">{sub}</div>}</div>
);

export default function AdminMetrics() {
  const { user, loaded } = useAccount();
  const [days, setDays] = useState(30);
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    setErr(null);
    fetch(`/api/admin/metrics?days=${days}`, { credentials: "same-origin" }).then(async (x) => { const j = await x.json(); if (!x.ok) throw new Error(j.error ?? "Failed"); setR(j); }).catch((e) => setErr(e.message));
  }, [user, days]);
  if (loaded && !user) return <Page><p className="text-muted">Sign in with an admin account. <Link className="text-cyan" to="/account?mode=signin&next=/admin/metrics">Sign in</Link></p></Page>;
  const c = r?.conversion;
  const pct = (n: number | null | undefined) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);
  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Admin</div><h1 className="font-display text-4xl font-semibold">Revenue & conversion</h1></div>
        <div className="flex gap-1">{[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} className={`chip ${d === days ? "!text-cyan !border-cyan/50" : ""}`}>{d} days</button>)}</div>
      </div>
      {err && <p className="mt-6 text-rose" role="alert">{err}</p>}
      {r && c && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="MRR (renewing, verified)" value={rupees(r.subscriptions.mrrPaise)} sub={`${r.subscriptions.cancelling} cancelling at period end`} />
            <Stat label="Active paid members" value={r.subscriptions.active} sub={Object.entries(r.subscriptions.byPlan).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"} />
            <Stat label={`Verified revenue · ${days}d`} value={rupees(r.revenue.verifiedPaise)} sub={Object.entries(r.revenue.byProvider).map(([k, v]) => `${k} ${rupees(v)}`).join(" · ") || "no payments"} />
            <Stat label={`Ad impressions · ${days}d`} value={r.ads.impressions} sub={Object.entries(r.ads.estimatedRevenueMicros).map(([cur, m]) => `≈ ${(m / 1e6).toFixed(2)} ${cur}`).join(" · ") || "no paid events"} />
          </div>
          <section className="glass rounded-3xl p-5">
            <h2 className="font-semibold mb-3">Conversion funnel</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              {[["Sign-ups", c.signups], ["Pricing views", c.pricingViews], ["Paywall views", c.paywallViews], ["Checkout views", c.checkoutViews], ["Checkout starts", c.checkoutStarts], ["New paid members", c.newSubscriptions]].map(([k, v]) => <div key={k as string}><div className="text-xs text-muted">{k}</div><div className="font-display text-xl font-semibold tabular-nums">{v}</div></div>)}
            </div>
            <p className="text-xs text-muted mt-3">Checkout start → paid: <span className="text-text">{pct(c.checkoutToPaid)}</span> · Upgrades {c.upgrades} · Cancellations {c.cancellations} · Expired {c.expirations} · Restores {c.restores}</p>
          </section>
          {r.daily.length > 0 && (
            <section className="glass rounded-3xl p-5">
              <h2 className="font-semibold mb-3">Daily activity</h2>
              <div className="h-64"><ResponsiveContainer><BarChart data={r.daily}><CartesianGrid strokeOpacity={0.1} vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} /><Tooltip /><Bar dataKey="pricing_views" name="Pricing views" fill="var(--color-cyan, #00D4FF)" /><Bar dataKey="checkout_starts" name="Checkout starts" fill="var(--color-violet, #8B5CF6)" /><Bar dataKey="ad_impressions" name="Ad impressions" fill="var(--color-amber, #F5B342)" /></BarChart></ResponsiveContainer></div>
            </section>
          )}
          <p className="text-xs text-faint">{r.revenue.note} {r.ads.note} Test-mode memberships ({r.subscriptions.testActive}) are excluded.</p>
        </div>
      )}
    </Page>
  );
}
