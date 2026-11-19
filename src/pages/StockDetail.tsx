import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cleanSym, fmtDate, useApi, type Meta, type Quote, type StockDetail as SD } from "../lib/api";
import { checkLimitOrders } from "../lib/paper";
import { useStore } from "../lib/store";
import { Page } from "../components/ui";
import { Avatar, Change, crore, DataBadge, Drawer, ErrorNote, LearnButton, price, Skeleton, WatchButton } from "../components/market/bits";
import PriceChart from "../components/market/PriceChart";
import OrderTicket from "../components/market/OrderTicket";
import NewsList from "../components/market/NewsList";
import VideoPanel from "../components/VideoPanel";

const pct = (v: unknown, d = 1) => (typeof v === "number" ? `${(v * 100).toFixed(d)}%` : "—");
const num = (v: unknown, d = 2) => (typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: d }) : "—");
const big = (v: number | null | undefined, cur: string) => (v == null ? "—" : cur === "INR" ? crore(v) : `${cur} ${(v / 1e9).toFixed(2)}B`);

function Stat({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3.5" title={hint}>
      <div className="text-xs text-muted">{k}</div>
      <div className="font-semibold mt-0.5 tabular-nums">{v}</div>
    </div>
  );
}

function RangeBar({ low, high, cur }: { low: number | null; high: number | null; cur: number | null }) {
  if (low == null || high == null || cur == null) return null;
  const p = Math.max(0, Math.min(1, (cur - low) / (high - low || 1)));
  return (
    <div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-rose/50 via-amber/50 to-emerald/50">
        <span className="absolute -top-1 w-4 h-4 rounded-full bg-text border-2 border-bg" style={{ left: `calc(${p * 100}% - 8px)` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-1.5"><span>52W low {price(low)}</span><span>52W high {price(high)}</span></div>
    </div>
  );
}

export default function StockDetail() {
  const { symbol: raw = "" } = useParams();
  const symbol = decodeURIComponent(raw);
  const isIndex = symbol.startsWith("^");
  const q = useApi<{ items: Quote[]; meta: Meta }>(`/api/market/quotes?symbols=${encodeURIComponent(symbol)}`, { poll: 60e3, maxAge: 55e3 });
  const d = useApi<SD>(isIndex ? null : `/api/market/stock/${encodeURIComponent(symbol)}`, { maxAge: 3600e3 });
  const quote = q.data?.items[0];
  const s = d.data;
  const [ticket, setTicket] = useState<null | "BUY" | "SELL">(null);
  const [learn, setLearn] = useState(false);
  const holding = useStore((st) => st.paper.holdings.find((h) => h.symbol === symbol && h.kind === "stock"));

  useEffect(() => { if (quote?.price) checkLimitOrders({ [symbol]: quote.price }); }, [quote?.price, symbol]);

  const name = s?.name ?? quote?.name ?? cleanSym(symbol);
  const cur = s?.financialCurrency ?? "INR";
  const fin = (s?.annual?.length ? s.annual.map((a) => ({ label: a.endDate?.slice(0, 4) ?? "", revenue: a.revenue, profit: a.netIncome })) : s?.yearly.map((y) => ({ label: String(y.year), revenue: y.revenue, profit: y.earnings }))) ?? [];
  const toCr = (v: number | null) => (v == null ? null : cur === "INR" ? v / 1e7 : v / 1e9);
  const finData = fin.map((f) => ({ ...f, revenue: toCr(f.revenue), profit: toCr(f.profit) }));
  const unit = cur === "INR" ? "₹ crore" : `${cur} billion`;

  return (
    <Page>
      <nav className="text-sm text-muted"><Link to="/stocks" className="hover:text-text">Stocks</Link> / <span className="text-text">{cleanSym(symbol)}</span></nav>
      <ErrorNote error={q.error} />

      <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={name} logo={s?.profile.logo} size={56} />
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">{name}</h1>
            <div className="text-sm text-muted">{cleanSym(symbol)} · {quote?.exchange ?? s?.exchange ?? (isIndex ? "Index" : "NSE")}{s?.profile.sector ? ` · ${s.profile.sector}` : ""}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LearnButton onClick={() => setLearn(true)} />
          <WatchButton symbol={symbol} />
          {!isIndex && <>
            <button className="rounded-full px-5 py-2 font-semibold bg-emerald text-[#04121c]" onClick={() => setTicket("BUY")}>Buy (paper)</button>
            <button className="rounded-full px-5 py-2 font-semibold bg-rose text-white disabled:opacity-40" disabled={!holding} onClick={() => setTicket("SELL")}>Sell</button>
          </>}
        </div>
      </header>

      <section className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="glass rounded-3xl p-5 min-w-0">
          {quote ? (
            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <span className="font-display text-4xl font-semibold tabular-nums">{isIndex ? num(quote.price) : price(quote.price)}</span>
              <Change pct={quote.changePct} abs={quote.change} className="text-lg" />
              <span className="text-sm text-muted">today</span>
            </div>
          ) : <Skeleton className="h-12 w-64 mb-4" />}
          <PriceChart symbol={symbol} initial="1m" />
        </div>
        <aside className="space-y-4">
          <div className="glass rounded-3xl p-5 space-y-4">
            <RangeBar low={quote?.low52 ?? null} high={quote?.high52 ?? null} cur={quote?.price ?? null} />
            <div className="grid grid-cols-2 gap-2">
              <Stat k="Open" v={price(quote?.open)} /><Stat k="Prev. close" v={price(quote?.prevClose)} />
              <Stat k="Day high" v={price(quote?.dayHigh)} /><Stat k="Day low" v={price(quote?.dayLow)} />
              {!isIndex && <><Stat k="Volume" v={quote?.volume?.toLocaleString("en-IN") ?? "—"} /><Stat k="Avg volume (3M)" v={quote?.avgVolume?.toLocaleString("en-IN") ?? "—"} /></>}
            </div>
            {q.data && <DataBadge meta={q.data.meta} kind="Delayed quote" />}
          </div>
          {holding && (
            <div className="glass rounded-3xl p-5 text-sm">
              <div className="font-semibold mb-2">Your paper position</div>
              <div className="flex justify-between"><span className="text-muted">Shares</span><span>{holding.qty}</span></div>
              <div className="flex justify-between"><span className="text-muted">Avg cost</span><span>{price(holding.avg)}</span></div>
              {quote?.price && <div className="flex justify-between"><span className="text-muted">P&L</span><Change pct={((quote.price - holding.avg) / holding.avg) * 100} abs={(quote.price - holding.avg) * holding.qty} /></div>}
            </div>
          )}
        </aside>
      </section>

      {!isIndex && (
        <>
          <ErrorNote error={d.error} />
          {d.loading && !s && <Skeleton className="h-48 mt-6" />}
          {s && (
            <>
              <section className="mt-6">
                <h2 className="font-display text-2xl font-semibold mb-3">Key fundamentals</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Stat k="Market cap" v={crore(s.stats.marketCap as number)} hint="Share price × total shares" />
                  <Stat k="P/E (TTM)" v={num(s.stats.pe, 1)} hint="Price ÷ earnings per share" />
                  <Stat k="EPS (TTM)" v={s.stats.eps != null ? price(s.stats.eps as number) : "—"} />
                  <Stat k="P/B" v={num(s.stats.pb, 2)} />
                  <Stat k="ROE" v={pct(s.stats.roe)} />
                  <Stat k="Profit margin" v={pct(s.stats.profitMargin)} />
                  <Stat k="Debt / equity" v={num(s.stats.debtToEquity, 1)} />
                  <Stat k="Book value / share" v={s.stats.bookValue != null ? price(s.stats.bookValue as number) : "—"} />
                  <Stat k="Dividend yield" v={pct(s.stats.dividendYield, 2)} />
                  <Stat k="Beta" v={num(s.stats.beta, 2)} />
                  <Stat k="52W high" v={price(s.stats.high52 as number)} />
                  <Stat k="52W low" v={price(s.stats.low52 as number)} />
                </div>
                <div className="mt-2"><DataBadge meta={s.meta} /></div>
              </section>

              <section className="mt-8 grid lg:grid-cols-2 gap-6 items-start">
                <div className="glass rounded-3xl p-5">
                  <h2 className="font-semibold mb-2">Company overview</h2>
                  <p className="text-sm text-muted leading-relaxed line-clamp-[10]">{s.profile.summary ?? "No company description available from the data source."}</p>
                  <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div><dt className="text-xs text-muted">Industry</dt><dd>{s.profile.industry ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted">Employees</dt><dd>{s.profile.employees?.toLocaleString("en-IN") ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted">Headquarters</dt><dd>{s.profile.city ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted">Website</dt><dd>{s.profile.website ? <a className="text-cyan hover:underline" href={s.profile.website} target="_blank" rel="noreferrer">{s.profile.website.replace(/^https?:\/\/(www\.)?/, "")}</a> : "—"}</dd></div>
                  </dl>
                  {s.profile.officers.length > 0 && <div className="mt-3 text-xs text-muted">Leadership: {s.profile.officers.map((o) => `${o.name} (${o.title})`).join(" · ")}</div>}
                </div>
                <div className="glass rounded-3xl p-5">
                  <h2 className="font-semibold">Financial statements (annual)</h2>
                  <p className="text-xs text-muted mb-3">Revenue and net profit in {unit}, as reported.</p>
                  {finData.length ? (
                    <div className="h-60">
                      <ResponsiveContainer>
                        <BarChart data={finData}>
                          <CartesianGrid stroke="var(--line)" vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })} />
                          <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v, n) => [`${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })} ${unit}`, n === "revenue" ? "Revenue" : "Net profit"]} />
                          <Legend formatter={(v) => (v === "revenue" ? "Revenue" : "Net profit")} wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="revenue" fill="var(--cyan)" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="profit" fill="var(--emerald)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-sm text-muted">Not reported by the data source.</p>}
                </div>
              </section>

              <section className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
                <div className="glass rounded-3xl p-5">
                  <h2 className="font-semibold mb-3">Quarterly results</h2>
                  {s.quarterly.length ? (
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted text-left"><tr><th className="py-1.5">Quarter ended</th><th className="text-right">Revenue</th><th className="text-right">Net profit</th><th className="text-right">Margin</th></tr></thead>
                      <tbody>{s.quarterly.map((r) => (
                        <tr key={r.endDate} className="border-t border-line"><td className="py-2">{r.endDate}</td><td className="text-right">{big(r.revenue, cur)}</td><td className="text-right">{big(r.netIncome, cur)}</td><td className="text-right">{r.revenue && r.netIncome ? `${((r.netIncome / r.revenue) * 100).toFixed(1)}%` : "—"}</td></tr>
                      ))}</tbody>
                    </table>
                  ) : <p className="text-sm text-muted">Not reported by the data source.</p>}
                  {s.quarterlyEps.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-muted mb-1">EPS: actual vs analyst estimate</div>
                      <div className="flex flex-wrap gap-2">{s.quarterlyEps.map((e) => (
                        <span key={e.quarter} className={`chip ${e.actual != null && e.estimate != null && e.actual >= e.estimate ? "!text-emerald" : "!text-rose"}`}>{e.quarter}: ₹{e.actual ?? "—"} vs ₹{e.estimate?.toFixed(2) ?? "—"}</span>
                      ))}</div>
                    </div>
                  )}
                  {s.nextEarnings && <p className="text-xs text-muted mt-3">Next results expected around {s.nextEarnings} (per data source).</p>}
                </div>
                <div className="glass rounded-3xl p-5">
                  <h2 className="font-semibold mb-3">Dividends</h2>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Stat k="Annual dividend" v={s.stats.dividendRate != null ? price(s.stats.dividendRate as number) : "—"} />
                    <Stat k="Yield" v={pct(s.stats.dividendYield, 2)} />
                    <Stat k="Last ex-date" v={(s.stats.exDividendDate as string) ?? "—"} />
                  </div>
                  {s.dividends.length ? (
                    <ul className="text-sm divide-y divide-line max-h-48 overflow-y-auto scroll-thin">
                      {s.dividends.map((dv) => <li key={dv.date} className="flex justify-between py-1.5"><span className="text-muted">{fmtDate(dv.date)}</span><span>{price(dv.amount)} per share</span></li>)}
                    </ul>
                  ) : <p className="text-sm text-muted">No dividends in the last 5 years per the data source.</p>}
                </div>
              </section>
            </>
          )}
        </>
      )}

      <section className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
        <div className="glass rounded-3xl p-5"><h2 className="font-semibold mb-2">News</h2><NewsList q={name.replace(/ Limited| Ltd\.?/i, "")} count={6} /></div>
        <VideoPanel lessonId={`stock-${symbol}`} title={`Understanding ${name}`} query={`${name.replace(/ Limited| Ltd\.?/i, "")} business model explained`} compact />
      </section>

      <Drawer open={learn} onClose={() => setLearn(false)} title={`Learn: ${cleanSym(symbol)}`}>
        <div className="space-y-5 text-[15px] leading-relaxed">
          <section>
            <h3 className="font-semibold text-cyan">What does {name} do?</h3>
            <p className="text-muted mt-1 line-clamp-6">{s?.profile.summary ?? (isIndex ? `${name} is a stock market index: it tracks a basket of companies so you can see how that part of the market is doing.` : "Company description not available.")}</p>
          </section>
          {!isIndex && s && (
            <>
              <section>
                <h3 className="font-semibold text-cyan">Market capitalisation: {crore(s.stats.marketCap as number)}</h3>
                <p className="text-muted mt-1">Market cap = share price × total shares. It shows what the market currently values the whole company at. Under SEBI's classification, the top 100 listed companies are large-caps, which tend to be more stable than mid- and small-caps.</p>
              </section>
              <section>
                <h3 className="font-semibold text-cyan">P/E ratio: {num(s.stats.pe, 1)}</h3>
                <p className="text-muted mt-1">Investors are paying about ₹{num(s.stats.pe, 0)} for every ₹1 of {name.split(" ")[0]}'s annual profit. Compare P/E with companies in the same industry ({s.profile.industry ?? "its sector"}) and with its own history. A high P/E usually reflects expected growth; it doesn't by itself mean expensive or cheap.</p>
              </section>
              <section>
                <h3 className="font-semibold text-cyan">Fundamentals at a glance</h3>
                <ul className="text-muted mt-1 list-disc pl-5 space-y-1">
                  <li>ROE {pct(s.stats.roe)}: profit generated on shareholders' money. Higher is generally better.</li>
                  <li>Profit margin {pct(s.stats.profitMargin)}: how much of each ₹100 of revenue becomes profit.</li>
                  <li>Debt/equity {num(s.stats.debtToEquity, 1)}: how much the company relies on borrowing (high values add risk).</li>
                  <li>Dividend yield {pct(s.stats.dividendYield, 2)}: annual dividend as a % of the share price.</li>
                </ul>
              </section>
            </>
          )}
          <section className="rounded-2xl border border-amber/30 bg-amber/5 p-3 text-sm text-muted">This is education, not a recommendation. One company's numbers don't tell you whether to buy or sell; risk, valuation and your own goals matter.</section>
          <div className="flex flex-wrap gap-2">
            <Link className="chip" to="/learn/stocks/market-cap">Lesson: Market cap</Link>
            <Link className="chip" to="/learn/stocks/pe-ratio">Lesson: P/E ratio</Link>
            <Link className="chip" to="/learn/stocks/fundamental-analysis">Lesson: Fundamentals</Link>
            <Link className="chip" to="/learn/trading/candlesticks-trading">Lesson: Reading candles</Link>
          </div>
          <VideoPanel lessonId={`learn-${symbol}`} title={`${name} fundamentals`} query={`how to analyse ${name.replace(/ Limited| Ltd\.?/i, "")} fundamentals`} compact />
        </div>
      </Drawer>

      {!isIndex && ticket && (
        <OrderTicket key={ticket} open={Boolean(ticket)} onClose={() => setTicket(null)} kind="stock" symbol={symbol} name={name} ltp={quote?.price ?? null} category={s?.profile.sector ?? undefined} initialSide={ticket} />
      )}
    </Page>
  );
}
