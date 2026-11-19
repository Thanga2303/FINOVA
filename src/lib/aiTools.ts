import { getJSON, type FundDetail, type FundRow, type NewsItem, type StockDetail } from "./api";
import { lumpFV, lumpSeries, makePlan, monthlyNeeded, sipFV, sipSeries, type Plan, type PlanInput } from "./finance";
import { getState } from "./store";
import { planInputFromState } from "./wallet";

/** Deterministic tools FINOVA AI uses before (or instead of) a language model. */

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Parses amounts like ₹2,000 · 2000 · 20k · 1.5 lakh · 2 crore. */
export function parseAmounts(text: string): number[] {
  const out: number[] = [];
  const re = /(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d+)*)\s*(k|thousand|lakhs?|lacs?|l\b|crores?|cr\b)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[1].replace(/,/g, "");
    let v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const u = (m[2] || "").toLowerCase();
    if (u === "k" || u === "thousand") v *= 1e3;
    else if (u.startsWith("lakh") || u.startsWith("lac") || u === "l") v *= 1e5;
    else if (u.startsWith("crore") || u === "cr") v *= 1e7;
    const hasCurrency = /₹|rs|inr/i.test(m[0]) || u;
    if (hasCurrency || v >= 100) out.push(v);
  }
  return out;
}
const years = (t: string) => { const m = t.match(/(\d+(?:\.\d+)?)\s*(years?|yrs?|y\b)/i); return m ? Number(m[1]) : null; };
const months = (t: string) => { const m = t.match(/(\d+)\s*(months?|mos?)\b/i); return m ? Number(m[1]) : null; };
const rate = (t: string) => { const m = t.match(/(\d+(?:\.\d+)?)\s*%/); return m ? Number(m[1]) : null; };

export type CalcCard =
  | { type: "sip"; monthly: number; years: number; rate: number; invested: number; value: number; gains: number; series: { year: number; invested: number; value: number }[] }
  | { type: "lumpsum"; principal: number; years: number; rate: number; invested: number; value: number; gains: number; series: { year: number; invested: number; value: number }[] }
  | { type: "goal"; target: number; months: number; current: number; rate: number; monthly: number };

export function detectCalc(text: string): CalcCard | null {
  const t = text.toLowerCase();
  const amts = parseAmounts(text).filter((a) => a !== rate(text));
  const y = years(t), r = rate(t) ?? 12;
  if (/\bsip\b|every month|per month|monthly|a month/.test(t) && /calculat|how much will|grow|become|final value|returns?|if i invest/.test(t) && amts.length && y) {
    const monthly = amts[0];
    return { type: "sip", monthly, years: y, rate: r, ...sipFV(monthly, r, y), series: sipSeries(monthly, r, Math.min(40, Math.round(y))) };
  }
  if (/lump ?sum|one[- ]time|invest .* (today|now)|fd|grow|compound/.test(t) && /calculat|how much will|grow|become|worth/.test(t) && amts.length && y) {
    const p = amts[0];
    return { type: "lumpsum", principal: p, years: y, rate: r, ...lumpFV(p, r, y), series: lumpSeries(p, r, Math.min(40, Math.round(y))) };
  }
  if (/goal|achieve|save up|reach|target/.test(t) && amts.length && (months(t) || y)) {
    const target = Math.max(...amts);
    const current = amts.length > 1 ? Math.min(...amts) : 0;
    const n = months(t) ?? Math.round((y ?? 1) * 12);
    const rr = rate(t) ?? 0;
    return { type: "goal", target, months: n, current, rate: rr, monthly: monthlyNeeded(target, current, n, rr) };
  }
  return null;
}

