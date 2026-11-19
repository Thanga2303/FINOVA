/** Exact financial formulas used by calculators and FINOVA AI (never estimated by a language model). */

/** SIP future value (payments at the start of each month). */
export function sipFV(monthly: number, annualPct: number, years: number) {
  const n = Math.round(years * 12);
  const i = annualPct / 100 / 12;
  const fv = i === 0 ? monthly * n : monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  return { invested: monthly * n, value: fv, gains: fv - monthly * n };
}

export function sipSeries(monthly: number, annualPct: number, years: number) {
  const i = annualPct / 100 / 12;
  let v = 0;
  const pts = [{ year: 0, invested: 0, value: 0 }];
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) v = (v + monthly) * (1 + i);
    pts.push({ year: y, invested: monthly * 12 * y, value: Math.round(v) });
  }
  return pts;
}

export function lumpFV(p: number, annualPct: number, years: number) {
  const v = p * Math.pow(1 + annualPct / 100, years);
  return { invested: p, value: v, gains: v - p };
}

export function lumpSeries(p: number, annualPct: number, years: number) {
  return Array.from({ length: years + 1 }, (_, y) => ({ year: y, invested: p, value: Math.round(p * Math.pow(1 + annualPct / 100, y)) }));
}

/** Monthly contribution needed to reach a target, starting from current savings, at an optional annual return. */
export function monthlyNeeded(target: number, current: number, months: number, annualPct = 0) {
  const remaining = Math.max(0, target - current);
  if (months <= 0) return remaining;
  const i = annualPct / 100 / 12;
  if (i === 0) return remaining / months;
  const fvCurrent = current * Math.pow(1 + i, months);
  const gap = Math.max(0, target - fvCurrent);
  return gap / (((Math.pow(1 + i, months) - 1) / i) * (1 + i));
}

/** Months to reach a target with a fixed monthly contribution (0% return). */
export function monthsToGoal(target: number, current: number, monthly: number) {
  const rem = Math.max(0, target - current);
  if (rem === 0) return 0;
  if (monthly <= 0) return Infinity;
  return Math.ceil(rem / monthly);
}

export const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };

export function cagr(start: number, end: number, years: number) {
  return years > 0 && start > 0 ? (Math.pow(end / start, 1 / years) - 1) * 100 : null;
}

// ---------------- Personal finance planner (deterministic, explainable) ----------------

export type PlanInput = {
  income: number;            // monthly take-home
  expenses: number;          // monthly essential + lifestyle spending
  emi: number;               // monthly loan EMIs
  highInterestDebt: number;  // outstanding credit card / personal loan at high interest
  emergencySaved: number;
  goalsMonthly: number;      // monthly amount needed for short-term goals (from goal planner)
  risk: "low" | "medium" | "high";
  horizonYears: number;
  incomeStable: boolean;
  dependents: number;
  existingInvestments: number;
};

export type PlanLine = { key: string; label: string; amount: number; why: string };
export type Plan = {
  surplus: number; emergencyTarget: number; emergencyMonths: number; lines: PlanLine[]; investable: number;
  equityRange: [number, number]; warnings: string[]; nextSteps: string[]; savingsRate: number;
};

const r100 = (x: number) => Math.max(0, Math.round(x / 100) * 100);

