import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dueReminders } from "../lib/reminders";
import { setState, useStore } from "../lib/store";
import { averages, emergencySaved, healthFromState, lastMonths, monthLabel, monthSummary, planFromState, thisMonth } from "../lib/wallet";
import { Icon, inr, Page, Ring } from "../components/ui";
import { BudgetsTab, CommitmentsTab, ExpensesTab, GoalsTab, IncomeTab } from "../components/wallet/Forms";

const TABS = [
  ["overview", "Overview"], ["income", "Income"], ["expenses", "Expenses"], ["budgets", "Budgets"], ["goals", "Savings & goals"],
  ["commitments", "Loans & SIPs"], ["health", "Health score"], ["reminders", "Reminders"],
] as const;
const PIE = ["#00D4FF", "#00E6A0", "#8B5CF6", "#FBBF24", "#FB7185", "#38BDF8", "#F472B6", "#A3E635", "#94A3B8"];

function Stat({ k, v, c = "", sub }: { k: string; v: number; c?: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
      <div className="text-xs text-muted">{k}</div>
      <div className={`font-display text-2xl font-semibold mt-1 tabular-nums ${c}`}>{inr(v)}</div>
      {sub && <div className="text-[11px] text-faint mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function Flow({ income, expenses, emergency, investable, portfolio }: { income: number; expenses: number; emergency: number; investable: number; portfolio: number }) {
  const steps = [
    { k: "Monthly income", v: income, c: "var(--emerald)", to: "/wallet?tab=income" },
    { k: "Expenses & EMIs", v: -expenses, c: "var(--rose)", to: "/wallet?tab=expenses" },
    { k: "Emergency savings", v: -emergency, c: "var(--amber)", to: "/wallet?tab=goals" },
    { k: "Available investment budget", v: investable, c: "var(--cyan)", to: "/ai?mode=planner" },
    { k: "Investment portfolio (invested)", v: portfolio, c: "var(--violet)", to: "/investments" },
  ];
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="font-semibold">How your money flows</h3>
      <p className="text-xs text-muted mb-4">This month's figures. The investment budget is a suggestion from the planner; nothing moves automatically.</p>
      <ol className="flex flex-col lg:flex-row items-stretch gap-2">
        {steps.map((s, i) => (
          <li key={s.k} className="flex lg:flex-col items-center gap-2 flex-1">
            <Link to={s.to} className="flex-1 w-full rounded-2xl border p-3 hover:bg-card-strong" style={{ borderColor: `color-mix(in srgb, ${s.c} 45%, transparent)` }}>
              <div className="text-xs text-muted">{s.k}</div>
              <div className="font-display text-lg font-semibold tabular-nums" style={{ color: s.c }}>{s.v < 0 ? "−" : ""}{inr(Math.abs(s.v))}</div>
            </Link>
            {i < steps.length - 1 && <Icon name="arrow" className="w-5 h-5 text-faint rotate-90 lg:rotate-0 shrink-0" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Overview({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  const s = useStore((x) => x);
  const sum = monthSummary(s.wallet, month);
  const plan = planFromState(s);
  const months = lastMonths(6, thisMonth()).map((k) => { const m = monthSummary(s.wallet, k); return { k: new Date(k + "-01").toLocaleDateString("en-IN", { month: "short" }), Income: m.income, Expenses: m.spent + m.emi, Saved: m.savings }; });
  const cats = Object.entries(sum.byCat).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const portfolio = [...s.paper.holdings, ...s.manual].reduce((a, h) => a + h.qty * h.avg, 0);
  const empty = s.wallet.incomes.length === 0 && s.wallet.expenses.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <select className="field !w-auto !py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          {lastMonths(12).reverse().map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
        </select>
        <span className="text-xs text-muted">Figures update automatically from your entries.</span>
      </div>
      {empty && (
        <div className="rounded-3xl border border-cyan/30 bg-cyan/5 p-5">
          <h3 className="font-semibold">Start with two steps</h3>
          <p className="text-sm text-muted mt-1">Add your monthly income, then log a few expenses. FINOVA will calculate your balance, savings and an educational plan.</p>
          <div className="flex gap-2 mt-3"><Link to="/wallet?tab=income" className="btn-primary !py-2 text-sm">Add income</Link><Link to="/wallet?tab=expenses" className="btn-ghost !py-2 text-sm">Add expense</Link></div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Stat k="Total income" v={sum.income} c="text-emerald" />
        <Stat k="Total expenses" v={sum.spent} c="text-rose" />
        <Stat k="Loan EMIs" v={sum.emi} c="text-rose" />
        <Stat k="Total savings" v={sum.savings} c="text-amber" sub="Savings + goal contributions" />
        <Stat k="Planned investments" v={sum.planned} c="text-violet" />
        <Stat k="Remaining balance" v={sum.remaining} c={sum.remaining >= 0 ? "text-cyan" : "text-rose"} sub="Available to allocate" />
      </div>
      <Flow income={sum.income} expenses={sum.spent + sum.emi} emergency={plan.lines.find((l) => l.key === "emergency")?.amount ?? 0} investable={plan.investable} portfolio={portfolio} />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass rounded-3xl p-5 min-w-0">
          <h3 className="font-semibold mb-3">Last 6 months</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={months}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="k" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => inr(Number(v))} />
                <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v) => inr(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="var(--emerald)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="var(--rose)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saved" fill="var(--amber)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h3 className="font-semibold mb-1">Spending by category</h3>
          <p className="text-xs text-muted">{monthLabel(month)}</p>
          {cats.length === 0 ? <p className="text-sm text-muted mt-6">No expenses this month.</p> : (
            <>
              <div className="h-44">
                <ResponsiveContainer>
                  <PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">{cats.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie>
                    <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v) => inr(Number(v))} /></PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 text-sm">{cats.map((c, i) => <li key={c.name} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} /><span className="flex-1">{c.name}</span><span className="tabular-nums">{inr(c.value)}</span><span className="text-xs text-muted w-10 text-right">{((c.value / sum.spent) * 100).toFixed(0)}%</span></li>)}</ul>
            </>
          )}
        </div>
      </div>
      <div className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Your educational money plan</h3>
            <p className="text-xs text-muted">Based on your average income and spending. You decide and approve every step.</p>
          </div>
          <Link to="/ai?mode=planner&q=Analyse%20my%20finances%20and%20suggest%20a%20monthly%20plan" className="btn-primary !py-2 text-sm">Ask FINOVA AI to explain</Link>
        </div>
        {plan.surplus > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            {plan.lines.map((l) => <div key={l.key} className="rounded-2xl border border-line p-3" title={l.why}><div className="text-xs text-muted">{l.label}</div><div className="font-semibold tabular-nums">{inr(l.amount)}</div></div>)}
          </div>
        ) : <p className="text-sm text-muted mt-3">{averages(s.wallet).income === 0 ? "Add income to see a plan." : plan.warnings[0]}</p>}
      </div>
      <p className="text-xs text-faint flex gap-2"><Icon name="shield" className="w-4 h-4 shrink-0" /> FINOVA Wallet is a personal finance tracker, not a bank account or payment wallet. No money is stored or transferred, and FINOVA never asks for banking passwords, UPI PINs or card details.</p>
    </div>
  );
}

function Health() {
  const s = useStore((x) => x);
  const { total, parts } = useMemo(() => healthFromState(s), [s]);
  const band = total >= 75 ? ["Strong", "text-emerald"] : total >= 50 ? ["Fair", "text-amber"] : ["Needs attention", "text-rose"];
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      <div className="glass rounded-3xl p-6 text-center">
        <Ring pct={total / 100} size={180} stroke={14} label={<span className="text-4xl">{total}</span>} sub="out of 100" />
        <div className={`font-display text-xl font-semibold mt-3 ${band[1]}`}>{band[0]}</div>
        <p className="text-xs text-muted mt-3">FINOVA's educational assessment of your tracked data. It is not a credit score or an official financial rating.</p>
      </div>
      <div className="glass rounded-3xl p-5">
        <h3 className="font-semibold mb-4">What makes up your score</h3>
        <ul className="space-y-4">{parts.map((p) => (
          <li key={p.key}>
            <div className="flex justify-between text-sm"><span className="font-medium">{p.label}</span><span className="tabular-nums">{p.score}/{p.max}</span></div>
            <div className="h-2 rounded-full bg-line mt-1.5 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan to-emerald" initial={{ width: 0 }} animate={{ width: `${(p.score / p.max) * 100}%` }} transition={{ duration: 0.9 }} /></div>
            <p className="text-xs text-muted mt-1">{p.tip}</p>
          </li>
        ))}</ul>
        <p className="text-xs text-faint mt-4">Emergency fund comes from goals of type “Emergency”. Diversification counts asset types in your FINOVA portfolio.</p>
      </div>
    </div>
  );
}

function Reminders() {
  const s = useStore((x) => x);
  const due = dueReminders(s);
  const set = (k: keyof typeof s.notify, v: boolean) => setState((st) => ({ notify: { ...st.notify, [k]: v } }));
  const askBrowser = async () => {
    if (!("Notification" in window)) return alert("This browser doesn't support notifications.");
    const p = await Notification.requestPermission();
    set("browser", p === "granted");
  };
  const prefs: [keyof typeof s.notify, string][] = [["income", "Monthly income updates"], ["expenses", "Expense tracking (after 3 days without entries)"], ["goals", "Savings goal contributions"], ["sip", "SIP payment dates (2 days before)"], ["budget", "Budget limits (at 80% and 100%)"], ["learning", "Daily learning goal"]];
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="glass rounded-3xl p-5">
        <h3 className="font-semibold">Notification preferences</h3>
        <p className="text-xs text-muted mb-4">Reminders are optional and calculated in your browser from your own data.</p>
        <label className="flex items-center justify-between rounded-2xl border border-line p-3 mb-3"><span className="font-medium">Enable reminders</span><input type="checkbox" className="accent-[var(--cyan)] w-5 h-5" checked={s.notify.enabled} onChange={(e) => set("enabled", e.target.checked)} /></label>
        <div className={`space-y-2 ${s.notify.enabled ? "" : "opacity-50 pointer-events-none"}`}>
          {prefs.map(([k, l]) => <label key={k} className="flex items-center justify-between text-sm py-1"><span>{l}</span><input type="checkbox" className="accent-[var(--cyan)]" checked={Boolean(s.notify[k])} onChange={(e) => set(k, e.target.checked)} /></label>)}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-line">
            <span>Browser notifications {s.notify.browser ? "(on)" : ""}</span>
            {s.notify.browser ? <button className="chip" onClick={() => set("browser", false)}>Turn off</button> : <button className="chip !text-cyan" onClick={askBrowser}>Allow</button>}
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-5">
        <h3 className="font-semibold mb-3">Due now ({due.length})</h3>
        {!s.notify.enabled ? <p className="text-sm text-muted">Reminders are off.</p> : due.length === 0 ? <p className="text-sm text-muted">You're all caught up.</p> : (
          <ul className="space-y-2">{due.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line p-3 flex gap-3">
              <Icon name="flame" className="w-5 h-5 text-amber shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0"><Link to={r.to} className="font-medium hover:text-cyan">{r.title}</Link><p className="text-xs text-muted">{r.body}</p></div>
              <button className="text-xs text-muted hover:text-text self-start" onClick={() => setState((st) => ({ dismissed: { ...st.dismissed, [r.id]: r.period } }))}>Dismiss</button>
            </li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}

export default function Wallet() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const [month, setMonth] = useState(thisMonth());
  const wallet = useStore((s) => s.wallet);
  const sum = monthSummary(wallet, month);
  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald mb-2">Smart Wallet</div>
          <h1 className="font-display text-4xl font-semibold">Your money, organised</h1>
          <p className="text-muted mt-2">Track income, expenses, savings and goals. Emergency fund saved: <span className="text-text font-semibold">{inr(emergencySaved(wallet))}</span></p>
        </div>
        <Link to="/ai?mode=planner" className="btn-ghost inline-flex items-center gap-2"><Icon name="spark" className="w-4 h-4 text-cyan" /> AI financial planner</Link>
      </div>
      <div className="mt-6 flex gap-1 overflow-x-auto scroll-thin rounded-full border border-line p-1 w-full sm:w-fit" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id })} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${tab === id ? "bg-emerald text-[#04121c]" : "text-muted hover:text-text"}`}>{label}</button>)}
      </div>
      <div className="mt-6">
        {tab === "income" ? <IncomeTab /> : tab === "expenses" ? <ExpensesTab /> : tab === "budgets" ? <BudgetsTab byCat={sum.byCat} /> : tab === "goals" ? <GoalsTab /> : tab === "commitments" ? <CommitmentsTab /> : tab === "health" ? <Health /> : tab === "reminders" ? <Reminders /> : <Overview month={month} setMonth={setMonth} />}
      </div>
    </Page>
  );
}