export function calcText(c: CalcCard): string {
  if (c.type === "sip") return `**SIP calculation**\n\n- Monthly investment: ${INR(c.monthly)}\n- Duration: ${c.years} years (${Math.round(c.years * 12)} instalments)\n- Assumed annual return: ${c.rate}%\n- Total invested: ${INR(c.invested)}\n- Estimated returns: ${INR(c.gains)}\n- **Estimated final value: ${INR(c.value)}**\n\nFormula: FV = P × [((1 + i)ⁿ − 1) ÷ i] × (1 + i), with i = ${c.rate}% ÷ 12 and n = ${Math.round(c.years * 12)} months.\n\n_Hypothetical illustration. Actual market returns vary, can be negative, and are not guaranteed._`;
  if (c.type === "lumpsum") return `**Lump-sum calculation**\n\n- Investment: ${INR(c.principal)}\n- Duration: ${c.years} years\n- Assumed annual return: ${c.rate}%\n- Estimated gain: ${INR(c.gains)}\n- **Estimated final value: ${INR(c.value)}**\n\nFormula: FV = P × (1 + r)ⁿ. Rule of 72: money doubles in about ${(72 / c.rate).toFixed(1)} years at ${c.rate}%.\n\n_Hypothetical illustration, not a guaranteed return._`;
  return `**Goal plan**\n\n- Target: ${INR(c.target)}\n- Already saved: ${INR(c.current)}\n- Time: ${c.months} months\n- Assumed return: ${c.rate ? c.rate + "% a year" : "0% (plain saving)"}\n- **Save about ${INR(c.monthly)} per month**\n\nTip: automate this amount on payday and track it as a goal in FINOVA Wallet. For goals under 3 years, low-risk options like RDs or liquid funds are usually more suitable than equity.`;
}

// ---------------- Planner ----------------

export function isPlanningQuestion(t: string) {
  return /i earn|my (salary|income)|earning|how should i manage|manage my money|how much should i (save|invest)|how much can i (potentially )?invest|budget|emergency fund first|plan my|analy[sz]e my financ|monthly plan|how much (money )?should i keep/i.test(t);
}

export function planFor(text: string, useWallet: boolean): { plan: Plan; input: PlanInput; usedWallet: boolean } {
  const s = getState();
  const base: PlanInput = useWallet ? planInputFromState(s) : { income: 0, expenses: 0, emi: 0, highInterestDebt: 0, emergencySaved: 0, goalsMonthly: 0, risk: s.finProfile.risk, horizonYears: s.finProfile.horizonYears, incomeStable: s.finProfile.incomeStable, dependents: s.finProfile.dependents, existingInvestments: 0 };
  const t = text.toLowerCase();
  const inc = text.match(/(?:earn|income|salary|make|get)[^\d₹]{0,25}((?:₹|rs\.?)?\s*\d[\d,.]*\s*(?:k|lakhs?|l\b)?)/i);
  const exp = text.match(/(?:spend|expenses?|costs?)[^\d₹]{0,25}((?:₹|rs\.?)?\s*\d[\d,.]*\s*(?:k|lakhs?|l\b)?)/i);
  const income = inc ? parseAmounts(inc[1])[0] : undefined;
  const expenses = exp ? parseAmounts(exp[1])[0] : undefined;
  const input: PlanInput = { ...base, ...(income ? { income } : {}), ...(expenses != null ? { expenses } : {}) };
  if (income && expenses == null && (!useWallet || base.expenses === 0)) input.expenses = Math.round(income * (/student/.test(t) ? 0.45 : 0.55));
  if (/student/.test(t)) input.dependents = 0;
  return { plan: makePlan(input), input, usedWallet: useWallet && !income };
}

