import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { planLabel, useAccount, type Features } from "../lib/account";
import { Icon } from "./ui";
import { useEffect } from "react";
import { isAndroidApp } from "../lib/native/platform";
import { track } from "../lib/metrics";

/** Upgrade prompt shown in place of a locked feature. */
export function Locked({ plan, title, text, compact }: { plan: "pro" | "elite"; title: string; text?: string; compact?: boolean }) {
  const loc = useLocation();
  useEffect(() => { track("paywall_view", { feature: title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32) }); }, [title]);
  return (
    <div className={`rounded-3xl border border-cyan/25 bg-gradient-to-br from-cyan/5 via-transparent to-violet/10 ${compact ? "p-4" : "p-6 sm:p-8"} text-center`}>
      <div className="mx-auto w-11 h-11 rounded-2xl grid place-items-center bg-bg2 border border-cyan/30 text-cyan"><Icon name="shield" className="w-5 h-5" /></div>
      <div className="mt-3 font-display text-lg font-semibold">{title}</div>
      {text && <p className="text-sm text-muted mt-1 max-w-md mx-auto">{text}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to={`/pricing?highlight=${plan}&next=${encodeURIComponent(loc.pathname + loc.search)}`} className="btn-primary !py-2 text-sm">Unlock with {planLabel(plan)}</Link>
        <Link to="/pricing" className="btn-ghost !py-2 text-sm">Compare plans</Link>
      </div>
    </div>
  );
}

/** Renders children only if the server-verified plan includes the feature. */
export function FeatureGate({ allow, plan, title, text, children, compact }: { allow: (f: Features) => boolean; plan: "pro" | "elite"; title: string; text?: string; children: ReactNode; compact?: boolean }) {
  const { features, loaded } = useAccount();
  if (!loaded) return <div className="h-32 rounded-3xl bg-card animate-pulse" />;
  return allow(features) ? <>{children}</> : <Locked plan={plan} title={title} text={text} compact={compact} />;
}

export function PlanBadge({ className = "" }: { className?: string }) {
  const { plan, user } = useAccount();
  const color = plan.id === "elite" ? "!text-amber !border-amber/40" : plan.id === "pro" ? "!text-cyan !border-cyan/40" : "";
  return (
    <Link to={user ? "/account" : "/account?mode=signin"} className={`chip whitespace-nowrap ${color} ${className}`} title="Your membership">
      {user ? plan.name : "Sign in"}
    </Link>
  );
}

/** Promotional card for Free members ("advertisements where appropriate"). House promotions only; hidden on paid plans. */
const PROMOS = [
  { title: "Go ad-free with FINOVA Pro", text: "Advanced indicators, full academy, deeper analytics and 100 AI questions a day for ₹149/month.", to: "/pricing?highlight=pro", cta: "See Pro" },
  { title: "Masterclasses are here", text: "Read annual reports like an analyst and build your allocation plan with FINOVA Elite.", to: "/pricing?highlight=elite", cta: "See Elite" },
  { title: "Track every trade", text: "Use the trading journal to record why you entered, how you felt and what you learned.", to: "/investments?tab=journal", cta: "Open journal" },
];
export function AdSlot({ index = 0, className = "" }: { index?: number; className?: string }) {
  const { features, loaded } = useAccount();
  // House promotions on the website only; the Android app uses AdMob placements instead (src/lib/ads).
  if (!loaded || features.adFree || isAndroidApp) return null;
  const p = PROMOS[index % PROMOS.length];
  return (
    <aside className={`rounded-2xl border border-line bg-card px-4 py-3 flex flex-wrap items-center gap-3 ${className}`} aria-label="Promotion">
      <span className="text-[10px] uppercase tracking-widest text-faint border border-line rounded px-1.5 py-0.5">Promoted</span>
      <div className="flex-1 min-w-[12rem]"><div className="text-sm font-semibold">{p.title}</div><div className="text-xs text-muted">{p.text}</div></div>
      <Link to={p.to} className="chip !text-cyan">{p.cta}</Link>
    </aside>
  );
}
