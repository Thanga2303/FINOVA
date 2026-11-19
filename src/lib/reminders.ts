import { allLessons } from "../data";
import type { State } from "./store";
import { monthSummary, thisMonth } from "./wallet";

export type Reminder = { id: string; period: string; kind: keyof Omit<State["notify"], "enabled" | "browser">; title: string; body: string; to: string };

/** Computes reminders that are due now, based on the user's own data and notification preferences. */
export function dueReminders(s: State, now = new Date()): Reminder[] {
  if (!s.notify.enabled) return [];
  const out: Reminder[] = [];
  const m = thisMonth();
  const today = now.toLocaleDateString("en-CA");
  const sum = monthSummary(s.wallet, m);
  if (s.notify.income && sum.income === 0) out.push({ id: "income", period: m, kind: "income", title: "Update this month's income", body: "Add your salary or other income so your budget and plan stay accurate.", to: "/wallet?tab=income" });
  const lastExp = s.wallet.expenses.map((e) => e.date).sort().at(-1);
  const days = lastExp ? Math.floor((now.getTime() - new Date(lastExp).getTime()) / 864e5) : 99;
  if (s.notify.expenses && days >= 3) out.push({ id: "expenses", period: today, kind: "expenses", title: "Log your recent expenses", body: lastExp ? `Your last expense entry was ${days} days ago.` : "Start tracking where your money goes.", to: "/wallet?tab=expenses" });
  if (s.notify.budget) sum.budgetStatus.filter((b) => b.pct >= 0.8).forEach((b) => out.push({ id: `budget-${b.category}`, period: m + (b.pct >= 1 ? "-over" : "-80"), kind: "budget", title: b.pct >= 1 ? `${b.category} budget exceeded` : `${b.category} budget at ${Math.round(b.pct * 100)}%`, body: `₹${Math.round(b.spent).toLocaleString("en-IN")} of ₹${Math.round(b.budget).toLocaleString("en-IN")} used this month.`, to: "/wallet?tab=budgets" }));
  if (s.notify.sip) s.wallet.planned.filter((p) => p.active).forEach((p) => {
    const diff = p.dayOfMonth - now.getDate();
    if (diff >= 0 && diff <= 2) out.push({ id: `sip-${p.id}`, period: m, kind: "sip", title: `SIP reminder: ${p.name}`, body: `₹${p.amount.toLocaleString("en-IN")} is planned on day ${p.dayOfMonth}. FINOVA doesn't pay it; make sure your bank account has funds.`, to: "/wallet?tab=commitments" });
  });
  if (s.notify.goals) s.wallet.goals.filter((g) => g.saved < g.target).forEach((g) => {
    const contributed = g.contributions.some((c) => c.date.startsWith(m));
    if (!contributed && now.getDate() >= 10) out.push({ id: `goal-${g.id}`, period: m, kind: "goals", title: `Add to “${g.name}”`, body: `No contribution yet this month. ₹${Math.round(g.target - g.saved).toLocaleString("en-IN")} to go.`, to: "/wallet?tab=goals" });
  });
  if (s.notify.learning && !s.activeDays.includes(today)) {
    const next = allLessons.find((l) => !s.completed[l.id]);
    if (next) out.push({ id: "learning", period: today, kind: "learning", title: "Today's learning goal", body: `Next up: ${next.title}`, to: `/learn/${next.academy}/${next.id}` });
  }
  return out.filter((r) => s.dismissed[r.id] !== r.period);
}
