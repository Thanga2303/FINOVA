import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cleanSym, fmtTime, useApi, type Chart, type Overview, type Quote } from "../lib/api";
import { Page, Icon } from "../components/ui";
import { Avatar, Change, crore, DataBadge, Drawer, ErrorNote, LearnButton, level, price, Skeleton, Sparkline } from "../components/market/bits";
import StockSearch from "../components/market/StockSearch";
import NewsList from "../components/market/NewsList";
import VideoPanel from "../components/VideoPanel";
import { AdSlot } from "../components/Membership";

const MarketField = lazy(() => import("../three/MarketField"));

function IndexCard({ q }: { q: Overview["indices"][number] }) {
  const { data } = useApi<Chart>(`/api/market/chart/${encodeURIComponent(q.symbol)}?range=1d`, { poll: 60e3, maxAge: 55e3 });
  const vals = (data?.points ?? []).map((p) => p.c);
  return (
    <Link to={`/stocks/${encodeURIComponent(q.symbol)}`} className="glass rounded-3xl p-5 hover:border-cyan/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted font-semibold">{q.name}</div>
          <div className="font-display text-2xl font-semibold mt-1 tabular-nums">{level(q.price)}</div>
          <Change pct={q.changePct} abs={q.change} className="text-sm" />
        </div>
        <Sparkline values={vals} w={110} h={44} up={(q.changePct ?? 0) >= 0} />
      </div>
      <div className="mt-3 grid grid-cols-2 text-xs text-muted gap-1">
        <span>Day high {level(q.dayHigh)}</span><span>Day low {level(q.dayLow)}</span>
      </div>
    </Link>
  );
}

