import { useMemo, useState } from "react";
import { addMonths, monthlyNeeded, monthsToGoal } from "../../lib/finance";
import { EXPENSE_CATS, setState, uid, useStore, type ExpenseCat, type ExpenseEntry, type Goal, type IncomeEntry } from "../../lib/store";
import { monthKey, monthLabel } from "../../lib/wallet";
import { inr, Ring } from "../ui";

const today = () => new Date().toLocaleDateString("en-CA");
const SOURCES: IncomeEntry["source"][] = ["Salary", "Freelancing", "Business", "Other", "Additional"];

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <section className="glass rounded-3xl p-5"><h3 className="font-semibold">{title}</h3>{sub && <p className="text-xs text-muted mt-0.5 mb-3">{sub}</p>}{!sub && <div className="mb-3" />}{children}</section>;
}

export function IncomeTab() {
  const incomes = useStore((s) => s.wallet.incomes);
  const blank = { source: "Salary" as IncomeEntry["source"], amount: 0, date: today(), recurring: true, note: "" };
  const [f, setF] = useState(blank);
  const [edit, setEdit] = useState<string | null>(null);
  const save = () => {
    if (!(f.amount > 0)) return;
    setState((s) => ({ wallet: { ...s.wallet, incomes: edit ? s.wallet.incomes.map((i) => (i.id === edit ? { ...i, ...f } : i)) : [{ id: uid(), ...f }, ...s.wallet.incomes] } }));
    setF(blank); setEdit(null);
  };
  const groups = useMemo(() => {
    const m = new Map<string, IncomeEntry[]>();
    [...incomes].sort((a, b) => b.date.localeCompare(a.date)).forEach((i) => m.set(monthKey(i.date), [...(m.get(monthKey(i.date)) ?? []), i]));
    return [...m.entries()];
  }, [incomes]);
  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
      <Card title={edit ? "Edit income" : "Add income"} sub="Recurring income counts every month from its start date.">
        <div className="space-y-3">
          <label className="block text-sm"><span className="text-muted">Source</span><select className="field mt-1" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as IncomeEntry["source"] })}>{SOURCES.map((s) => <option key={s}>{s === "Salary" ? "Monthly salary" : s === "Freelancing" ? "Freelancing income" : s === "Business" ? "Business income" : s === "Other" ? "Other income" : "Additional earnings"}</option>)}</select></label>
          <label className="block text-sm"><span className="text-muted">Amount (₹)</span><input type="number" min={0} className="field mt-1" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} /></label>
          <label className="block text-sm"><span className="text-muted">{f.recurring ? "Starting from" : "Date received"}</span><input type="date" className="field mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.recurring} onChange={(e) => setF({ ...f, recurring: e.target.checked })} className="accent-[var(--cyan)]" /> Recurring every month</label>
          <label className="block text-sm"><span className="text-muted">Note (optional)</span><input className="field mt-1" maxLength={80} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
          <div className="flex gap-2"><button className="btn-primary flex-1 disabled:opacity-40" disabled={!(f.amount > 0)} onClick={save}>{edit ? "Save changes" : "Add income"}</button>{edit && <button className="btn-ghost" onClick={() => { setEdit(null); setF(blank); }}>Cancel</button>}</div>
        </div>
      </Card>
      <Card title="Income history">
        {groups.length === 0 ? <p className="text-sm text-muted">No income recorded yet.</p> : groups.map(([k, list]) => (
          <div key={k} className="mb-4">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">{monthLabel(k)}</div>
            <ul className="divide-y divide-line">{list.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                <div className="flex-1 min-w-0"><span className="font-medium">{i.source}</span>{i.recurring && <span className="chip !py-0 ml-2 !text-cyan">Recurring</span>}{i.note && <div className="text-xs text-muted truncate">{i.note}</div>}</div>
                <span className="font-semibold text-emerald tabular-nums">{inr(i.amount)}</span>
                <button className="text-xs text-muted hover:text-text" onClick={() => { setEdit(i.id); setF({ source: i.source, amount: i.amount, date: i.date, recurring: i.recurring, note: i.note ?? "" }); }}>Edit</button>
                <button className="text-xs text-muted hover:text-rose" onClick={() => setState((s) => ({ wallet: { ...s.wallet, incomes: s.wallet.incomes.filter((x) => x.id !== i.id) } }))}>Delete</button>
              </li>
            ))}</ul>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ExpensesTab() {
  const expenses = useStore((s) => s.wallet.expenses);
  const blank = { category: "Food" as ExpenseCat, amount: 0, date: today(), note: "", recurring: false };
  const [f, setF] = useState(blank);
  const [edit, setEdit] = useState<string | null>(null);
  const [cat, setCat] = useState<ExpenseCat | "All">("All");
  const save = () => {
    if (!(f.amount > 0)) return;
    setState((s) => ({ wallet: { ...s.wallet, expenses: edit ? s.wallet.expenses.map((e) => (e.id === edit ? { ...e, ...f } : e)) : [{ id: uid(), ...f } as ExpenseEntry, ...s.wallet.expenses] } }));
    setF({ ...blank, category: f.category, date: f.date }); setEdit(null);
  };
  const list = [...expenses].filter((e) => cat === "All" || e.category === cat).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
      <Card title={edit ? "Edit expense" : "Add expense"}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">{EXPENSE_CATS.map((c) => <button key={c} onClick={() => setF({ ...f, category: c })} className={`rounded-xl border px-2 py-1.5 text-xs ${f.category === c ? "border-cyan bg-cyan/10" : "border-line"}`}>{c}</button>)}</div>
          <label className="block text-sm"><span className="text-muted">Amount (₹)</span><input type="number" min={0} className="field mt-1" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Math.max(0, Number(e.target.value) || 0) })} onKeyDown={(e) => e.key === "Enter" && save()} /></label>
          <label className="block text-sm"><span className="text-muted">Date</span><input type="date" className="field mt-1" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="block text-sm"><span className="text-muted">Note (optional)</span><input className="field mt-1" maxLength={80} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.recurring} onChange={(e) => setF({ ...f, recurring: e.target.checked })} className="accent-[var(--cyan)]" /> Repeats monthly (e.g. rent, subscriptions)</label>
          <div className="flex gap-2"><button className="btn-primary flex-1 disabled:opacity-40" disabled={!(f.amount > 0)} onClick={save}>{edit ? "Save changes" : "Add expense"}</button>{edit && <button className="btn-ghost" onClick={() => { setEdit(null); setF(blank); }}>Cancel</button>}</div>
        </div>
      </Card>
      <Card title="Spending history">
        <div className="flex flex-wrap gap-1.5 mb-3">{(["All", ...EXPENSE_CATS] as const).map((c) => <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "!text-text !border-cyan/50" : ""}`}>{c}</button>)}</div>
        {list.length === 0 ? <p className="text-sm text-muted">No expenses recorded{cat !== "All" ? ` for ${cat}` : ""}.</p> : (
          <ul className="divide-y divide-line max-h-[520px] overflow-y-auto scroll-thin">{list.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="chip w-28 justify-center shrink-0">{e.category}</span>
              <div className="flex-1 min-w-0"><div className="truncate">{e.note || "—"}{e.recurring && <span className="chip !py-0 ml-2 !text-cyan">Monthly</span>}</div><div className="text-xs text-muted">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></div>
              <span className="font-semibold text-rose tabular-nums">{inr(e.amount)}</span>
              <button className="text-xs text-muted hover:text-text" onClick={() => { setEdit(e.id); setF({ category: e.category, amount: e.amount, date: e.date, note: e.note ?? "", recurring: Boolean(e.recurring) }); }}>Edit</button>
              <button className="text-xs text-muted hover:text-rose" onClick={() => setState((s) => ({ wallet: { ...s.wallet, expenses: s.wallet.expenses.filter((x) => x.id !== e.id) } }))}>Delete</button>
            </li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}

export function BudgetsTab({ byCat }: { byCat: Record<ExpenseCat, number> }) {
  const budgets = useStore((s) => s.wallet.budgets);
  return (
    <Card title="Monthly budgets" sub="Set a limit per category. Bars show this month's spending against the limit.">
      <div className="grid md:grid-cols-2 gap-4">
        {EXPENSE_CATS.map((c) => {
          const b = budgets[c] ?? 0, sp = byCat[c] ?? 0, pct = b ? sp / b : 0;
          return (
            <div key={c} className="rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{c}</span>
                <label className="flex items-center gap-1 text-sm text-muted">₹<input type="number" min={0} step={500} className="field !w-28 !py-1 text-right" value={b || ""} placeholder="No limit" aria-label={`${c} budget`}
                  onChange={(e) => setState((s) => ({ wallet: { ...s.wallet, budgets: { ...s.wallet.budgets, [c]: Math.max(0, Number(e.target.value) || 0) } } }))} /></label>
              </div>
              <div className="h-2 rounded-full bg-line mt-3 overflow-hidden"><div className={`h-full rounded-full ${pct >= 1 ? "bg-rose" : pct >= 0.8 ? "bg-amber" : "bg-emerald"}`} style={{ width: `${Math.min(100, (b ? pct : sp ? 1 : 0) * 100)}%` }} /></div>
              <div className="text-xs text-muted mt-1.5">{inr(sp)} spent{b ? ` of ${inr(b)} · ${pct >= 1 ? `${inr(sp - b)} over` : `${inr(b - sp)} left`}` : ""}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function GoalsTab() {
  const goals = useStore((s) => s.wallet.goals);
  const monthlySavingsGoal = useStore((s) => s.wallet.savingsGoalMonthly);
  const blank = { name: "", kind: "savings" as Goal["kind"], target: 50000, saved: 0, deadline: addMonths(new Date(), 12).toLocaleDateString("en-CA") };
  const [f, setF] = useState(blank);
  const [amt, setAmt] = useState<Record<string, number>>({});
  const add = () => {
    if (!f.name.trim() || !(f.target > 0)) return;
    setState((s) => ({ wallet: { ...s.wallet, goals: [...s.wallet.goals, { id: uid(), ...f, name: f.name.trim(), createdAt: Date.now(), contributions: [] }] } }));
    setF(blank);
  };
  const contribute = (g: Goal, a: number) => {
    if (!a) return;
    setState((s) => ({ wallet: { ...s.wallet, goals: s.wallet.goals.map((x) => (x.id === g.id ? { ...x, saved: Math.max(0, x.saved + a), contributions: [...x.contributions, { date: today(), amount: a }] } : x)) } }));
    setAmt((m) => ({ ...m, [g.id]: 0 }));
  };
  const presets: [string, Goal["kind"], number][] = [["Emergency fund", "emergency", 100000], ["New laptop", "purchase", 60000], ["College fees", "education", 150000], ["Start a business", "business", 200000], ["Save ₹50,000", "savings", 50000], ["Long-term portfolio", "investment", 500000]];
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <Card title="Create a goal">
          <div className="flex flex-wrap gap-1.5 mb-3">{presets.map(([n, k, t]) => <button key={n} className="chip" onClick={() => setF({ ...f, name: n, kind: k, target: t })}>{n}</button>)}</div>
          <div className="space-y-3">
            <label className="block text-sm"><span className="text-muted">Goal name</span><input className="field mt-1" maxLength={50} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="block text-sm"><span className="text-muted">Type</span><select className="field mt-1" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Goal["kind"] })}>{["emergency", "savings", "purchase", "education", "business", "investment"].map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm"><span className="text-muted">Target (₹)</span><input type="number" min={0} className="field mt-1" value={f.target || ""} onChange={(e) => setF({ ...f, target: Math.max(0, Number(e.target.value) || 0) })} /></label>
              <label className="block text-sm"><span className="text-muted">Already saved (₹)</span><input type="number" min={0} className="field mt-1" value={f.saved || ""} onChange={(e) => setF({ ...f, saved: Math.max(0, Number(e.target.value) || 0) })} /></label>
            </div>
            <label className="block text-sm"><span className="text-muted">Target date</span><input type="date" className="field mt-1" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></label>
            <button className="btn-primary w-full disabled:opacity-40" disabled={!f.name.trim() || !(f.target > 0)} onClick={add}>Create goal</button>
          </div>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          {goals.length === 0 && <p className="text-sm text-muted">No goals yet. Create one to see the monthly amount it needs.</p>}
          {goals.map((g) => {
            const now = new Date(), dl = new Date(g.deadline);
            const months = Math.max(1, (dl.getFullYear() - now.getFullYear()) * 12 + dl.getMonth() - now.getMonth());
            const need = monthlyNeeded(g.target, g.saved, months);
            const recent = g.contributions.filter((c) => Date.now() - new Date(c.date).getTime() < 92 * 864e5).reduce((a, c) => a + c.amount, 0) / 3;
            const eta = monthsToGoal(g.target, g.saved, recent);
            const done = g.saved >= g.target;
            return (
              <div key={g.id} className="glass rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <Ring pct={g.saved / g.target} size={84} stroke={8} label={`${Math.min(100, Math.round((g.saved / g.target) * 100))}%`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-muted capitalize">{g.kind} goal · by {dl.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
                    <div className="text-sm mt-1">{inr(g.saved)} <span className="text-muted">of {inr(g.target)}</span></div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="rounded-xl border border-line p-2"><dt className="text-muted">Remaining</dt><dd className="font-semibold text-sm">{inr(Math.max(0, g.target - g.saved))}</dd></div>
                  <div className="rounded-xl border border-line p-2"><dt className="text-muted">Needed per month</dt><dd className="font-semibold text-sm">{done ? "—" : inr(need)}</dd></div>
                  <div className="rounded-xl border border-line p-2 col-span-2"><dt className="text-muted">Estimated completion at your recent pace</dt><dd className="font-semibold text-sm">{done ? "Completed 🎉" : Number.isFinite(eta) ? addMonths(now, eta).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Add contributions to estimate"}</dd></div>
                </dl>
                {!done && (
                  <div className="flex gap-2 mt-3">
                    <input type="number" min={0} className="field !py-2" placeholder="Amount" value={amt[g.id] || ""} onChange={(e) => setAmt((m) => ({ ...m, [g.id]: Number(e.target.value) || 0 }))} aria-label={`Contribution to ${g.name}`} />
                    <button className="btn-primary !py-2 !px-4 shrink-0" onClick={() => contribute(g, amt[g.id] || 0)}>Add</button>
                  </div>
                )}
                <button className="text-xs text-muted hover:text-rose mt-3" onClick={() => confirm(`Delete goal “${g.name}”?`) && setState((s) => ({ wallet: { ...s.wallet, goals: s.wallet.goals.filter((x) => x.id !== g.id) } }))}>Delete goal</button>
              </div>
            );
          })}
        </div>
      </div>
      <Card title="Monthly savings target" sub="How much you aim to set aside every month (savings + goal contributions).">
        <label className="flex items-center gap-2 text-sm">₹<input type="number" min={0} step={500} className="field !w-40" value={monthlySavingsGoal || ""} onChange={(e) => setState((s) => ({ wallet: { ...s.wallet, savingsGoalMonthly: Math.max(0, Number(e.target.value) || 0) } }))} /> per month</label>
      </Card>
    </div>
  );
}

export function CommitmentsTab() {
  const { debts, planned } = useStore((s) => s.wallet);
  const [d, setD] = useState({ name: "", outstanding: 0, emi: 0, ratePct: 10 });
  const [p, setP] = useState({ name: "", amount: 1000, dayOfMonth: 5 });
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <Card title="Loans & debts" sub="Outstanding loans, EMIs and interest rates. High-interest debt (14%+) is flagged by the planner.">
        <ul className="divide-y divide-line mb-4">{debts.map((x) => (
          <li key={x.id} className="flex items-center gap-3 py-2 text-sm"><div className="flex-1"><div className="font-medium">{x.name}</div><div className="text-xs text-muted">{inr(x.outstanding)} outstanding · {x.ratePct}% p.a.</div></div><span className="tabular-nums">{inr(x.emi)}/mo</span><button className="text-xs text-muted hover:text-rose" onClick={() => setState((s) => ({ wallet: { ...s.wallet, debts: s.wallet.debts.filter((y) => y.id !== x.id) } }))}>Delete</button></li>
        ))}{debts.length === 0 && <li className="text-sm text-muted py-2">No debts recorded.</li>}</ul>
        <div className="grid grid-cols-2 gap-2">
          <input className="field col-span-2" placeholder="Name (e.g. Education loan, Credit card)" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <label className="text-xs text-muted">Outstanding ₹<input type="number" min={0} className="field mt-1" value={d.outstanding || ""} onChange={(e) => setD({ ...d, outstanding: Number(e.target.value) || 0 })} /></label>
          <label className="text-xs text-muted">Monthly EMI ₹<input type="number" min={0} className="field mt-1" value={d.emi || ""} onChange={(e) => setD({ ...d, emi: Number(e.target.value) || 0 })} /></label>
          <label className="text-xs text-muted">Interest % p.a.<input type="number" min={0} step={0.5} className="field mt-1" value={d.ratePct} onChange={(e) => setD({ ...d, ratePct: Number(e.target.value) || 0 })} /></label>
          <button className="btn-primary self-end disabled:opacity-40" disabled={!d.name.trim()} onClick={() => { setState((s) => ({ wallet: { ...s.wallet, debts: [...s.wallet.debts, { id: uid(), ...d, name: d.name.trim() }] } })); setD({ name: "", outstanding: 0, emi: 0, ratePct: 10 }); }}>Add debt</button>
        </div>
      </Card>
      <Card title="Planned investments (SIPs)" sub="Amounts you plan to invest each month. FINOVA only tracks these; it never moves money.">
        <ul className="divide-y divide-line mb-4">{planned.map((x) => (
          <li key={x.id} className="flex items-center gap-3 py-2 text-sm">
            <label className="flex items-center gap-2 flex-1 min-w-0"><input type="checkbox" checked={x.active} onChange={() => setState((s) => ({ wallet: { ...s.wallet, planned: s.wallet.planned.map((y) => (y.id === x.id ? { ...y, active: !y.active } : y)) } }))} className="accent-[var(--cyan)]" /><span className="truncate">{x.name}</span></label>
            <span className="text-xs text-muted">day {x.dayOfMonth}</span><span className="tabular-nums">{inr(x.amount)}</span>
            <button className="text-xs text-muted hover:text-rose" onClick={() => setState((s) => ({ wallet: { ...s.wallet, planned: s.wallet.planned.filter((y) => y.id !== x.id) } }))}>Delete</button>
          </li>
        ))}{planned.length === 0 && <li className="text-sm text-muted py-2">No planned investments yet.</li>}</ul>
        <div className="grid grid-cols-2 gap-2">
          <input className="field col-span-2" placeholder="Name (e.g. Index fund SIP)" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          <label className="text-xs text-muted">Monthly amount ₹<input type="number" min={0} className="field mt-1" value={p.amount || ""} onChange={(e) => setP({ ...p, amount: Number(e.target.value) || 0 })} /></label>
          <label className="text-xs text-muted">Day of month<input type="number" min={1} max={28} className="field mt-1" value={p.dayOfMonth} onChange={(e) => setP({ ...p, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} /></label>
          <button className="btn-primary col-span-2 disabled:opacity-40" disabled={!p.name.trim() || !(p.amount > 0)} onClick={() => { setState((s) => ({ wallet: { ...s.wallet, planned: [...s.wallet.planned, { id: uid(), ...p, name: p.name.trim(), active: true }] } })); setP({ name: "", amount: 1000, dayOfMonth: 5 }); }}>Add planned investment</button>
        </div>
      </Card>
    </div>
  );
}
