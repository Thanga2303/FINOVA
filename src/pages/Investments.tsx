import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cleanSym, fmtDate, fmtTime, getJSON, useApi, type Chart, type FundDetail, type FundRow, type FundSummary, type Meta, type Quote } from "../lib/api";
import { cancelOrder, checkLimitOrders, resetPaper } from "../lib/paper";
import { PAPER_CASH, setState, uid, useStore, type Holding } from "../lib/store";
import { inr, Page } from "../components/ui";
import { Avatar, Change, DataBadge, ErrorNote, price, Sparkline } from "../components/market/bits";
import StockSearch from "../components/market/StockSearch";
import Journal from "../components/Journal";
import TradingAnalytics, { type PortfolioInsight } from "../components/TradingAnalytics";
import { AdSlot, FeatureGate, Locked } from "../components/Membership";
import { useAccount } from "../lib/account";

const AllocationDonut = lazy(() => import("../three/AllocationDonut"));
const TABS = [{ id: "portfolio", label: "Portfolio" }, { id: "orders", label: "Orders & analytics" }, { id: "journal", label: "Journal" }, { id: "watchlists", label: "Watchlists" }] as const;
const PIE = ["#00D4FF", "#00E6A0", "#8B5CF6", "#FBBF24", "#FB7185", "#38BDF8", "#F472B6", "#94A3B8"];

function assetClass(h: Holding) {
  if (h.kind === "stock") return "Stocks";
  const c = h.category ?? "";
  if (/Liquid|Overnight|Money Market|Debt|Bond|Gilt|Duration|Credit|Income/i.test(c)) return "Debt funds";
  if (/Hybrid|Balanced|Asset Allocation|Arbitrage|Equity Savings/i.test(c)) return "Hybrid funds";
  if (/Gold/i.test(c)) return "Gold";
  return "Equity funds";
}

/** Live prices for a set of holdings: delayed quotes for stocks, latest NAV for funds. */
export function usePrices(holdings: Holding[]) {
  const stocks = [...new Set(holdings.filter((h) => h.kind === "stock").map((h) => h.symbol))];
  const funds = [...new Set(holdings.filter((h) => h.kind === "fund").map((h) => h.symbol))];
  const q = useApi<{ items: Quote[]; meta: Meta }>(stocks.length ? `/api/market/quotes?symbols=${stocks.map(encodeURIComponent).join(",")}` : null, { poll: 60e3, maxAge: 55e3 });
  const f = useApi<{ items: FundSummary[]; meta: Meta }>(funds.length ? `/api/funds/summary?codes=${funds.join(",")}` : null, { maxAge: 3600e3 });
  return useMemo(() => {
    const px: Record<string, number> = {};
    const chg: Record<string, number | null> = {};
    q.data?.items.forEach((x) => { if (x.price != null) { px[x.symbol] = x.price; chg[x.symbol] = x.changePct; } });
    f.data?.items.forEach((x) => { px[String(x.code)] = x.nav; });
    return { px, chg, meta: q.data?.meta ?? f.data?.meta ?? null, loading: q.loading || f.loading, error: q.error || f.error };
  }, [q.data, f.data, q.loading, f.loading, q.error, f.error]);
}