export function planText(p: Plan, input: PlanInput, assumedExpenses: boolean, usedWallet: boolean): string {
  const sr = input.income ? ((input.income - input.expenses - input.emi) / input.income) * 100 : 0;
  return [
    `**1. Understanding your situation**\n${usedWallet ? "Using the figures in your FINOVA Wallet (with your permission)" : "Based on what you told me"}: income of ${INR(input.income)} a month${assumedExpenses ? `, and I've assumed expenses of about ${INR(input.expenses)} since you didn't share them (log real expenses in Wallet for a better plan)` : `, expenses of ${INR(input.expenses)}`}${input.emi ? ` and EMIs of ${INR(input.emi)}` : ""}. Risk preference: ${input.risk}; horizon: ${input.horizonYears} years.`,
    `**2. Monthly income analysis**\nAfter expenses and EMIs you have a surplus of ${INR(p.surplus)} (${sr.toFixed(0)}% of income).`,
    `**3. Expense analysis**\nExpenses and EMIs use ${input.income ? (((input.expenses + input.emi) / input.income) * 100).toFixed(0) : 0}% of income. ${sr < 20 ? "Try to bring this below 70–80% so you can save at least 20%." : "That leaves healthy room to save."}`,
    `**4. Emergency savings requirement**\nTarget: ${p.emergencyMonths} months of expenses = ${INR(p.emergencyTarget)}. You have ${INR(input.emergencySaved)} saved.`,
    `**5. Suggested monthly allocation (illustrative)**\n${p.lines.map((l) => `- ${l.label}: ${INR(l.amount)}`).join("\n")}`,
    `**6. Potential investment amount**\n${p.investable > 0 ? `About ${INR(p.investable)} a month. For a ${input.horizonYears}-year horizon and ${input.risk} risk, an equity share of roughly ${p.equityRange[0]}–${p.equityRange[1]}% (rest in debt) is a common educational range, not a recommendation.` : "Investing should wait until you have a monthly surplus."}`,
    `**7. Why this split**\n${p.lines.filter((l) => l.key !== "expenses").map((l) => `- ${l.label}: ${l.why}`).join("\n")}`,
    `**8. Risks to keep in mind**\n${["Market-linked investments can fall in value; returns are never guaranteed.", ...p.warnings].map((w) => `- ${w}`).join("\n")}`,
    `**9. Next steps**\n${p.nextSteps.map((n, i) => `${i + 1}. ${n}`).join("\n")}`,
    `_Educational guidance only. You approve every financial decision; FINOVA never moves or invests money._`,
  ].join("\n\n");
}

// ---------------- Research ----------------

export type Research = { context: string; summary: string; link?: string; label: string };