function Movers({ title, list, metric }: { title: string; list: Quote[]; metric?: (q: Quote) => string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="divide-y divide-line">
        {list.map((q) => (
          <li key={q.symbol}>
            <Link to={`/stocks/${encodeURIComponent(q.symbol)}`} className="flex items-center gap-3 py-2.5 group">
              <Avatar name={q.name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate group-hover:text-cyan">{cleanSym(q.symbol)}</div>
                <div className="text-xs text-muted truncate">{metric ? metric(q) : q.name}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold tabular-nums">{price(q.price)}</div>
                <Change pct={q.changePct} className="text-xs" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SortKey = "name" | "price" | "changePct" | "marketCap" | "pe" | "volume";

export default function Stocks() {
  const { data, error, loading } = useApi<Overview>("/api/market/overview", { poll: 60e3, maxAge: 55e3 });
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "marketCap", dir: -1 });
  const [filter, setFilter] = useState("");
  const [learn, setLearn] = useState(false);
  const nav = useNavigate();
  const rows = useMemo(() => {
    const f = filter.toLowerCase();
    return [...(data?.stocks ?? [])].filter((s) => !f || (s.name + s.symbol).toLowerCase().includes(f)).sort((a, b) => {
      const av = sort.k === "name" ? a.name : (a[sort.k] as number | null) ?? -Infinity;
      const bv = sort.k === "name" ? b.name : (b[sort.k] as number | null) ?? -Infinity;
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
  }, [data, sort, filter]);
  const th = (k: SortKey, label: string, right = true) => (
    <th className={`py-2 font-medium cursor-pointer select-none ${right ? "text-right" : "text-left"}`} onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1 }))} aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      {label}{sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Stocks</div>
          <h1 className="font-display text-4xl font-semibold">Market dashboard</h1>
          {data && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className={`chip ${data.status.open ? "!text-emerald" : "!text-amber"}`}><span className={`w-2 h-2 rounded-full ${data.status.open ? "bg-emerald animate-pulse" : "bg-amber"}`} /> Market {data.status.label}</span>
              <span className="text-muted">Last trade {fmtTime(data.status.lastTradeTime)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-80"><StockSearch onPick={(s) => nav(`/stocks/${encodeURIComponent(s)}`)} /></div>
          <LearnButton onClick={() => setLearn(true)} />
        </div>
      </div>

      <ErrorNote error={error} />
      <section className="mt-6 grid md:grid-cols-3 gap-4">
        {loading && !data ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />) : data?.indices.map((q) => <IndexCard key={q.symbol} q={q} />)}
      </section>
      {data && <div className="mt-3"><DataBadge meta={data.meta} kind="Delayed quotes" /></div>}

      {data && (
        <>
          <section className="mt-6 glass rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-semibold">Market overview</h2>
              <span className="text-xs text-muted">{data.meta.universeNote}</span>
            </div>
            <div className="mt-4 flex h-3 rounded-full overflow-hidden" aria-label="Advancers vs decliners">
              <div className="bg-emerald" style={{ width: `${(data.breadth.advancers / data.breadth.universe) * 100}%` }} />
              <div className="bg-faint" style={{ width: `${(data.breadth.unchanged / data.breadth.universe) * 100}%` }} />
              <div className="bg-rose" style={{ width: `${(data.breadth.decliners / data.breadth.universe) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-emerald">{data.breadth.advancers} advancing</span><span className="text-rose">{data.breadth.decliners} declining</span></div>
            {(() => {
              const avg = data.stocks.reduce((a, s) => a + Math.abs(s.changePct ?? 0), 0) / Math.max(1, data.stocks.length);
              const mood = avg < 0.6 ? ["Calm", "text-emerald"] : avg < 1.4 ? ["Moderate", "text-amber"] : ["Volatile", "text-rose"];
              const fieldStocks = data.stocks.map((s) => ({ symbol: s.symbol, label: cleanSym(s.symbol), changePct: s.changePct ?? 0 }));
              return (
                <div className="mt-5 grid lg:grid-cols-[1fr_260px] gap-5 items-stretch">
                  <div className="relative h-[340px] sm:h-[400px] rounded-2xl border border-line bg-bg2/40 overflow-hidden">
                    <Suspense fallback={<div className="h-full grid place-items-center text-sm text-muted">Loading 3D market field…</div>}>
                      <MarketField stocks={fieldStocks} onPick={(s) => nav(`/stocks/${encodeURIComponent(s)}`)}
                        fallback={<div className="h-full p-4 grid grid-cols-8 sm:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 content-center">{[...fieldStocks].sort((a, b) => a.changePct - b.changePct).map((s) => <Link key={s.symbol} to={`/stocks/${encodeURIComponent(s.symbol)}`} title={`${s.label} ${s.changePct.toFixed(2)}%`} className="h-8 rounded text-[9px] grid place-items-center font-semibold" style={{ background: s.changePct >= 0 ? `rgba(0,230,160,${0.15 + Math.min(0.7, Math.abs(s.changePct) / 4)})` : `rgba(225,29,72,${0.15 + Math.min(0.7, Math.abs(s.changePct) / 4)})` }}>{s.label.slice(0, 5)}</Link>)}</div>} />
                    </Suspense>
                    <div className="absolute left-3 top-3 text-[11px] text-muted bg-bg2/70 rounded-lg px-2 py-1">Each bar = one stock · height = today's % move · drag to rotate · click to open</div>
                  </div>
                  <div className="rounded-2xl border border-line p-4 flex flex-col gap-4">
                    <div>
                      <div className="text-xs text-muted">Market volatility today</div>
                      <div className={`font-display text-2xl font-semibold ${mood[1]}`}>{mood[0]}</div>
                      <div className="text-xs text-muted">Average move: {avg.toFixed(2)}% across tracked stocks</div>
                      <div className="h-2 rounded-full bg-gradient-to-r from-emerald via-amber to-rose mt-2 relative"><span className="absolute -top-1 w-4 h-4 rounded-full bg-text border-2 border-bg" style={{ left: `calc(${Math.min(100, (avg / 2.5) * 100)}% - 8px)` }} /></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-1">Trend</div>
                      <div className="text-sm">{data.breadth.advancers > data.breadth.decliners * 1.5 ? <span className="text-emerald font-semibold">Broadly bullish</span> : data.breadth.decliners > data.breadth.advancers * 1.5 ? <span className="text-rose font-semibold">Broadly bearish</span> : <span className="text-amber font-semibold">Mixed</span>} <span className="text-muted">({data.breadth.advancers} up / {data.breadth.decliners} down)</span></div>
                    </div>
                    <p className="text-[11px] text-faint mt-auto">Real delayed data from FINOVA's market service. Visual height is scaled to today's largest move.</p>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Movers title="Top gainers" list={data.gainers} />
            <Movers title="Top losers" list={data.losers} />
            <Movers title="Most active (by value)" list={data.mostActive} metric={(q) => `Value ${crore((q.volume ?? 0) * (q.price ?? 0))}`} />
            <Movers title="Trending (biggest moves)" list={data.trending.slice(0, 6)} />
          </section>

          <section className="mt-8 glass rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold">All tracked stocks ({rows.length})</h2>
              <input className="field !w-56 !py-2 text-sm" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter stocks" />
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-xs text-muted border-b border-line">
                  <tr>{th("name", "Company", false)}{th("price", "Price")}{th("changePct", "Change")}{th("marketCap", "Market cap")}{th("pe", "P/E")}{th("volume", "Volume")}<th className="text-right">52W range</th></tr>
                </thead>
                <tbody>
                  {rows.map((q) => (
                    <tr key={q.symbol} className="border-b border-line/60 hover:bg-card cursor-pointer" onClick={() => nav(`/stocks/${encodeURIComponent(q.symbol)}`)}>
                      <td className="py-2.5"><div className="flex items-center gap-2.5"><Avatar name={q.name} size={28} /><div><div className="font-medium">{cleanSym(q.symbol)}</div><div className="text-xs text-muted truncate max-w-[14rem]">{q.name}</div></div></div></td>
                      <td className="text-right tabular-nums">{price(q.price)}</td>
                      <td className="text-right"><Change pct={q.changePct} /></td>
                      <td className="text-right tabular-nums">{crore(q.marketCap)}</td>
                      <td className="text-right tabular-nums">{q.pe ? q.pe.toFixed(1) : "—"}</td>
                      <td className="text-right tabular-nums">{q.volume?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className="text-right text-xs text-muted tabular-nums">{price(q.low52, 0)} – {price(q.high52, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <AdSlot index={2} className="mt-8" />
      <section className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="glass rounded-3xl p-5"><h2 className="font-semibold mb-3">Market news</h2><NewsList q="India stock market Sensex Nifty" count={8} /></div>
        <div className="glass rounded-3xl p-5">
          <h2 className="font-semibold mb-2">New to stocks?</h2>
          <p className="text-sm text-muted">Start with the Stock Market Academy: what shares are, how NSE and BSE work, and how to read P/E and market cap.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/learn/stocks" className="btn-primary !py-2 text-sm">Open academy</Link>
            <Link to="/learn/trading#simulator" className="btn-ghost !py-2 text-sm">Practise trading</Link>
          </div>
          <p className="text-xs text-faint mt-4 flex gap-2"><Icon name="shield" className="w-4 h-4 shrink-0" /> Prices are delayed and shown for education. FINOVA does not execute real trades.</p>
        </div>
      </section>

      <Drawer open={learn} onClose={() => setLearn(false)} title="Reading a market dashboard">
        <div className="space-y-4 text-[15px] leading-relaxed">
          <p><strong>Indices</strong> like NIFTY 50, SENSEX and NIFTY BANK summarise how a group of large companies moved. A 1% rise in NIFTY 50 means its 50 companies, weighted by size, gained about 1% together.</p>
          <p><strong>Gainers and losers</strong> show the biggest one-day moves. Big moves often follow news or results; they say nothing on their own about whether a company is a good investment.</p>
          <p><strong>Market breadth</strong> (advancers vs decliners) shows whether a move is broad or driven by a few heavyweights.</p>
          <p><strong>Delayed data:</strong> free market data is typically delayed. Traders use real-time feeds from their broker.</p>
          <VideoPanel lessonId="learn-dashboard" title="How to read the stock market" query="how to read stock market Nifty Sensex for beginners" compact />
        </div>
      </Drawer>
    </Page>
  );
}
