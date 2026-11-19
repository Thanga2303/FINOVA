import type { ExpenseCat, State, Wallet } from "./store";
import { EXPENSE_CATS } from "./store";
import { healthScore, makePlan, monthlyNeeded, type PlanInput } from "./finance";

/** Personal finance calculations. FINOVA Wallet is a tracker: it never holds or moves real money. */

export const monthKey = (d: string | Date) => (typeof d === "string" ? d.slice(0, 7) : d.toLocaleDateString("en-CA").slice(0, 7));
export const thisMonth = () => monthKey(new Date());
export const monthLabel = (k: string) => new Date(k + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
export function lastMonths(n: number, from = thisMonth()) {
  const [y, m] = from.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => { const d = new Date(y, m - 1 - (n - 1 - i), 1); return monthKey(d); });
}

export function monthSummary(w: Wallet, key: string) {
  // Recurring incomes count in every month from their start month; one-off entries only in their own month.
  const incomes = w.incomes.filter((i) => (i.recurring ? monthKey(i.date) <= key : monthKey(i.date) === key));
  const expenses = w.expenses.filter((e) => (e.recurring ? monthKey(e.date) <= key : monthKey(e.date) === key));
  const income = incomes.reduce((a, b) => a + b.amount, 0);
  const spent = expenses.reduce((a, b) => a + b.amount, 0);
  const byCat = Object.fromEntries(EXPENSE_CATS.map((c) => [c, 0])) as Record<ExpenseCat, number>;
  expenses.forEach((e) => (byCat[e.category] += e.amount));
  const savingsLogged = w.savingsLog.filter((s) => monthKey(s.date) === key).reduce((a, b) => a + b.amount, 0);
  const goalContrib = w.goals.flatMap((g) => g.contributions).filter((c) => monthKey(c.date) === key).reduce((a, b) => a + b.amount, 0);
  const savings = savingsLogged + goalContrib;
  const planned = w.planned.filter((p) => p.active).reduce((a, b) => a + b.amount, 0);
  const emi = w.debts.reduce((a, b) => a + b.emi, 0);
  const remaining = income - spent - emi - savings - planned;
  const budgetCats = Object.entries(w.budgets).filter(([, v]) => (v ?? 0) > 0) as [ExpenseCat, number][];
  const budgetStatus = budgetCats.map(([c, b]) => ({ category: c, budget: b, spent: byCat[c], pct: b ? byCat[c] / b : 0 }));
  return { key, income, spent, emi, savings, planned, remaining, byCat, incomes, expenses, budgetStatus };
}

export function emergencySaved(w: Wallet) {
  return w.goals.filter((g) => g.kind === "emergency").reduce((a, g) => a + g.saved, 0);
}

export function goalsMonthly(w: Wallet) {
  const now = new Date();
  return w.goals.filter((g) => g.kind !== "emergency" && g.saved < g.target).reduce((a, g) => {
    const d = new Date(g.deadline);
    const months = Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth());
    return a + monthlyNeeded(g.target, g.saved, months);
  }, 0);
}

/** Average of the last 3 months that have data, falling back to the current month. */
export function averages(w: Wallet) {
  const months = lastMonths(3).map((k) => monthSummary(w, k)).filter((m) => m.income > 0 || m.spent > 0);
  const cur = monthSummary(w, thisMonth());
  if (!months.length) return { income: cur.income, expenses: cur.spent, months: 0 };
  return { income: months.reduce((a, m) => a + m.income, 0) / months.length, expenses: months.reduce((a, m) => a + m.spent, 0) / months.length, months: months.length };
}

export function planInputFromState(s: State, override?: Partial<PlanInput>): PlanInput {
  const w = s.wallet;
  const avg = averages(w);
  return {
    income: avg.income,
    expenses: avg.expenses,
    emi: w.debts.reduce((a, d) => a + d.emi, 0),
    highInterestDebt: w.debts.filter((d) => d.ratePct >= 14).reduce((a, d) => a + d.outstanding, 0),
    emergencySaved: emergencySaved(w),
    goalsMonthly: goalsMonthly(w),
    risk: s.finProfile.risk,
    horizonYears: s.finProfile.horizonYears,
    incomeStable: s.finProfile.incomeStable,
    dependents: s.finProfile.dependents,
    existingInvestments: 0,
    ...override,
  };
}

export const planFromState = (s: State, override?: Partial<PlanInput>) => makePlan(planInputFromState(s, override));

export function healthFromState(s: State) {
  const w = s.wallet;
  const keys = lastMonths(3);
  const sums = keys.map((k) => monthSummary(w, k));
  const tracked = sums.filter((m) => m.income > 0 || m.spent > 0);
  const cur = monthSummary(w, thisMonth());
  const avg = averages(w);
  const kinds = new Set<string>();
  [...s.paper.holdings, ...s.manual].forEach((h) => {
    if (h.kind === "stock") kinds.add("equity-stock");
    else if (/debt|liquid|bond|gilt|money market|overnight/i.test(h.category ?? "")) kinds.add("debt");
    else if (/hybrid|asset allocation|balanced/i.test(h.category ?? "")) kinds.add("hybrid");
    else if (/gold/i.test(h.category ?? "")) kinds.add("gold");
    else kinds.add("equity-fund");
  });
  if (emergencySaved(w) > 0) kinds.add("cash");
  return healthScore({
    income: avg.income, expenses: avg.expenses, emi: cur.emi, emergencySaved: emergencySaved(w), savedThisMonth: cur.savings,
    monthsWithSavings: tracked.filter((m) => m.savings > 0 || m.income - m.spent - m.emi > 0).length, monthsTracked: tracked.length,
    budgetsSet: cur.budgetStatus.length, budgetsKept: cur.budgetStatus.filter((b) => b.pct <= 1).length, assetClasses: Math.min(kinds.size, 4),
  });
}

/** Compact, consented summary that FINOVA AI may use for context. Never includes notes or identifiers. */
export function walletContext(s: State) {
  const cur = monthSummary(s.wallet, thisMonth());
  const avg = averages(s.wallet);
  const top = Object.entries(cur.byCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ₹${Math.round(v)}`).join(", ");
  return [
    `Average monthly income (last ${avg.months || 1} month(s)): ₹${Math.round(avg.income)}`,
    `Average monthly expenses: ₹${Math.round(avg.expenses)}; this month's top categories: ${top || "none recorded"}`,
    `Loan EMIs: ₹${Math.round(cur.emi)} per month; high-interest debt outstanding: ₹${Math.round(s.wallet.debts.filter((d) => d.ratePct >= 14).reduce((a, d) => a + d.outstanding, 0))}`,
    `Emergency fund saved: ₹${Math.round(emergencySaved(s.wallet))}`,
    `Goals: ${s.wallet.goals.map((g) => `${g.name} ₹${Math.round(g.saved)}/₹${Math.round(g.target)} by ${g.deadline}`).join("; ") || "none"}`,
    `Planned monthly investments: ₹${Math.round(cur.planned)}`,
    `Risk tolerance: ${s.finProfile.risk}; horizon ${s.finProfile.horizonYears} years; income ${s.finProfile.incomeStable ? "stable" : "irregular"}; dependents ${s.finProfile.dependents}`,
  ].join("\n");
}