function useHistory(holdings: Holding[]) {
  const [series, setSeries] = useState<{ t: number; v: number }[]>([]);
  const key = holdings.map((h) => `${h.kind}:${h.symbol}:${h.qty}`).join("|");
  useEffect(() => {
    let alive = true;
    const list = holdings.slice(0, 12);
    if (!list.length) { setSeries([]); return; }
    Promise.all(list.map(async (h) => {
      try {
        if (h.kind === "stock") {
          const c = await getJSON<Chart>(`/api/market/chart/${encodeURIComponent(h.symbol)}?range=1y`, 15 * 60e3);
          return { h, pts: c.points.map((p) => ({ t: p.t, p: p.c })) };
        }
        const d = await getJSON<FundDetail>(`/api/funds/${h.symbol}`, 3600e3);
        const cut = Date.now() - 366 * 864e5;
        return { h, pts: d.history.filter((p) => p.t >= cut).map((p) => ({ t: p.t, p: p.nav })) };
      } catch { return { h, pts: [] as { t: number; p: number }[] }; }
    })).then((all) => {
      if (!alive) return;
      const days = [...new Set(all.flatMap((a) => a.pts.map((p) => Math.floor(p.t / 864e5))))].sort((a, b) => a - b);
      const idx = all.map(() => 0);
      const last = all.map(() => 0);
      const out = days.map((d) => {
        let v = 0;
        all.forEach((a, i) => {
          while (idx[i] < a.pts.length && Math.floor(a.pts[idx[i]].t / 864e5) <= d) last[i] = a.pts[idx[i]++].p;
          v += last[i] * a.h.qty;
        });
        return { t: d * 864e5, v: Math.round(v) };
      }).filter((p, i, arr) => i > arr.length * 0.02 || p.v > 0);
      setSeries(out);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return series;
}

function AddManual() {
  const [kind, setKind] = useState<"stock" | "fund">("stock");
  const [pick, setPick] = useState<{ symbol: string; name: string; category?: string } | null>(null);
  const [qty, setQty] = useState(1);
  const [avg, setAvg] = useState(0);
  const [fq, setFq] = useState("");
  const funds = useApi<{ items: FundRow[] }>(kind === "fund" && fq.trim().length > 2 ? `/api/funds?q=${encodeURIComponent(fq)}&limit=8` : null, { maxAge: 3600e3 });
  const add = () => {
    if (!pick || !(qty > 0) || !(avg > 0)) return;
    setState((s) => ({ manual: [...s.manual, { id: uid(), kind, symbol: pick.symbol, name: pick.name, qty, avg, category: pick.category, addedAt: Date.now() }] }));
    setPick(null); setQty(1); setAvg(0); setFq("");
  };
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="font-semibold">Track a holding you own</h3>
      <p className="text-xs text-muted mb-3">Manual tracking: enter what you hold elsewhere. FINOVA never connects to your broker or bank.</p>
      <div className="flex gap-2 mb-3">{(["stock", "fund"] as const).map((k) => <button key={k} onClick={() => { setKind(k); setPick(null); }} className={`chip !text-sm !px-3 !py-1.5 ${kind === k ? "!text-text !border-cyan/60 !bg-card-strong" : ""}`}>{k === "stock" ? "Stock" : "Mutual fund"}</button>)}</div>
      {pick ? (
        <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm"><span className="truncate">{pick.name}</span><button className="text-muted text-xs" onClick={() => setPick(null)}>Change</button></div>
      ) : kind === "stock" ? (
        <StockSearch onPick={(symbol, name) => setPick({ symbol, name, category: "Equity" })} />
      ) : (
        <div className="relative">
          <input className="field" placeholder="Search fund name…" value={fq} onChange={(e) => setFq(e.target.value)} />
          {funds.data && fq.length > 2 && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-line bg-bg2 p-1 max-h-60 overflow-y-auto">
              {funds.data.items.map((f) => <button key={f.code} className="w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-card-strong" onClick={() => { setPick({ symbol: String(f.code), name: f.name, category: f.category }); setAvg(+f.nav.toFixed(4)); }}>{f.name}</button>)}
              {funds.data.items.length === 0 && <div className="text-sm text-muted p-2">No matches</div>}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <label className="text-sm"><span className="text-muted">{kind === "stock" ? "Shares" : "Units"}</span><input type="number" min={0} step={kind === "stock" ? 1 : 0.001} className="field mt-1" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} /></label>
        <label className="text-sm"><span className="text-muted">Avg buy price (₹)</span><input type="number" min={0} step={0.01} className="field mt-1" value={avg} onChange={(e) => setAvg(Number(e.target.value) || 0)} /></label>
      </div>
      <button className="btn-primary w-full mt-3 disabled:opacity-40" disabled={!pick || !(qty > 0) || !(avg > 0)} onClick={add}>Add to tracked portfolio</button>
    </div>
  );
}

function Portfolio() {
  const { features } = useAccount();
  const paper = useStore((s) => s.paper);
  const manual = useStore((s) => s.manual);
  const [view, setView] = useState<"paper" | "manual" | "all">("all");
  const holdings = view === "paper" ? paper.holdings : view === "manual" ? manual : [...paper.holdings, ...manual];
  const { px, chg, meta, error } = usePrices([...paper.holdings, ...manual]);
  const history = useHistory(holdings);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  useEffect(() => { if (Object.keys(px).length) checkLimitOrders(px); }, [px]);

  const rows = holdings.map((h) => {
    const p = px[h.symbol];
    const value = p != null ? p * h.qty : null;
    const cost = h.avg * h.qty;
    return { h, p, value, cost, pnl: value != null ? value - cost : null };
  });
  const invested = rows.reduce((a, r) => a + r.cost, 0);
  const current = rows.reduce((a, r) => a + (r.value ?? r.cost), 0);
  const pnl = current - invested;
  const dayPnl = rows.reduce((a, r) => (r.h.kind === "stock" && r.value != null && chg[r.h.symbol] != null ? a + r.value - r.value / (1 + chg[r.h.symbol]! / 100) : a), 0);
  const alloc = Object.entries(rows.reduce<Record<string, number>>((m, r) => { const k = assetClass(r.h); m[k] = (m[k] ?? 0) + (r.value ?? r.cost); return m; }, {})).map(([name, value]) => ({ name, value }));
  if (view !== "manual" && paper.cash > 0) alloc.push({ name: "Paper cash", value: paper.cash });
  const byHolding = rows.map((r) => ({ name: cleanSym(r.h.kind === "fund" ? r.h.name.split(" - ")[0] : r.h.symbol), value: r.value ?? r.cost })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {([["all", "All holdings"], ["paper", "Paper trading"], ["manual", "Manually tracked"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} aria-pressed={view === k} className={`chip !text-sm !px-3.5 !py-1.5 ${view === k ? "!text-text !border-cyan/60 !bg-card-strong" : ""}`}>{l}</button>
        ))}
        {view !== "manual" && <span className="ml-auto text-sm text-muted">Virtual cash: <span className="text-text font-semibold">{price(paper.cash)}</span></span>}
      </div>
      <ErrorNote error={error} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Current value", inr(current), "text-cyan"], ["Invested", inr(invested), ""],
          ["Overall P&L", inr(pnl), pnl >= 0 ? "text-emerald" : "text-rose"],
          ["Returns", invested ? `${((pnl / invested) * 100).toFixed(2)}%` : "—", pnl >= 0 ? "text-emerald" : "text-rose"],
          ["Today's P&L (stocks)", inr(dayPnl), dayPnl >= 0 ? "text-emerald" : "text-rose"],
        ].map(([k, v, c]) => <div key={k} className="glass rounded-2xl p-4"><div className="text-xs text-muted">{k}</div><div className={`font-display text-xl font-semibold mt-1 ${c}`}>{v}</div></div>)}
      </div>

      {holdings.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <h3 className="font-display text-xl font-semibold">No holdings yet</h3>
          <p className="text-muted mt-2">Place a paper order from any <Link className="text-cyan underline" to="/stocks">stock</Link> or <Link className="text-cyan underline" to="/funds">fund</Link> page, or track a holding you own below.</p>
        </div>
      ) : (
        <>
          <FeatureGate allow={(f) => f.portfolioAnalytics !== "basic"} plan="pro" title="Advanced portfolio analytics" text="Value history, the 3D allocation view and diversification metrics are part of FINOVA Pro.">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
            <div className="glass rounded-3xl p-5 min-w-0">
              <h3 className="font-semibold">Value of current holdings over the past year</h3>
              <p className="text-xs text-muted">What today's quantities would have been worth on each day (historical prices and NAVs).</p>
              <div className="h-60 mt-3">
                {history.length > 1 ? (
                  <ResponsiveContainer>
                    <AreaChart data={history}>
                      <defs><linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { month: "short" })} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => inr(Number(v))} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} labelFormatter={(t) => fmtDate(Number(t))} formatter={(v) => [inr(Number(v)), "Value"]} />
                      <Area dataKey="v" stroke="var(--cyan)" strokeWidth={2} fill="url(#pv)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="h-full grid place-items-center text-sm text-muted">Loading history…</div>}
              </div>
            </div>
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold">Asset allocation</h3><span className="text-[10px] text-faint">Drag to rotate · hover a slice</span></div>
              <div className="h-56">
                <Suspense fallback={<div className="h-full grid place-items-center text-xs text-muted">Loading 3D view…</div>}>
                  <AllocationDonut slices={alloc.map((a, i) => ({ ...a, color: PIE[i % PIE.length] }))} active={activeSlice} setActive={setActiveSlice}
                    fallback={<div className="h-48"> <ResponsiveContainer> <PieChart> <Pie data={alloc} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none"> {alloc.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)} </Pie> <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v, n) => [`${inr(Number(v))} (${((Number(v) / alloc.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`, n]} /> </PieChart> </ResponsiveContainer> </div>} />
                </Suspense>
              </div>
              <ul className="grid grid-cols-2 gap-1.5 text-xs">{alloc.map((a, i) => {
                const tot = alloc.reduce((x, y) => x + y.value, 0) || 1;
                return <li key={a.name}><button onMouseEnter={() => setActiveSlice(a.name)} onMouseLeave={() => setActiveSlice(null)} onFocus={() => setActiveSlice(a.name)} onBlur={() => setActiveSlice(null)} className={`w-full flex items-center gap-2 rounded-lg px-1.5 py-1 text-left ${activeSlice === a.name ? "bg-card-strong" : ""}`}><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE[i % PIE.length] }} /><span className="flex-1 truncate">{a.name}</span><span className="text-muted">{((a.value / tot) * 100).toFixed(1)}%</span></button></li>;
              })}</ul>
              <div className="mt-4 space-y-1.5">
                {byHolding.slice(0, 5).map((b) => (
                  <div key={b.name} className="text-xs"><div className="flex justify-between"><span className="truncate">{b.name}</span><span>{((b.value / current) * 100).toFixed(1)}%</span></div><div className="h-1.5 rounded-full bg-line mt-0.5"><div className="h-full rounded-full bg-violet" style={{ width: `${(b.value / current) * 100}%` }} /></div></div>
                ))}
              </div>
            </div>
          </div>
            <PortfolioInsights holdings={holdings.map((h) => ({ ...h, price: px[h.symbol] ?? h.avg }))} />
          </FeatureGate>
          {!features.adFree && <AdSlot index={0} />}
          {(["stock", "fund"] as const).map((kind) => {
            const list = rows.filter((r) => r.h.kind === kind);
            if (!list.length) return null;
            return (
              <div key={kind} className="glass rounded-3xl p-5 overflow-x-auto scroll-thin">
                <h3 className="font-semibold mb-3">{kind === "stock" ? "Stock holdings" : "Mutual fund holdings"}</h3>
                <table className="w-full text-sm min-w-[680px]">
                  <thead className="text-xs text-muted text-left border-b border-line"><tr><th className="py-2">Name</th><th className="text-right">{kind === "stock" ? "Shares" : "Units"}</th><th className="text-right">Avg cost</th><th className="text-right">{kind === "stock" ? "Price" : "NAV"}</th><th className="text-right">Value</th><th className="text-right">P&L</th><th /></tr></thead>
                  <tbody>{list.map(({ h, p, value, pnl: pl, cost }) => {
                    const isManual = manual.some((m) => m.id === h.id);
                    return (
                      <tr key={h.id} className="border-b border-line/60">
                        <td className="py-2.5"><Link to={kind === "stock" ? `/stocks/${encodeURIComponent(h.symbol)}` : `/funds/${h.symbol}`} className="font-medium hover:text-cyan">{kind === "stock" ? cleanSym(h.symbol) : h.name.split(" - ")[0]}</Link><div className="text-xs text-muted">{isManual ? "Manually tracked" : "Paper"}</div></td>
                        <td className="text-right tabular-nums">{kind === "stock" ? h.qty : h.qty.toFixed(3)}</td>
                        <td className="text-right tabular-nums">{price(h.avg, kind === "fund" ? 4 : 2)}</td>
                        <td className="text-right tabular-nums">{price(p, kind === "fund" ? 4 : 2)}</td>
                        <td className="text-right tabular-nums">{value != null ? inr(value) : "—"}</td>
                        <td className="text-right">{pl != null ? <Change pct={(pl / cost) * 100} abs={pl} /> : "—"}</td>
                        <td className="text-right">{isManual && <button className="text-xs text-muted hover:text-rose" onClick={() => setState((s) => ({ manual: s.manual.filter((m) => m.id !== h.id) }))}>Remove</button>}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            );
          })}
          {meta && <DataBadge meta={meta} kind="Delayed quotes / latest NAV" />}
        </>
      )}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <AddManual />
        <div className="glass rounded-3xl p-5 text-sm text-muted">
          <h3 className="font-semibold text-text">About paper trading</h3>
          <p className="mt-2">Your paper account starts with ₹{PAPER_CASH.toLocaleString("en-IN")} of virtual money. Orders use delayed stock prices and the latest published fund NAVs. Nothing is sent to a broker, exchange or AMC.</p>
          <p className="mt-2">Real investing needs an account with a SEBI-registered broker or mutual fund distributor, with KYC and your explicit consent for each transaction.</p>
          <button className="mt-3 text-xs hover:text-rose" onClick={() => confirm("Reset paper trading? Holdings and orders will be cleared and virtual cash reset.") && resetPaper(PAPER_CASH)}>Reset paper account</button>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const orders = useStore((s) => s.paper.orders);
  if (!orders.length) return <div className="glass rounded-3xl p-8 text-center text-muted">No paper orders yet. Orders you place on stock and fund pages appear here.</div>;
  return (
    <div className="glass rounded-3xl p-5 overflow-x-auto scroll-thin">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="text-xs text-muted text-left border-b border-line"><tr><th className="py-2">Time</th><th>Instrument</th><th>Side</th><th>Type</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Amount</th><th>Status</th><th /></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id} className="border-b border-line/60">
            <td className="py-2 text-xs text-muted">{fmtTime(o.executedAt ?? o.placedAt)}</td>
            <td className="max-w-[16rem] truncate">{o.kind === "stock" ? cleanSym(o.symbol) : o.name.split(" - ")[0]}</td>
            <td className={o.side === "BUY" ? "text-emerald" : "text-rose"}>{o.side}</td>
            <td className="text-xs">{o.type}{o.limitPrice ? ` @ ${price(o.limitPrice)}` : ""}</td>
            <td className="text-right tabular-nums">{o.kind === "fund" ? o.qty.toFixed(3) : o.qty}</td>
            <td className="text-right tabular-nums">{price(o.price, o.kind === "fund" ? 4 : 2)}</td>
            <td className="text-right tabular-nums">{inr(o.amount)}{o.pnl != null && <div className={`text-xs ${o.pnl >= 0 ? "text-emerald" : "text-rose"}`}>P&L {inr(o.pnl, 2)}</div>}</td>
            <td><span className={`chip ${o.status === "EXECUTED" ? "!text-emerald" : o.status === "OPEN" ? "!text-amber" : ""}`}>{o.status}</span></td>
            <td>{o.status === "OPEN" && <button className="text-xs text-muted hover:text-rose" onClick={() => cancelOrder(o.id)}>Cancel</button>}</td>
          </tr>
        ))}</tbody>
      </table>
      <p className="text-xs text-faint mt-3">Paper orders only. Charges shown are illustrative estimates.</p>
    </div>
  );
}

