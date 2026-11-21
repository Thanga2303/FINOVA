import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { account, rupees, useAccount, type Plan, type PlanId } from "../lib/account";
import { TiltCard } from "../components/fx";
import { Icon, Page } from "../components/ui";

const ROWS: [string, (p: Plan) => string | boolean][] = [
  ["Paper trading (stocks & funds)", () => true],
  ["Charts (line & candles)", () => true],
  ["Advanced indicators (RSI, patterns)", (p) => p.features.advancedIndicators],
  ["Academy lessons", (p) => (p.features.academyLevels.length === 1 ? "Beginner level" : "All 65 lessons")],
  ["Premium masterclasses", (p) => p.features.masterclasses],
  ["Portfolio analytics", (p) => ({ basic: "Basic", advanced: "Advanced", insights: "Advanced + insights" })[p.features.portfolioAnalytics]],
  ["Paper-trading analytics", (p) => ({ basic: "Basic", advanced: "Advanced", report: "Advanced + reports" })[p.features.tradingAnalytics]],
  ["Trading journal", (p) => (p.features.journal === "full" ? "Full, unlimited" : `Basic, ${p.features.journalLimit} entries`)],
  ["FINOVA AI questions per day", (p) => String(p.features.aiDailyLimit)],
  ["Ad-free", (p) => p.features.adFree],
];

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [params] = useSearchParams();
  const highlight = params.get("highlight") as PlanId | null;
  const next = params.get("next");
  const { plan: current, user } = useAccount();
  const nav = useNavigate();
  useEffect(() => { account.plans().then((r) => setPlans(r.plans)).catch(() => setPlans([])); }, []);

  const choose = (id: PlanId) => {
    if (id === "free") return nav(user ? "/account" : "/account?mode=signup");
    const target = `/checkout?plan=${id}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
    nav(user ? target : `/account?mode=signup&next=${encodeURIComponent(target)}`);
  };

  return (
    <Page>
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan mb-3">Membership</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold">Invest in how you learn</h1>
        <p className="text-muted mt-3 text-lg">Start free. Upgrade when you want deeper analytics, the full academy and more AI.</p>
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-5 items-stretch">
        {(plans ?? []).map((p) => {
          const isCurrent = current.id === p.id;
          const featured = (highlight ?? "pro") === p.id;
          return (
            <TiltCard key={p.id} max={4} className={`p-6 sm:p-7 flex flex-col ${featured ? "!border-cyan/60 shadow-[0_0_60px_-20px_var(--cyan)]" : ""}`}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                  {featured && !isCurrent && <span className="chip !text-cyan !border-cyan/50">{p.id === "pro" ? "Most popular" : "Recommended"}</span>}
                  {isCurrent && <span className="chip !text-emerald !border-emerald/50">Current plan</span>}
                </div>
                <p className="text-sm text-muted mt-1">{p.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold">{p.priceMonthly ? rupees(p.priceMonthly) : "₹0"}</span>
                  <span className="text-muted text-sm">{p.priceMonthly ? "/month" : "forever"}</span>
                </div>
                <p className="text-[11px] text-faint mt-1">{p.priceMonthly ? "Billed monthly. Cancel anytime; access continues to the end of the paid period." : "No card needed."}</p>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {p.highlights.map((h) => <li key={h} className="flex gap-2"><Icon name="check" className="w-4 h-4 text-emerald shrink-0 mt-0.5" /><span>{h}</span></li>)}
                </ul>
                <button onClick={() => choose(p.id)} disabled={isCurrent} className={`${featured ? "btn-primary" : "btn-ghost"} mt-7 w-full disabled:opacity-50`}>
                  {isCurrent ? "Your current plan" : p.id === "free" ? (user ? "Manage plan" : "Start free") : current.tier > p.tier ? `Switch to ${p.name}` : `Get ${p.name}`}
                </button>
              </div>
            </TiltCard>
          );
        })}
        {!plans && [0, 1, 2].map((i) => <div key={i} className="h-[30rem] rounded-3xl bg-card animate-pulse" />)}
      </div>

      {plans && plans.length > 0 && (
        <section className="mt-14 glass rounded-3xl p-5 sm:p-7 overflow-x-auto scroll-thin">
          <h2 className="font-display text-2xl font-semibold mb-4">Compare plans</h2>
          <table className="w-full text-sm min-w-[620px]">
            <thead><tr className="text-left border-b border-line"><th className="py-3 font-medium text-muted">Feature</th>{plans.map((p) => <th key={p.id} className="py-3 font-semibold">{p.name}</th>)}</tr></thead>
            <tbody>
              {ROWS.map(([label, fn]) => (
                <tr key={label} className="border-b border-line/60">
                  <td className="py-3 text-muted">{label}</td>
                  {plans.map((p) => { const v = fn(p); return <td key={p.id} className="py-3">{v === true ? <Icon name="check" className="w-5 h-5 text-emerald" /> : v === false ? <span className="text-faint">—</span> : v}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-10 grid md:grid-cols-3 gap-4 text-sm">
        {[
          ["Secure payments", "Web payments are processed by Razorpay; Android purchases by Google Play. FINOVA never sees or stores your card or UPI details."],
          ["Cancel anytime", "Cancel from your billing dashboard. You keep paid features until the end of the period you've paid for."],
          ["Education only", "Every plan is for learning and paper trading. FINOVA never executes real trades or gives investment advice."],
        ].map(([t, d]) => <div key={t} className="rounded-2xl border border-line bg-card p-5"><div className="font-semibold">{t}</div><p className="text-muted mt-1">{d}</p></div>)}
      </section>
      <p className="text-center text-xs text-faint mt-8">Prices are in Indian rupees. Any applicable taxes are confirmed before you pay. Questions? See your <Link to="/account" className="underline">billing dashboard</Link>.</p>
    </Page>
  );
}
