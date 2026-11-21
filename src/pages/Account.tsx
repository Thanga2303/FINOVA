import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { account, planLabel, rupees, useAccount, type PlanId } from "../lib/account";
import { Icon, Page, Ring } from "../components/ui";

const EVENT_LABEL: Record<string, string> = {
  account_created: "Account created", checkout_started: "Checkout started", subscribed: "Subscribed", renewed: "Renewed", upgraded: "Upgraded", changed: "Plan changed",
  cancel_scheduled: "Cancellation scheduled", cancel_reverted: "Cancellation undone", downgrade_scheduled: "Downgrade scheduled", expired: "Membership ended",
  status_past_due: "Payment overdue", status_canceled: "Cancelled", status_active: "Active",
};
const fmt = (t?: number) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function AuthForm() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const next = params.get("next");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (mode === "signup") await account.register(email, password, name); else await account.login(email, password);
      if (next && next.startsWith("/")) nav(next);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-md mx-auto glass rounded-3xl p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line p-1 mb-6" role="tablist">
        {(["signin", "signup"] as const).map((m) => <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr(null); }} className={`rounded-xl py-2 text-sm font-semibold ${mode === m ? "bg-card-strong text-text" : "text-muted"}`}>{m === "signin" ? "Sign in" : "Create account"}</button>)}
      </div>
      <h1 className="font-display text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Join FINOVA"}</h1>
      <p className="text-sm text-muted mt-1">{mode === "signin" ? "Sign in to manage your membership." : "Free forever. Upgrade any time."}</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === "signup" && <label className="block text-sm"><span className="text-muted">Name</span><input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} /></label>}
        <label className="block text-sm"><span className="text-muted">Email</span><input className="field mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="block text-sm"><span className="text-muted">Password</span><input className="field mt-1" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          {mode === "signup" && <span className="text-xs text-faint">At least 8 characters, with a letter and a number.</span>}</label>
        {err && <p className="text-sm text-rose" role="alert">{err}</p>}
        <button className="btn-primary w-full disabled:opacity-50" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create free account"}</button>
      </form>
      <p className="text-xs text-faint mt-5">Your learning progress, wallet and paper portfolio stay in this browser. Your account holds your membership.</p>
    </div>
  );
}

