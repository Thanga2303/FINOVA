import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { sipSeries } from "../lib/finance";
import { rng } from "../lib/sim";
import { inr } from "./ui";

/**
 * Animated explainers for core ideas. All figures are illustrative teaching examples, clearly labelled,
 * and never presented as market data.
 */
const TABS = [
  { id: "market", label: "How stock markets work", lesson: "/learn/stocks/buying-selling" },
  { id: "grow", label: "How investments grow", lesson: "/learn/mutual-funds/sip" },
  { id: "compound", label: "How compounding works", lesson: "/learn/investments/compounding" },
  { id: "diversify", label: "How diversification works", lesson: "/learn/investments/diversification-inv" },
  { id: "risk", label: "How market risk works", lesson: "/learn/investments/risk-tolerance" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function MarketFlow() {
  const nodes = [
    { x: 60, y: 70, t: "Buyer", s: "places a buy order" },
    { x: 60, y: 190, t: "Seller", s: "places a sell order" },
    { x: 230, y: 130, t: "Brokers", s: "send orders" },
    { x: 410, y: 130, t: "Exchange", s: "NSE / BSE match orders" },
    { x: 580, y: 70, t: "Clearing", s: "guarantees settlement" },
    { x: 580, y: 190, t: "Demat (NSDL/CDSL)", s: "shares move on T+1" },
  ];
  const paths = ["M95 70 C150 70 170 130 195 130", "M95 190 C150 190 170 130 195 130", "M270 130 L370 130", "M450 130 C500 130 520 70 545 70", "M450 130 C500 130 520 190 545 190"];
  return (
    <svg viewBox="0 0 660 260" className="w-full h-auto" role="img" aria-label="Orders flow from buyer and seller through brokers to the exchange, then clearing and depositories">
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="var(--line)" strokeWidth={2} fill="none" />
          <path d={d} stroke="var(--cyan)" strokeWidth={2} fill="none" strokeDasharray="6 10" className="flow-dash" />
          <circle r={4} fill={i < 2 ? "var(--emerald)" : "var(--cyan)"}>
            <animateMotion dur={`${2.4 + i * 0.2}s`} repeatCount="indefinite" path={d} begin={`${i * 0.35}s`} />
          </circle>
        </g>
      ))}
      {nodes.map((n) => (
        <g key={n.t} transform={`translate(${n.x},${n.y})`}>
          <rect x={-58} y={-26} width={116} height={52} rx={14} fill="var(--card-strong)" stroke="var(--line)" />
          <text textAnchor="middle" y={-4} fontSize={13} fontWeight={600} fill="var(--text)">{n.t}</text>
          <text textAnchor="middle" y={13} fontSize={9.5} fill="var(--muted)">{n.s}</text>
        </g>
      ))}
    </svg>
  );
}

function GrowChart() {
  const data = useMemo(() => sipSeries(5000, 12, 20), []);
  const W = 620, H = 230, max = data.at(-1)!.value;
  const pt = (i: number, v: number) => `${30 + (i / 20) * (W - 50)},${H - 20 - (v / max) * (H - 40)}`;
  const inv = data.map((d, i) => pt(i, d.invested)).join(" ");
  const val = data.map((d, i) => pt(i, d.value)).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Illustrative SIP growth: invested money rises in a straight line while the value curves upward">
        <motion.polyline points={val} fill="none" stroke="var(--emerald)" strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "easeInOut" }} />
        <motion.polyline points={inv} fill="none" stroke="var(--cyan)" strokeWidth={2} strokeDasharray="5 6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "easeInOut" }} />
        <text x={W - 20} y={28} textAnchor="end" fontSize={12} fill="var(--emerald)">Value {inr(max)}</text>
        <text x={W - 20} y={H - 60} textAnchor="end" fontSize={12} fill="var(--cyan)">Invested {inr(data.at(-1)!.invested)}</text>
        <text x={30} y={H - 4} fontSize={10} fill="var(--muted)">Year 0</text><text x={W - 20} y={H - 4} textAnchor="end" fontSize={10} fill="var(--muted)">Year 20</text>
      </svg>
      <p className="text-sm text-muted">₹5,000 a month for 20 years at a hypothetical 12% a year. The gap between the lines is growth earned on your money. Not a guaranteed return.</p>
    </div>
  );
}