function WatchRow({ q, onRemove }: { q: Quote; onRemove: () => void }) {
  const c = useApi<Chart>(`/api/market/chart/${encodeURIComponent(q.symbol)}?range=1m`, { maxAge: 15 * 60e3 });
  const vals = (c.data?.points ?? []).map((p) => p.c);
  const m = vals.length > 1 ? (vals.at(-1)! / vals[0] - 1) * 100 : null;
  return (
    <tr className="border-b border-line/60">
      <td className="py-2.5"><Link to={`/stocks/${encodeURIComponent(q.symbol)}`} className="flex items-center gap-2.5 hover:text-cyan"><Avatar name={q.name} size={28} /><span><span className="font-medium block">{cleanSym(q.symbol)}</span><span className="text-xs text-muted truncate block max-w-[12rem]">{q.name}</span></span></Link></td>
      <td className="text-right tabular-nums">{q.symbol.startsWith("^") ? q.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : price(q.price)}</td>
      <td className="text-right"><Change pct={q.changePct} abs={q.change} /></td>
      <td className="text-right"><span className={m == null ? "text-muted" : m >= 0 ? "text-emerald" : "text-rose"}>{m == null ? "—" : `${m >= 0 ? "+" : ""}${m.toFixed(2)}%`}</span></td>
      <td className="text-right"><div className="inline-block"><Sparkline values={vals} /></div></td>
      <td className="text-right"><button className="text-xs text-muted hover:text-rose" onClick={onRemove} aria-label={`Remove ${q.symbol}`}>Remove</button></td>
    </tr>
  );
}