function Billing() {
  const { status, plan, user } = useAccount();
  const [hist, setHist] = useState<Awaited<ReturnType<typeof account.history>> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const sub = status?.subscription;
  useEffect(() => { account.history().then(setHist).catch(() => {}); }, [status]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg(ok); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const change = (to: PlanId) => act(async () => {
    const r = await account.change(to);
    if (r.action === "checkout") nav(`/checkout?plan=${to}`);
  }, to === "free" ? "Your plan will end at the close of the current period." : `Your plan will change to ${planLabel(to)} at renewal.`);

  const aiPct = status ? status.ai.used / Math.max(1, status.ai.limit) : 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Account</div>
          <h1 className="font-display text-4xl font-semibold">Billing & membership</h1>
          <p className="text-muted mt-1">{user?.name} · {user?.email}</p>
        </div>
        <button className="btn-ghost !py-2 text-sm" onClick={() => account.logout()}>Sign out</button>
      </div>

      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="glass rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted">Current plan</div>
              <div className={`font-display text-3xl font-semibold mt-1 ${plan.id === "elite" ? "text-amber" : plan.id === "pro" ? "text-cyan" : ""}`}>{plan.name}</div>
              {sub ? (
                <div className="text-sm text-muted mt-2 space-y-1">
                  <div>Status: <span className={`font-semibold ${sub.status === "active" ? "text-emerald" : "text-amber"}`}>{sub.status.replace("_", " ")}</span>{sub.test && <span className="chip !text-amber ml-2">Test mode</span>}</div>
                  <div>{sub.cancelAtPeriodEnd ? "Ends on" : "Renews on"} <span className="text-text">{fmt(sub.currentPeriodEnd)}</span>{sub.scheduledPlan && sub.scheduledPlan !== "free" ? ` · switching to ${planLabel(sub.scheduledPlan)}` : ""}</div>
                  <div>Paid via {sub.provider === "razorpay" ? "Razorpay" : sub.provider === "google_play" ? "Google Play" : "test checkout"} · member since {fmt(sub.startedAt)}</div>
                </div>
              ) : <p className="text-sm text-muted mt-2">You're on the free plan.</p>}
            </div>
            <Link to="/pricing" className="btn-primary !py-2 text-sm">{plan.id === "free" ? "Upgrade" : "Compare plans"}</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {plan.id === "free" && <><button className="btn-ghost !py-2 text-sm" onClick={() => nav("/checkout?plan=pro")}>Upgrade to Pro · ₹149/mo</button><button className="btn-ghost !py-2 text-sm" onClick={() => nav("/checkout?plan=elite")}>Upgrade to Elite · ₹299/mo</button></>}
            {plan.id === "pro" && <button className="btn-ghost !py-2 text-sm" disabled={busy} onClick={() => change("elite")}>Upgrade to Elite</button>}
            {plan.id === "elite" && <button className="btn-ghost !py-2 text-sm" disabled={busy} onClick={() => change("pro")}>Downgrade to Pro at renewal</button>}
            {sub && !sub.cancelAtPeriodEnd && plan.id !== "free" && <button className="btn-ghost !py-2 text-sm hover:!text-rose" disabled={busy} onClick={() => confirm(`Cancel ${plan.name}? You keep access until ${fmt(sub.currentPeriodEnd)}.`) && act(() => account.cancel(), "Cancelled. You keep access until the end of this period.")}>Cancel membership</button>}
            {sub?.cancelAtPeriodEnd && plan.id !== "free" && sub.provider !== "razorpay" && <button className="btn-ghost !py-2 text-sm" disabled={busy} onClick={() => act(() => account.resume(), "Your membership will renew as normal.")}>Keep my membership</button>}
          </div>
          {msg && <p className="text-sm text-cyan mt-3" role="status">{msg}</p>}
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="text-sm text-muted mb-3">Today's usage</div>
          <div className="flex items-center gap-5">
            <Ring pct={aiPct} size={100} label={`${status?.ai.used ?? 0}`} sub={`of ${status?.ai.limit ?? 0}`} />
            <div className="text-sm">
              <div className="font-semibold">FINOVA AI questions</div>
              <div className="text-muted">Resets at midnight IST.</div>
              <Link to="/ai" className="text-cyan text-xs mt-2 inline-block">Open FINOVA AI →</Link>
            </div>
          </div>
          <ul className="mt-5 space-y-1.5 text-sm">
            {[["Advanced indicators", status?.features.advancedIndicators], ["Full academy", (status?.features.academyLevels.length ?? 1) > 1], ["Masterclasses", status?.features.masterclasses], ["Performance reports", status?.features.performanceReports], ["Ad-free", status?.features.adFree]].map(([k, v]) => (
              <li key={k as string} className="flex justify-between"><span className="text-muted">{k as string}</span>{v ? <Icon name="check" className="w-4 h-4 text-emerald" /> : <span className="text-faint">—</span>}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="glass rounded-3xl p-6 overflow-x-auto scroll-thin">
          <h2 className="font-semibold mb-3">Payments</h2>
          {!hist?.invoices.length ? <p className="text-sm text-muted">No payments yet.</p> : (
            <table className="w-full text-sm min-w-[420px]">
              <thead className="text-xs text-muted text-left"><tr><th className="py-2">Date</th><th>Plan</th><th>Amount</th><th>Via</th><th>Status</th></tr></thead>
              <tbody>{hist.invoices.map((i) => (
                <tr key={i.id} className="border-t border-line"><td className="py-2">{fmt(i.at)}</td><td>{planLabel(i.plan)}</td><td className="tabular-nums">{rupees(i.amount)}</td><td>{i.provider === "razorpay" ? "Razorpay" : i.provider === "google_play" ? "Google Play" : "Test"}</td><td><span className={`chip ${i.test ? "!text-amber" : "!text-emerald"}`}>{i.test ? "Test, not charged" : i.status}</span></td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="font-semibold mb-3">Subscription history</h2>
          {!hist?.events.length ? <p className="text-sm text-muted">No history yet.</p> : (
            <ol className="relative border-l border-line ml-2 space-y-3">
              {hist.events.slice(0, 25).map((e) => (
                <li key={e.id} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-cyan" />
                  <div className="text-sm font-medium">{EVENT_LABEL[e.type] ?? e.type}{typeof e.detail.plan === "string" ? ` · ${planLabel(e.detail.plan)}` : ""}{e.detail.test ? " (test)" : ""}</div>
                  <div className="text-xs text-faint">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
      <p className="text-xs text-faint">Memberships are verified by FINOVA's server with the payment provider. To change a plan bought on Android, use Google Play → Payments & subscriptions.</p>
    </div>
  );
}

export default function Account() {
  const { user, loaded } = useAccount();
  return <Page>{!loaded ? <div className="h-64 rounded-3xl bg-card animate-pulse" /> : user ? <Billing /> : <AuthForm />}</Page>;
}
