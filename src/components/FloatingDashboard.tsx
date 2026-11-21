import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { allLessons } from "../data";
import { cleanSym, useApi, type Chart, type Meta, type Overview, type Quote } from "../lib/api";
import { levelFor, PAPER_CASH, useStore } from "../lib/store";
import { usePrices } from "../pages/Investments";
import { CountUp, GridBackdrop, TiltCard } from "./fx";
import { Change, level as lvl } from "./market/bits";
import { Icon, inr, Reveal, Ring } from "./ui";

const money = (n: number) => inr(n);

function NiftyPanel({ market }: { market: Overview | null }) {
  const { data } = useApi<Chart>("/api/market/chart/%5ENSEI?range=1d", { poll: 60e3, maxAge: 55e3 });
  const pts = (data?.points ?? []).map((p) => ({ t: p.t, c: p.c }));
  const up = (market?.indices[0]?.changePct ?? 0) >= 0;
  return (
    <TiltCard className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Market indices</h3>
        <span className={`chip ${market?.status.open ? "!text-emerald" : "!text-amber"}`}>{market ? `Market ${market.status.label}` : "Loading…"}</span>
      </div>
      <div className="h-28 mt-2 -mx-1">
        <ResponsiveContainer>
          <AreaChart data={pts}>
            <defs><linearGradient id="fdn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={up ? "var(--emerald)" : "var(--rose)"} stopOpacity={0.45} /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
            <YAxis hide domain={["auto", "auto"]} />
            <Area dataKey="c" stroke={up ? "var(--emerald)" : "var(--rose)"} strokeWidth={2} fill="url(#fdn)" isAnimationActive={false} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-faint -mt-1 mb-2">NIFTY 50 today (delayed, intraday)</div>
      <ul className="space-y-1.5 text-sm">
        {(market?.indices ?? []).map((q) => (
          <li key={q.symbol}><Link to={`/stocks/${encodeURIComponent(q.symbol)}`} className="flex justify-between hover:text-cyan"><span className="text-muted">{q.name}</span><span className="flex gap-3"><span className="tabular-nums">{lvl(q.price)}</span><Change pct={q.changePct} /></span></Link></li>
        ))}
      </ul>
    </TiltCard>
  );
}

function WatchPanel() {
  const list = useStore((s) => s.watchlists[0]);
  const syms = (list?.symbols ?? []).slice(0, 5);
  const { data } = useApi<{ items: Quote[]; meta: Meta }>(syms.length ? `/api/market/quotes?symbols=${syms.map(encodeURIComponent).join(",")}` : null, { poll: 60e3, maxAge: 55e3 });
  return (
    <TiltCard className="p-5">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">{list?.name ?? "Watchlist"}</h3><Link to="/investments?tab=watchlists" className="text-xs text-cyan">Manage</Link></div>
      {syms.length === 0 ? <p className="text-sm text-muted">Add stocks to your watchlist from any stock page.</p> : (
        <ul className="space-y-2 text-sm">
          {(data?.items ?? []).map((q) => (
            <li key={q.symbol}><Link to={`/stocks/${encodeURIComponent(q.symbol)}`} className="flex justify-between gap-3 hover:text-cyan"><span className="font-medium">{cleanSym(q.symbol)}</span><span className="flex gap-3"><span className="tabular-nums text-muted">{q.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span><Change pct={q.changePct} /></span></Link></li>
          ))}
        </ul>
      )}
    </TiltCard>
  );
}

function LearningPanel() {
  const xp = useStore((s) => s.xp);
  const done = useStore((s) => Object.keys(s.completed).length);
  const { level, next, pct } = levelFor(xp);
  return (
    <TiltCard className="p-5">
      <h3 className="font-semibold mb-3">Learning progress</h3>
      <div className="flex items-center gap-4">
        <Ring pct={done / allLessons.length} size={92} stroke={9} label={`${Math.round((done / allLessons.length) * 100)}%`} sub="lessons" />
        <div className="text-sm">
          <div className="font-display text-lg font-semibold">{level.name}</div>
          <div className="text-muted"><CountUp value={xp} format={(n) => `${Math.round(n)} XP`} /></div>
          <div className="h-1.5 w-32 rounded-full bg-line mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan to-emerald" style={{ width: `${pct * 100}%` }} /></div>
          <div className="text-[11px] text-faint mt-1">{next ? `${next.min - xp} XP to ${next.name}` : "Top level"}</div>
        </div>
      </div>
      <Link to="/learn" className="text-xs text-cyan mt-3 inline-block">Continue learning →</Link>
    </TiltCard>
  );
}

/** Home "cockpit": floating glass cards with live paper-portfolio figures, indices, watchlist and learning progress. */
export default function FloatingDashboard({ market }: { market: Overview | null }) {
  const paper = useStore((s) => s.paper);
  const { px, chg } = usePrices(paper.holdings);
  const holdings = paper.holdings.map((h) => ({ h, v: (px[h.symbol] ?? h.avg) * h.qty }));
  const invested = paper.holdings.reduce((a, h) => a + h.avg * h.qty, 0);
  const value = holdings.reduce((a, x) => a + x.v, 0);
  const total = value + paper.cash;
  const day = holdings.reduce((a, x) => (x.h.kind === "stock" && chg[x.h.symbol] != null ? a + x.v - x.v / (1 + chg[x.h.symbol]! / 100) : a), 0);
  const ret = total - PAPER_CASH;

  const stats = [
    { k: "Virtual portfolio value", v: total, c: "text-cyan", icon: "growth", sub: "Paper holdings + cash" },
    { k: "Available balance", v: paper.cash, c: "", icon: "shield", sub: "Virtual cash" },
    { k: "Today's P&L", v: day, c: day >= 0 ? "text-emerald" : "text-rose", icon: "chart", sub: "Paper stock holdings" },
    { k: "Total returns", v: ret, c: ret >= 0 ? "text-emerald" : "text-rose", icon: "trophy", sub: `${((ret / PAPER_CASH) * 100).toFixed(2)}% on ₹${(PAPER_CASH / 1000).toFixed(0)}K start` },
  ];

  return (
    <section className="relative mt-6" aria-label="Your FINOVA dashboard">
      <GridBackdrop className="opacity-60" />
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Your cockpit</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">Everything at a glance</h2>
          </div>
          <span className="text-xs text-muted">Paper-trading account · prices delayed · invested {money(invested)}</span>
        </div>
      </Reveal>
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Reveal key={s.k} delay={i * 0.06}>
            <Link to="/investments" className="block h-full">
              <TiltCard className="p-4 sm:p-5">
                <Icon name={s.icon} className={`w-5 h-5 ${s.c || "text-muted"}`} />
                <div className="text-xs text-muted mt-3">{s.k}</div>
                <div className={`font-display text-xl sm:text-2xl font-semibold mt-1 ${s.c}`}><CountUp value={s.v} format={money} /></div>
                <div className="text-[11px] text-faint mt-1">{s.sub}</div>
              </TiltCard>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="relative grid lg:grid-cols-3 gap-4 mt-4">
        <Reveal><NiftyPanel market={market} /></Reveal>
        <Reveal delay={0.08}><WatchPanel /></Reveal>
        <Reveal delay={0.16}><LearningPanel /></Reveal>
      </div>
    </section>
  );
}
