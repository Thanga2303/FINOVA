import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { account, loadRazorpay, planLabel, rupees, useAccount, type Plan, type PlanId } from "../lib/account";
import { Icon, Page } from "../components/ui";
import { isAndroidApp } from "../lib/native/platform";
import { buyWithPlay, initPlayBilling, playProducts, statusMessage, type PlayStatus } from "../lib/native/playBilling";
import { suppressAds } from "../lib/ads/manager";
import { track } from "../lib/metrics";

type RzpResponse = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
type RzpCtor = new (o: Record<string, unknown>) => { open: () => void; on: (e: string, f: (r: { error?: { description?: string } }) => void) => void };

export default function Checkout() {
  const [params] = useSearchParams();
  const planId = params.get("plan") as PlanId | null;
  const next = params.get("next");
  const { user, loaded, plan: current, status } = useAccount();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const nav = useNavigate();
  const [play, setPlay] = useState<PlayStatus>(isAndroidApp ? "loading" : "unavailable");
  useEffect(() => { if (planId) track("checkout_view", { plan: planId }); return suppressAds("checkout"); }, [planId]); // never show ads on a payment screen
  useEffect(() => { if (isAndroidApp && user) initPlayBilling().then(setPlay); }, [user]);
  // On Android the plan becomes active once the server has verified the Google Play token.
  useEffect(() => { if (isAndroidApp && busy && current.id === planId) { setBusy(false); setDone(true); } }, [busy, current.id, planId]);
  useEffect(() => { account.plans().then((r) => setPlan(r.plans.find((p) => p.id === planId) ?? null)).catch(() => setErr("Could not load plans.")); }, [planId]);

  if (!planId || !["pro", "elite"].includes(planId)) return <Navigate to="/pricing" replace />;
  if (loaded && !user) return <Navigate to={`/account?mode=signup&next=${encodeURIComponent(`/checkout?plan=${planId}`)}`} replace />;
  const providers = status?.providers;
  const canRazorpay = !isAndroidApp && providers?.razorpay.configured;
  const canTest = !isAndroidApp && providers?.testMode;
  const playPrice = playProducts().find((p) => p.plan === planId)?.price ?? null;

  async function payPlay() {
    setBusy(true); setErr(null);
    track("checkout_start", { plan: planId!, provider: "google_play" });
    const r = await buyWithPlay(planId!);
    if (!r.ok) { setBusy(false); if (!r.cancelled) setErr(r.message ?? "Purchase failed."); }
    // On success we wait for the server verification (effect above) instead of trusting the client result.
  }

  async function payRazorpay() {
    setBusy(true); setErr(null);
    try {
      track("checkout_start", { plan: planId!, provider: "razorpay" });
      const c = await account.checkout(planId!, "razorpay");
      await loadRazorpay();
      const Rzp = (window as unknown as { Razorpay: RzpCtor }).Razorpay;
      const rzp = new Rzp({
        key: c.keyId, subscription_id: c.subscriptionId, name: c.name, description: c.description, prefill: c.prefill, theme: { color: "#00D4FF" },
        handler: async (r: RzpResponse) => {
          try { await account.verifyRazorpay({ checkoutId: c.checkoutId!, ...r }); setDone(true); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => { setErr(r.error?.description ?? "Payment failed."); setBusy(false); });
      rzp.open();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  async function payTest() {
    setBusy(true); setErr(null);
    try {
      const c = await account.checkout(planId!, "test");
      await account.verifyTest(c.checkoutId!);
      setDone(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Page>
      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-muted"><Link to="/pricing" className="hover:text-text">Pricing</Link> / <span className="text-text">Checkout</span></nav>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 glass rounded-3xl p-8 text-center">
              <div className="relative mx-auto w-16 h-16">
                {[0, 0.25].map((d) => <span key={d} aria-hidden className="absolute inset-0 rounded-full border-2 border-emerald ring-pop" style={{ animationDelay: `${d}s` }} />)}
                <div className="relative w-16 h-16 rounded-full grid place-items-center bg-emerald/15 text-emerald"><Icon name="check" className="w-8 h-8" /></div>
              </div>
              <h1 className="font-display text-3xl font-semibold mt-5">Welcome to {planLabel(planId)}</h1>
              <p className="text-muted mt-2">Your membership is active{status?.subscription?.test ? " (test mode, no payment taken)" : ""}. Renews on {status?.subscription ? new Date(status.subscription.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}.</p>
              <div className="mt-6 flex justify-center gap-2">
                <button className="btn-primary" onClick={() => nav(next ?? "/account")}>{next ? "Continue" : "Go to billing"}</button>
                <Link to="/" className="btn-ghost">Home</Link>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid md:grid-cols-[1.2fr_1fr] gap-6 items-start">
              <section className="glass rounded-3xl p-6">
                <h1 className="font-display text-2xl font-semibold">Complete your upgrade</h1>
                <p className="text-sm text-muted mt-1">Signed in as {user?.email}</p>
                {current.tier > 0 && <p className="text-sm text-amber mt-3">You're on {current.name}. Upgrading starts {planLabel(planId)} now; your previous plan ends.</p>}
                <div className="mt-6 space-y-3">
                  {isAndroidApp && (
                    play === "ready" ? (
                      <button disabled={busy} onClick={payPlay} className="w-full rounded-2xl border border-cyan/40 bg-cyan/5 p-4 text-left hover:bg-cyan/10 disabled:opacity-50">
                        <div className="font-semibold">Subscribe with Google Play {playPrice && <span className="text-muted font-normal">· {playPrice}/month</span>}</div>
                        <div className="text-xs text-muted mt-0.5">Billed by Google Play. Cancel anytime from Google Play subscriptions.</div>
                      </button>
                    ) : play === "loading" ? <div className="rounded-2xl border border-line p-4 text-sm text-muted">Connecting to Google Play…</div>
                      : <div className="rounded-2xl border border-line p-4 text-sm text-muted">{statusMessage(play)}</div>
                  )}
                  {canRazorpay && (
                    <button disabled={busy} onClick={payRazorpay} className="w-full rounded-2xl border border-cyan/40 bg-cyan/5 p-4 text-left hover:bg-cyan/10 disabled:opacity-50">
                      <div className="font-semibold">Pay with Razorpay {providers?.razorpay.live ? "" : <span className="chip !text-amber ml-1">Razorpay test keys</span>}</div>
                      <div className="text-xs text-muted mt-0.5">UPI AutoPay, cards, net banking. Recurring monthly; cancel anytime.</div>
                    </button>
                  )}
                  {canTest && (
                    <button disabled={busy} onClick={payTest} className="w-full rounded-2xl border border-amber/40 bg-amber/5 p-4 text-left hover:bg-amber/10 disabled:opacity-50">
                      <div className="font-semibold">Activate in test mode</div>
                      <div className="text-xs text-muted mt-0.5">Development only: activates the plan on the server without any payment. Disabled in production.</div>
                    </button>
                  )}
                  {!isAndroidApp && !canRazorpay && !canTest && (
                    <div className="rounded-2xl border border-line p-4 text-sm text-muted">Online payments aren't switched on yet. The FINOVA team needs to configure the payment provider before memberships can be bought.</div>
                  )}
                  {!isAndroidApp && <div className="rounded-2xl border border-line p-4 text-xs text-muted">On Android, memberships are bought through Google Play inside the FINOVA app and verified with Google by our server.</div>}
                </div>
                {err && <p className="text-sm text-rose mt-4" role="alert">{err}</p>}
                {busy && <p className="text-sm text-muted mt-4" role="status">Processing… please don't close this page.</p>}
              </section>
              <aside className="glass rounded-3xl p-6">
                <div className="text-sm text-muted">Order summary</div>
                <div className="font-display text-xl font-semibold mt-1">{planLabel(planId)}</div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Monthly price</span><span>{isAndroidApp && playPrice ? playPrice : plan ? rupees(plan.priceMonthly) : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Billing</span><span>Every month</span></div>
                  <div className="flex justify-between font-semibold border-t border-line pt-2"><span>Due today</span><span>{isAndroidApp && playPrice ? playPrice : plan ? rupees(plan.priceMonthly) : "—"}</span></div>
                  {canTest && !canRazorpay && <p className="text-xs text-amber">Test mode: nothing will be charged.</p>}
                </div>
                <ul className="mt-5 space-y-1.5 text-xs text-muted">
                  {plan?.highlights.slice(0, 6).map((h) => <li key={h} className="flex gap-2"><Icon name="check" className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />{h}</li>)}
                </ul>
                <p className="text-[11px] text-faint mt-5">Your plan is activated only after our server verifies the payment with the provider. FINOVA never sees or stores card or UPI details.</p>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}