export async function research(text: string): Promise<Research | null> {
  const t = text.toLowerCase();
  if (/market news|news today|latest news|what.*happening.*market/.test(t)) {
    const n = await getJSON<{ items: NewsItem[] }>("/api/news?q=" + encodeURIComponent("India stock market Sensex Nifty") + "&count=8", 10 * 60e3);
    const lines = n.items.map((x) => `- ${x.title} (${x.publisher}, ${new Date(x.time).toLocaleDateString("en-IN")})`);
    return { label: "Market news", context: `Latest headlines (Yahoo Finance news search):\n${lines.join("\n")}`, summary: `**Latest market headlines**\n\n${n.items.slice(0, 6).map((x) => `- [${x.title}](${x.link}) · ${x.publisher}, ${new Date(x.time).toLocaleDateString("en-IN")}`).join("\n")}\n\n_Headlines only; open each article for details. News is not investment advice._` };
  }
  const fundish = /\bfund\b|\bmf\b|mutual/.test(t);
  const name = text.replace(/summari[sz]e|explain|fundamentals?|analy[sz]e|research|tell me about|what is|what are|characteristics|of|the|company|stock|share|please|\?/gi, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length < 3) return null;
  if (fundish) {
    const q = name.replace(/mutual|fund|mf/gi, "").trim();
    const list = await getJSON<{ items: FundRow[] }>(`/api/funds?q=${encodeURIComponent(q)}&limit=3`, 3600e3);
    const hit = list.items[0];
    if (!hit) return null;
    const d = await getJSON<FundDetail>(`/api/funds/${hit.code}`, 3600e3);
    const r = d.returns;
    const f = (v: number | null | undefined) => (v == null ? "n/a" : `${v.toFixed(2)}%`);
    const ctx = `Fund: ${d.name} (AMC ${d.amc}). Category: ${d.category}. NAV ₹${d.nav} on ${new Date(d.navDate ?? 0).toLocaleDateString("en-IN")}. Returns computed from AMFI NAV history: 1Y ${f(r["1Y"])}, 3Y CAGR ${f(r["3Y"])}, 5Y CAGR ${f(r["5Y"])}. Expense ratio: ${d.extra?.expenseRatio != null ? d.extra.expenseRatio.toFixed(2) + "%" : "not reported"}. Category-typical risk: ${d.risk}. Top holdings: ${d.extra?.holdings?.slice(0, 5).map((h) => `${h.name} ${h.weight.toFixed(1)}%`).join(", ") || "not reported"}.`;
    return { label: d.name, link: `/funds/${d.code}`, context: ctx, summary: `**${d.name}**\n\n- AMC: ${d.amc}\n- Category: ${d.category} (typical risk: ${d.risk ?? "n/a"})\n- NAV: ₹${d.nav?.toFixed(4)} (${new Date(d.navDate ?? 0).toLocaleDateString("en-IN")})\n- Returns: 1Y ${f(r["1Y"])} · 3Y CAGR ${f(r["3Y"])} · 5Y CAGR ${f(r["5Y"])}\n- Expense ratio: ${d.extra?.expenseRatio != null ? d.extra.expenseRatio.toFixed(2) + "%" : "not reported by data source"}\n${d.extra?.holdings?.length ? `- Top holdings: ${d.extra.holdings.slice(0, 5).map((h) => h.name).join(", ")}\n` : ""}\n**What this means:** returns are calculated from published NAVs; past performance doesn't guarantee future results. Compare it with funds in the same category and check its expense ratio and risk level.\n\n[Open the full fund page](/funds/${d.code})\n\n_Source: AMFI NAV data via MFAPI${d.extra ? "; fund profile from Yahoo Finance (Morningstar)" : ""}. Education, not advice._` };
  }
  const hits = await getJSON<{ symbol: string; name: string }[]>(`/api/market/search?q=${encodeURIComponent(name)}`, 3600e3);
  const hit = hits.find((h) => /\.NS$/.test(h.symbol)) ?? hits[0];
  if (!hit) return null;
  const s = await getJSON<StockDetail>(`/api/market/stock/${encodeURIComponent(hit.symbol)}`, 3600e3);
  const st = s.stats as Record<string, number | null>;
  const p = (v: number | null | undefined, d = 1) => (v == null ? "n/a" : `${(v * 100).toFixed(d)}%`);
  const cr = (v: number | null | undefined) => (v == null ? "n/a" : `₹${Math.round(v / 1e7).toLocaleString("en-IN")} crore`);
  const lastY = s.yearly.at(-1), prevY = s.yearly.at(-2);
  const growth = lastY?.revenue && prevY?.revenue ? ((lastY.revenue / prevY.revenue - 1) * 100).toFixed(1) + "%" : "n/a";
  const ctx = `Company: ${s.name} (${hit.symbol}). Sector ${s.profile.sector}, industry ${s.profile.industry}. Market cap ${cr(st.marketCap)}. P/E ${st.pe?.toFixed(1) ?? "n/a"}. EPS ₹${st.eps ?? "n/a"}. P/B ${st.pb?.toFixed(2) ?? "n/a"}. ROE ${p(st.roe)}. Profit margin ${p(st.profitMargin)}. Debt/equity ${st.debtToEquity ?? "n/a"}. Dividend yield ${p(st.dividendYield, 2)}. 52W range ₹${st.low52}–₹${st.high52}. Yearly revenue/earnings (${s.financialCurrency}): ${s.yearly.map((y) => `${y.year}: rev ${y.revenue}, earnings ${y.earnings}`).join("; ")}. Business: ${(s.profile.summary ?? "").slice(0, 600)}`;
  return {
    label: s.name, link: `/stocks/${encodeURIComponent(hit.symbol)}`, context: ctx,
    summary: `**${s.name}: fundamentals summary**\n\n${(s.profile.summary ?? "").split(". ").slice(0, 2).join(". ")}.\n\n- Market cap: ${cr(st.marketCap)} (${s.profile.sector ?? "sector n/a"})\n- P/E: ${st.pe?.toFixed(1) ?? "n/a"} · EPS: ₹${st.eps ?? "n/a"} · P/B: ${st.pb?.toFixed(2) ?? "n/a"}\n- ROE: ${p(st.roe)} · Profit margin: ${p(st.profitMargin)} · Debt/equity: ${st.debtToEquity ?? "n/a"}\n- Dividend yield: ${p(st.dividendYield, 2)}\n- Latest yearly revenue growth: ${growth}\n- 52-week range: ₹${st.low52 ?? "n/a"} – ₹${st.high52 ?? "n/a"}\n\n**How to read this:** compare P/E and margins with peers in ${s.profile.industry ?? "the same industry"}; high ROE with low debt usually signals an efficient business. Key risks include valuation, sector cycles and company-specific news.\n\n[Open the stock page](/stocks/${encodeURIComponent(hit.symbol)})\n\n_Source: Yahoo Finance (latest reported fundamentals). Education, not a buy/sell view._`,
  };
}