export function makePlan(p: PlanInput): Plan {
  const outgo = p.expenses + p.emi;
  const surplus = p.income - outgo;
  const months = p.incomeStable ? (p.dependents > 0 ? 6 : 4) : 9;
  const emergencyTarget = outgo * months;
  const emergencyGap = Math.max(0, emergencyTarget - p.emergencySaved);
  const warnings: string[] = [];
  const nextSteps: string[] = [];
  const lines: PlanLine[] = [
    { key: "expenses", label: "Expenses & EMIs", amount: r100(outgo), why: `Your recorded spending (${fmt(p.expenses)}) plus loan EMIs (${fmt(p.emi)}). These are fixed first.` },
  ];

  if (surplus <= 0) {
    warnings.push(`Your expenses and EMIs (${fmt(outgo)}) are equal to or higher than your income (${fmt(p.income)}). Investing should wait until there is a monthly surplus.`);
    nextSteps.push("List every expense for one month and mark each as need or want.", "Cut or pause two 'want' categories and set budgets for them.", "If you have high-interest debt, talk to the lender about restructuring.");
    return { surplus, emergencyTarget, emergencyMonths: months, lines, investable: 0, equityRange: [0, 0], warnings, nextSteps, savingsRate: 0 };
  }

  let left = surplus;
  const take = (amt: number) => { const a = Math.min(left, r100(amt)); left -= a; return a; };

  // 1. Flexible buffer: 10–20% of surplus for irregular costs, depending on income stability.
  const bufferPct = p.incomeStable ? 0.12 : 0.2;
  const buffer = take(surplus * bufferPct);
  // 2. High-interest debt first.
  let debt = 0;
  if (p.highInterestDebt > 0) {
    debt = take(Math.min(p.highInterestDebt, surplus * 0.4));
    warnings.push(`You have ${fmt(p.highInterestDebt)} of high-interest debt. Paying it off usually 'earns' more than investing, because card and personal-loan interest is often 14–40% a year.`);
  }
  // 3. Emergency fund: faster while the gap is large.
  let emergency = 0;
  if (emergencyGap > 0) {
    const share = p.emergencySaved < outgo ? 0.5 : 0.35;
    emergency = take(Math.min(emergencyGap, surplus * share));
  }
  // 4. Short-term goals.
  const goals = p.goalsMonthly > 0 ? take(Math.min(p.goalsMonthly, left * 0.6)) : 0;
  // 5. Investments: what remains, but keep a small free balance.
  const investable = left > 0 ? take(left * (emergencyGap > 0 ? 0.75 : 0.85)) : 0;
  const free = Math.max(0, r100(left));

  if (debt) lines.push({ key: "debt", label: "Extra debt repayment", amount: debt, why: "Clearing costly debt is a guaranteed saving of that interest rate, so it comes before market investments." });
  lines.push({ key: "emergency", label: "Emergency savings", amount: emergency, why: emergencyGap > 0 ? `Target: ${months} months of expenses (${fmt(emergencyTarget)}). You have ${fmt(p.emergencySaved)}, so ${fmt(emergencyGap)} is left. ${p.incomeStable ? "" : "Irregular income needs a bigger cushion. "}At this pace it takes about ${Math.ceil(emergencyGap / Math.max(emergency, 1))} months.` : `Your emergency fund already covers ${months} months. Nothing extra needed.` });
  if (goals) lines.push({ key: "goals", label: "Short-term goals", amount: goals, why: `Based on the monthly amounts your goals need. Money needed within 3 years is better kept in low-risk options (RD, FD, liquid funds).` });
  lines.push({ key: "invest", label: "Potential investments", amount: investable, why: emergencyGap > 0 ? "You can start small SIPs while building the emergency fund, then raise them once it is complete." : "With your safety net in place, most of the remaining surplus can go towards long-term goals." });
  lines.push({ key: "flex", label: "Flexible balance", amount: buffer + free, why: "Kept unallocated for irregular costs (gifts, repairs, travel) so you don't break savings for small surprises." });

  const eq: Record<PlanInput["risk"], [number, number]> = { low: [20, 40], medium: [40, 65], high: [60, 80] };
  let equityRange = eq[p.risk];
  if (p.horizonYears < 3) { equityRange = [0, 20]; warnings.push("For goals under 3 years, market-linked equity is risky; low-risk options fit better."); }
  else if (p.horizonYears < 5) equityRange = [Math.min(equityRange[0], 20), Math.min(equityRange[1], 50)];

  const savingsRate = ((surplus - buffer - free) / p.income) * 100;
  if (savingsRate < 10) warnings.push("Your savings rate is below 10% of income. Small cuts in the largest spending categories make the biggest difference.");
  if (p.emi / p.income > 0.4) warnings.push(`EMIs take ${Math.round((p.emi / p.income) * 100)}% of income. Above 40% is generally considered stretched; avoid new loans.`);

  nextSteps.push(
    emergencyGap > 0 ? `Open a separate savings account or liquid fund for the emergency fund and set an auto-transfer of ${fmt(emergency)} on payday.` : "Keep the emergency fund untouched and review it once a year.",
    investable > 0 ? `Learn about index funds and SIPs before choosing where ${fmt(investable)} a month could go. Compare funds in FINOVA's Mutual Funds section.` : "Focus on increasing your surplus before investing.",
    "Track expenses in FINOVA Wallet for 2–3 months, then revisit this plan with real numbers.",
  );

  return { surplus, emergencyTarget, emergencyMonths: months, lines, investable, equityRange, warnings, nextSteps, savingsRate };
}

function fmt(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

// ---------------- Financial health score (educational) ----------------

export type HealthInput = {
  income: number; expenses: number; emi: number; emergencySaved: number; savedThisMonth: number;
  monthsWithSavings: number; monthsTracked: number; budgetsSet: number; budgetsKept: number; assetClasses: number;
};
export type HealthPart = { key: string; label: string; score: number; max: number; tip: string };

export function healthScore(h: HealthInput): { total: number; parts: HealthPart[] } {
  const outgo = h.expenses + h.emi;
  const sr = h.income > 0 ? (h.income - outgo) / h.income : 0;
  const efMonths = outgo > 0 ? h.emergencySaved / outgo : 0;
  const dti = h.income > 0 ? h.emi / h.income : 0;
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const parts: HealthPart[] = [
    { key: "savings", label: "Savings rate", max: 20, score: Math.round(clamp(sr / 0.3) * 20), tip: sr >= 0.2 ? "Great: you save 20%+ of income." : "Aim to save at least 20% of income; start by trimming your largest category." },
    { key: "consistency", label: "Savings consistency", max: 15, score: Math.round(clamp(h.monthsTracked ? h.monthsWithSavings / h.monthsTracked : 0) * 15), tip: "Saving something every month matters more than the amount. Automate a transfer on payday." },
    { key: "emergency", label: "Emergency fund", max: 20, score: Math.round(clamp(efMonths / 6) * 20), tip: efMonths >= 6 ? "Your emergency fund covers 6+ months." : `You cover ${efMonths.toFixed(1)} months of expenses; build towards 6.` },
    { key: "debt", label: "Debt burden", max: 15, score: Math.round(clamp(1 - dti / 0.5) * 15), tip: dti <= 0.2 ? "EMIs are a comfortable share of income." : "Keep total EMIs under about 30–40% of income." },
    { key: "budget", label: "Budget discipline", max: 15, score: h.budgetsSet ? Math.round((h.budgetsKept / h.budgetsSet) * 15) : 4, tip: h.budgetsSet ? "Budgets kept this month vs. set." : "Set monthly budgets for your top spending categories." },
    { key: "diversification", label: "Investment diversification", max: 15, score: Math.round(clamp(h.assetClasses / 3) * 15), tip: h.assetClasses >= 3 ? "You hold several asset types." : "Spread long-term money across asset types (e.g. equity funds, debt, gold)." },
  ];
  return { total: parts.reduce((a, p) => a + p.score, 0), parts };
}