function Watchlists() {
  const lists = useStore((s) => s.watchlists);
  const [active, setActive] = useState(lists[0]?.id ?? "");
  const list = lists.find((l) => l.id === active) ?? lists[0];
  const q = useApi<{ items: Quote[]; meta: Meta }>(list?.symbols.length ? `/api/market/quotes?symbols=${list.symbols.map(encodeURIComponent).join(",")}` : null, { poll: 60e3, maxAge: 55e3 });
  const update = (fn: (l: typeof list) => typeof list | null) => setState((s) => ({ watchlists: s.watchlists.flatMap((l) => (l.id === list.id ? (fn(l) ? [fn(l)!] : []) : [l])) }));
  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
      <aside className="glass rounded-3xl p-3 space-y-1">
        {lists.map((l) => (
          <button key={l.id} onClick={() => setActive(l.id)} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm flex justify-between ${l.id === list?.id ? "bg-card-strong" : "hover:bg-card"}`}><span className="truncate">{l.name}</span><span className="text-muted">{l.symbols.length}</span></button>
        ))}
        <button className="w-full text-left text-sm text-cyan rounded-xl px-3 py-2.5 hover:bg-card" onClick={() => {
          const name = prompt("Name your new watchlist");
          if (name?.trim()) { const id = uid(); setState((s) => ({ watchlists: [...s.watchlists, { id, name: name.trim().slice(0, 40), symbols: [] }] })); setActive(id); }
        }}>+ New watchlist</button>
      </aside>
      {list ? (
        <div className="glass rounded-3xl p-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-display text-xl font-semibold">{list.name}</h3>
            <div className="flex gap-2 text-xs">
              <button className="chip" onClick={() => { const n = prompt("Rename watchlist", list.name); if (n?.trim()) update((l) => ({ ...l, name: n.trim().slice(0, 40) })); }}>Rename</button>
              {lists.length > 1 && <button className="chip hover:!text-rose" onClick={() => confirm(`Delete “${list.name}”?`) && (update(() => null), setActive(lists.find((l) => l.id !== list.id)!.id))}>Delete</button>}
            </div>
          </div>
          <StockSearch placeholder="Add a stock or index…" onPick={(sym) => update((l) => (l.symbols.includes(sym) ? l : { ...l, symbols: [...l.symbols, sym] }))} />
          <ErrorNote error={q.error} />
          {list.symbols.length === 0 ? <p className="text-sm text-muted mt-4">This watchlist is empty. Search above to add stocks.</p> : (
            <div className="overflow-x-auto scroll-thin mt-4">
              <table className="w-full text-sm min-w-[620px]">
                <thead className="text-xs text-muted text-left border-b border-line"><tr><th className="py-2">Instrument</th><th className="text-right">Price</th><th className="text-right">Today</th><th className="text-right">1M</th><th className="text-right">1M trend</th><th /></tr></thead>
                <tbody>{(q.data?.items ?? []).map((x) => <WatchRow key={x.symbol} q={x} onRemove={() => update((l) => ({ ...l, symbols: l.symbols.filter((s) => s !== x.symbol) }))} />)}</tbody>
              </table>
            </div>
          )}
          {q.data && <DataBadge meta={q.data.meta} className="mt-3" />}
        </div>
      ) : null}
    </div>
  );
}

export default function Investments() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as (typeof TABS)[number]["id"]) ?? "portfolio";
  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Investments</div>
          <h1 className="font-display text-4xl font-semibold">Your FINOVA portfolio</h1>
          <p className="text-muted mt-2">Paper trading plus manual tracking of what you own. No real transactions.</p>
        </div>
        <Link to="/discover" className="btn-ghost">Discover investments</Link>
      </div>
      <div className="mt-6 flex gap-1 rounded-full border border-line p-1 w-fit" role="tablist">
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setParams({ tab: t.id })} className={`px-4 py-2 rounded-full text-sm font-semibold ${tab === t.id ? "bg-cyan text-[#04121c]" : "text-muted hover:text-text"}`}>{t.label}</button>)}
      </div>
      <div className="mt-6">{tab === "orders" ? <div className="space-y-6"><TradingAnalytics /><Orders /></div> : tab === "journal" ? <Journal /> : tab === "watchlists" ? <Watchlists /> : <Portfolio />}</div>
    </Page>
  );
}

type PortfolioMetrics = { total: number; byClass: { name: string; value: number; weight: number }[]; topWeight: number; effectiveHoldings: number; diversificationScore: number; winners: number; losers: number; insights?: PortfolioInsight[] };

/** Server-computed portfolio metrics (Pro) and insights (Elite). */
function PortfolioInsights({ holdings }: { holdings: (Holding & { price: number })[] }) {
  const { plan } = useAccount();
  const [m, setM] = useState<PortfolioMetrics | null>(null);
  const key = holdings.map((h) => `${h.symbol}:${h.qty}:${Math.round(h.price)}`).join("|");
  useEffect(() => {
    fetch("/api/analytics/portfolio", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ holdings }) })
      .then((r) => (r.ok ? r.json() : null)).then(setM).catch(() => setM(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, plan.id]);
  if (!m) return null;
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 mt-6">
      <div className="glass rounded-3xl p-5">
        <h3 className="font-semibold mb-3">Diversification</h3>
        <div className="flex items-end gap-3"><span className="font-display text-4xl font-semibold">{m.diversificationScore}</span><span className="text-muted text-sm mb-1">/ 100</span></div>
        <div className="h-2 rounded-full bg-line mt-2 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-rose via-amber to-emerald" style={{ width: `${m.diversificationScore}%` }} /></div>
        <ul className="mt-4 space-y-1.5 text-sm">
          <li className="flex justify-between"><span className="text-muted">Largest position</span><span>{(m.topWeight * 100).toFixed(1)}%</span></li>
          <li className="flex justify-between"><span className="text-muted">Behaves like</span><span>{m.effectiveHoldings.toFixed(1)} equal holdings</span></li>
          <li className="flex justify-between"><span className="text-muted">Above / below cost</span><span>{m.winners} / {m.losers}</span></li>
        </ul>
        <p className="text-[11px] text-faint mt-3">FINOVA's educational score from position weights and asset types.</p>
      </div>
      {m.insights ? (
        <div className="glass rounded-3xl p-5">
          <h3 className="font-semibold mb-3">Portfolio insights <span className="chip !text-amber ml-1">Elite</span></h3>
          <ul className="space-y-2">{m.insights.map((i, k) => <li key={k} className={`rounded-2xl border p-3 text-sm ${i.level === "warn" ? "border-amber/40 bg-amber/5" : "border-line bg-card"}`}>{i.text}</li>)}</ul>
          <p className="text-[11px] text-faint mt-3">Educational observations, not recommendations.</p>
        </div>
      ) : <Locked compact plan="elite" title="Advanced portfolio insights" text="Elite explains concentration, asset mix and risk in plain language." />}
    </div>
  );
}