function CompoundBlocks() {
  const years = 10, P = 100000, r = 0.1;
  const rows = Array.from({ length: years }, (_, i) => { const start = P * Math.pow(1 + r, i); return { start, interest: start * r }; });
  const max = P * Math.pow(1 + r, years);
  return (
    <div>
      <div className="flex items-end gap-2 h-56" role="img" aria-label="Each year's interest is added to the balance, so the interest itself grows">
        {rows.map((row, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <motion.div className="rounded-t-md bg-emerald/80" initial={{ height: 0 }} animate={{ height: `${(row.interest / max) * 100 * 2.1}%` }} transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }} title={`Year ${i + 1} interest ${inr(row.interest)}`} />
            <motion.div className="bg-cyan/60" initial={{ height: 0 }} animate={{ height: `${((row.start - P) / max) * 100 * 2.1}%` }} transition={{ delay: i * 0.15, duration: 0.5 }} />
            <motion.div className="bg-violet/60" initial={{ height: 0 }} animate={{ height: `${(P / max) * 100 * 2.1}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} />
            <div className="text-[10px] text-muted text-center mt-1">Y{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs mt-3"><span className="text-violet">■ Original ₹1 lakh</span><span className="text-cyan">■ Earlier interest (now earning too)</span><span className="text-emerald">■ This year's interest</span></div>
      <p className="text-sm text-muted mt-2">At 10% a year, year 1 earns {inr(rows[0].interest)} but year 10 earns {inr(rows[9].interest)}, because interest is earned on past interest. Ends at {inr(max)}. Illustrative.</p>
    </div>
  );
}

function Diversify() {
  const series = useMemo(() => {
    const r = rng(9);
    const one: number[] = [100], many: number[] = [100];
    for (let i = 1; i < 60; i++) {
      const market = (r() - 0.48) * 0.03;
      one.push(one[i - 1] * (1 + market + (r() - 0.5) * 0.09));
      let avg = 0; for (let k = 0; k < 10; k++) avg += (r() - 0.5) * 0.09; avg /= 10;
      many.push(many[i - 1] * (1 + market + avg));
    }
    return { one, many };
  }, []);
  const W = 620, H = 220;
  const all = [...series.one, ...series.many];
  const lo = Math.min(...all), hi = Math.max(...all);
  const pts = (a: number[]) => a.map((v, i) => `${20 + (i / 59) * (W - 40)},${H - 15 - ((v - lo) / (hi - lo)) * (H - 30)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="A single stock swings much more than a 10-stock portfolio">
        <motion.polyline points={pts(series.one)} fill="none" stroke="var(--rose)" strokeWidth={2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4 }} />
        <motion.polyline points={pts(series.many)} fill="none" stroke="var(--emerald)" strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4 }} />
      </svg>
      <div className="flex gap-4 text-xs"><span className="text-rose">— One stock</span><span className="text-emerald">— 10 stocks, same market</span></div>
      <p className="text-sm text-muted mt-2">Both face the same market moves, but company-specific surprises average out across 10 holdings, so the green line is much smoother. Simulated teaching example, not real prices.</p>
    </div>
  );
}

function RiskBands() {
  // Illustrative range of yearly returns for different asset types (wider = more uncertain).
  const rows = [
    { k: "Savings / FD", lo: 3, hi: 7, c: "var(--cyan)" },
    { k: "Debt funds", lo: 2, hi: 9, c: "var(--violet)" },
    { k: "Large-cap equity", lo: -20, hi: 35, c: "var(--amber)" },
    { k: "Small-cap equity", lo: -35, hi: 60, c: "var(--rose)" },
  ];
  const min = -40, max = 65, x = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div>
      <div className="space-y-5 py-2" role="img" aria-label="Riskier assets have a wider range of possible yearly outcomes">
        {rows.map((r, i) => (
          <div key={r.k}>
            <div className="flex justify-between text-sm"><span>{r.k}</span><span className="text-muted text-xs">{r.lo}% to +{r.hi}% in a typical year</span></div>
            <div className="relative h-3 rounded-full bg-line mt-1.5">
              <span className="absolute top-0 bottom-0 w-px bg-faint" style={{ left: `${x(0)}%` }} />
              <motion.span className="absolute top-0 h-3 rounded-full" style={{ background: r.c, left: `${x(r.lo)}%` }} initial={{ width: 0 }} animate={{ width: `${x(r.hi) - x(r.lo)}%` }} transition={{ delay: i * 0.2, duration: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted mt-2">Market risk is the chance your value moves away from what you expect. Higher long-term growth usually comes with a wider spread of outcomes, including losing years. Ranges are rough teaching illustrations, not forecasts.</p>
    </div>
  );
}

export default function ConceptLab() {
  const [tab, setTab] = useState<Tab>("market");
  const cur = TABS.find((t) => t.id === tab)!;
  return (
    <section className="glass rounded-3xl p-5 sm:p-7">
      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Concept lab</div>
      <h2 className="font-display text-2xl sm:text-3xl font-semibold">See the ideas move</h2>
      <div className="mt-4 flex gap-2 overflow-x-auto scroll-thin pb-1" role="tablist">
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`chip shrink-0 !text-sm !px-3.5 !py-1.5 ${tab === t.id ? "!text-text !border-cyan/60 !bg-card-strong" : ""}`}>{t.label}</button>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="mt-5 max-w-3xl mx-auto" style={{ transformPerspective: 900 }}>
          {tab === "market" ? <><MarketFlow /><p className="text-sm text-muted mt-2">When a buy and a sell order match on the exchange, the clearing corporation guarantees the trade and the depository moves shares into the buyer's Demat account on T+1.</p></> : tab === "grow" ? <GrowChart /> : tab === "compound" ? <CompoundBlocks /> : tab === "diversify" ? <Diversify /> : <RiskBands />}
        </motion.div>
      </AnimatePresence>
      <Link to={cur.lesson} className="inline-block mt-4 text-sm text-cyan underline">Open the full lesson</Link>
    </section>
  );
}
