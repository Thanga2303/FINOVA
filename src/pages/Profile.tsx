import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getState, setState, useStore, type State } from "../lib/store";
import { cloudStatus } from "../lib/cloud";
import { healthFromState } from "../lib/wallet";
import { Icon, Page, Ring } from "../components/ui";
import DashboardBody from "./Dashboard";

const TABS = [["progress", "Learning progress"], ["finance", "Financial profile"], ["privacy", "Privacy & data"]] as const;

function FinanceProfile() {
  const p = useStore((s) => s.finProfile);
  const s = useStore((x) => x);
  const { total } = healthFromState(s);
  const set = (patch: Partial<State["finProfile"]>) => setState((st) => ({ finProfile: { ...st.finProfile, ...patch } }));
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="glass rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="font-semibold">Financial planning preferences</h2>
          <p className="text-xs text-muted">Used by the Wallet planner and FINOVA AI. You can change them anytime.</p>
        </div>
        <div>
          <div className="text-sm text-muted mb-2">Risk tolerance (your own choice)</div>
          <div className="grid grid-cols-3 gap-2">
            {([["low", "Low", "I'd rather avoid big falls"], ["medium", "Medium", "Some ups and downs are OK"], ["high", "High", "I can handle large swings"]] as const).map(([k, l, d]) => (
              <button key={k} onClick={() => set({ risk: k })} className={`rounded-2xl border p-3 text-left ${p.risk === k ? "border-cyan bg-cyan/10" : "border-line"}`} aria-pressed={p.risk === k}><div className="font-semibold">{l}</div><div className="text-xs text-muted">{d}</div></button>
            ))}
          </div>
        </div>
        <label className="block text-sm"><span className="text-muted">Main investment time horizon: {p.horizonYears} years</span><input type="range" min={1} max={30} value={p.horizonYears} onChange={(e) => set({ horizonYears: Number(e.target.value) })} className="mt-2" /></label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between rounded-2xl border border-line p-3 text-sm"><span>My income is stable (salary)</span><input type="checkbox" className="accent-[var(--cyan)] w-5 h-5" checked={p.incomeStable} onChange={(e) => set({ incomeStable: e.target.checked })} /></label>
          <label className="flex items-center justify-between rounded-2xl border border-line p-3 text-sm"><span>People who depend on me</span><input type="number" min={0} max={10} className="field !w-20 !py-1 text-right" value={p.dependents} onChange={(e) => set({ dependents: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })} /></label>
        </div>
      </div>
      <div className="glass rounded-3xl p-6 text-center">
        <Ring pct={total / 100} size={130} label={total} sub="health score" />
        <p className="text-xs text-muted mt-3">Educational score from your Wallet data. Not a credit score.</p>
        <Link to="/wallet?tab=health" className="btn-ghost !py-2 text-sm mt-3 inline-block">See breakdown</Link>
      </div>
    </div>
  );
}

function Privacy() {
  const consent = useStore((s) => s.consent);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const cloud = cloudStatus();
  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `finova-data-${new Date().toLocaleDateString("en-CA")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (f: File) => {
    try {
      const j = JSON.parse(await f.text());
      if (typeof j !== "object" || !j || !("wallet" in j || "completed" in j)) throw new Error("Not a FINOVA export file.");
      if (!confirm("Replace your current FINOVA data with this file?")) return;
      setState(() => j);
      setMsg("Data imported.");
    } catch (e) { setMsg(`Import failed: ${(e as Error).message}`); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold">AI consent</h2>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="accent-[var(--cyan)] mt-1" checked={consent.aiUsesWallet} onChange={(e) => setState((s) => ({ consent: { ...s.consent, aiUsesWallet: e.target.checked } }))} /><span>Allow FINOVA AI to use my Wallet summary for planning</span></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="accent-[var(--cyan)] mt-1" checked={consent.aiRemembers} onChange={(e) => setState((s) => ({ consent: { ...s.consent, aiRemembers: e.target.checked } }))} /><span>Remember FINOVA AI conversations on this device</span></label>
        <Link to="/wallet?tab=reminders" className="text-sm text-cyan underline inline-block">Notification preferences</Link>
      </div>
      <div className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold">Where your data lives</h2>
        <p className="text-sm text-muted">{cloud.configured ? "Supabase keys are configured. Account sign-in and sync are the next build step; for now your data stays in this browser." : "Your data is stored only in this browser. The Supabase database schema (with row-level security) is ready in the codebase, but cloud accounts aren't connected yet."}</p>
        <p className="text-xs text-faint flex gap-2"><Icon name="shield" className="w-4 h-4 shrink-0" /> FINOVA never asks for banking passwords, UPI PINs, OTPs or card details.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-ghost !py-2 text-sm" onClick={exportData}>Export my data</button>
          <button className="btn-ghost !py-2 text-sm" onClick={() => file.current?.click()}>Import data</button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <button className="btn-ghost !py-2 text-sm hover:!text-rose" onClick={() => { if (confirm("Delete ALL FINOVA data in this browser (learning, wallet, portfolio)? This cannot be undone.")) { try { localStorage.removeItem("finova.v2"); localStorage.removeItem("finova.chat.v2"); } catch { /* ignore */ } location.href = "/"; } }}>Delete all data</button>
        </div>
        {msg && <p className="text-sm text-cyan">{msg}</p>}
      </div>
    </div>
  );
}

export default function Profile() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "progress";
  return (
    <Page>
      <div className="mb-6 flex gap-1 overflow-x-auto scroll-thin rounded-full border border-line p-1 w-full sm:w-fit" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id })} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${tab === id ? "bg-cyan text-[#04121c]" : "text-muted hover:text-text"}`}>{label}</button>)}
      </div>
      {tab === "finance" ? <FinanceProfile /> : tab === "privacy" ? <Privacy /> : <DashboardBody />}
    </Page>
  );
}
