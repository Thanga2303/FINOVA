import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate, useApi, type FundDetail as FD } from "../lib/api";
import { useStore } from "../lib/store";
import { Page } from "../components/ui";
import { Avatar, DataBadge, Drawer, ErrorNote, LearnButton, price, Skeleton } from "../components/market/bits";
import { CompareToggle, CompareTray, FundWatchButton, Ret, Riskometer, shortCat } from "../components/market/fundBits";
import OrderTicket from "../components/market/OrderTicket";
import VideoPanel from "../components/VideoPanel";
import { useCompareList } from "./Funds";

const RANGES = [{ id: "1y", label: "1Y", yrs: 1 }, { id: "3y", label: "3Y", yrs: 3 }, { id: "5y", label: "5Y", yrs: 5 }, { id: "max", label: "Max", yrs: 100 }];
const NA = <span className="text-muted">Not reported by data source</span>;

function categoryExplainer(cat: string) {
  if (/Liquid|Overnight|Money Market/i.test(cat)) return "invests in very short-term debt such as treasury bills and commercial paper. It aims for stability and easy access, not high growth.";
  if (/Index/i.test(cat)) return "copies an index instead of picking stocks, so costs are low and returns track the market (minus a small tracking difference).";
  if (/ELSS/i.test(cat)) return "is an equity fund with a 3-year lock-in. Under the old tax regime, investments qualify for Section 80C deduction up to ₹1.5 lakh.";
  if (/Small Cap/i.test(cat)) return "invests mainly in small companies (rank 251+ by market cap). They can grow fast but can also fall 30–50% in bad years.";
  if (/Mid Cap/i.test(cat)) return "invests mainly in mid-sized companies (rank 101–250). More growth potential than large caps, with more ups and downs.";
  if (/Large Cap/i.test(cat)) return "keeps at least 80% in India's 100 largest companies, which are usually more stable than smaller ones.";
  if (/Flexi|Multi|Focused|Value|Contra|Equity/i.test(cat)) return "invests mainly in shares. It suits goals 5+ years away and can swing sharply in the short term.";
  if (/Hybrid|Balanced|Asset Allocation|Equity Savings|Arbitrage/i.test(cat)) return "mixes asset classes (equity, debt, sometimes gold) to balance growth and stability.";
  if (/Debt|Bond|Gilt|Duration|Credit|Income/i.test(cat)) return "lends money to governments and companies. Prices move with interest rates; credit quality matters.";
  return "is a mutual fund scheme; read its Scheme Information Document for its exact strategy.";
}

export default function FundDetail() {
  const { code = "" } = useParams();
  const { data: f, error, loading } = useApi<FD>(`/api/funds/${code}`, { maxAge: 3600e3 });
  const [range, setRange] = useState("3y");
  const [ticket, setTicket] = useState<null | "BUY" | "SELL">(null);
  const [learn, setLearn] = useState(false);
  const compare = useCompareList();
  const holding = useStore((s) => s.paper.holdings.find((h) => h.kind === "fund" && h.symbol === code));

  const series = useMemo(() => {
    if (!f) return [];
    const yrs = RANGES.find((r) => r.id === range)!.yrs;
    const cut = (f.navDate ?? Date.now()) - yrs * 365.25 * 864e5;
    return f.history.filter((p) => p.t >= cut);
  }, [f, range]);
  const chg = series.length > 1 ? (series.at(-1)!.nav / series[0].nav - 1) * 100 : null;

  if (loading && !f) return <Page><Skeleton className="h-40" /><Skeleton className="h-80 mt-6" /></Page>;
  if (!f) return <Page><ErrorNote error={error ?? "Fund not found."} /><Link to="/funds" className="btn-ghost mt-4 inline-block">Back to funds</Link></Page>;
  const x = f.extra;

  return (
    <Page>
      <nav className="text-sm text-muted"><Link to="/funds" className="hover:text-text">Mutual Funds</Link> / <span className="text-text">{f.amc}</span></nav>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={f.amc} size={56} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">{f.name}</h1>
            <div className="text-sm text-muted mt-1">{f.amc} · {shortCat(f.category)} · Scheme code {f.code}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <LearnButton onClick={() => setLearn(true)} />
          <CompareToggle code={f.code} list={compare} />
          <FundWatchButton code={f.code} />
          <button className="rounded-full px-5 py-2 font-semibold bg-emerald text-[#04121c]" onClick={() => setTicket("BUY")}>Invest (paper)</button>
          {holding && <button className="rounded-full px-5 py-2 font-semibold bg-rose text-white" onClick={() => setTicket("SELL")}>Redeem</button>}
        </div>
      </header>

      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="glass rounded-3xl p-5 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-semibold tabular-nums">{price(f.nav, 4)}</span>
            <span className="text-sm text-muted">NAV as of {fmtDate(f.navDate)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-2">
            <div className="flex gap-1 rounded-full border border-line p-1">
              {RANGES.map((r) => <button key={r.id} onClick={() => setRange(r.id)} aria-pressed={range === r.id} className={`px-3 py-1 rounded-full text-xs font-semibold ${range === r.id ? "bg-emerald text-[#04121c]" : "text-muted"}`}>{r.label}</button>)}
            </div>
            {chg != null && <span className="text-sm">NAV change <Ret v={chg} className="font-semibold" /></span>}
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis domain={["auto", "auto"]} orientation="right" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} labelFormatter={(t) => fmtDate(Number(t))} formatter={(v) => [price(Number(v), 4), "NAV"]} />
                <Area dataKey="nav" stroke="var(--emerald)" strokeWidth={2} fill="url(#fg)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <DataBadge meta={{ ...f.meta, asOf: f.navDate }} kind="Historical (end-of-day NAV)" className="mt-2" />
        </div>
        <aside className="glass rounded-3xl p-5 space-y-4">
          <Riskometer level={f.risk} />
          <p className="text-xs text-muted text-center">Typical riskometer level for this category. Check the scheme's latest factsheet for its official riskometer.</p>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-3"><dt className="text-muted">Expense ratio</dt><dd>{x?.expenseRatio != null ? `${x.expenseRatio.toFixed(2)}%` : NA}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">AUM</dt><dd>{x?.aum ? `₹${(x.aum / 1e7).toFixed(0)} Cr` : NA}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Fund manager</dt><dd className="text-right">{x?.manager || NA}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Minimum investment</dt><dd>{x?.minInvestment ? price(x.minInvestment, 0) : NA}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">SIP</dt><dd className="text-right">{/open/i.test(f.schemeType) ? "Open-ended; SIPs are typically offered, confirm with AMC" : "Check with AMC"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">ISIN</dt><dd className="text-xs">{f.isin ?? "—"}</dd></div>
          </dl>
          {x && <p className="text-[11px] text-faint">Profile data: {x.source}.</p>}
        </aside>
      </section>

      <section className="mt-6 glass rounded-3xl p-5">
        <h2 className="font-semibold mb-3">Historical returns</h2>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {(["1M", "6M", "1Y", "3Y", "5Y", "10Y", "sinceLaunch"] as const).map((k) => (
            <div key={k} className="rounded-2xl border border-line bg-card p-3 text-center">
              <div className="text-xs text-muted">{k === "sinceLaunch" ? "Since data start" : k}</div>
              <div className="font-semibold mt-1"><Ret v={f.returns[k]} /></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">Computed by FINOVA from AMFI NAV history{f.launchNav ? ` (data from ${fmtDate(f.launchNav.t)})` : ""}. Up to 6 months: absolute return; 1 year and above: annualised (CAGR). Past performance does not guarantee future returns.</p>
      </section>

      <section className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
        <div className="glass rounded-3xl p-5">
          <h2 className="font-semibold mb-3">Portfolio holdings</h2>
          {x?.holdings?.length ? (
            <ul className="space-y-2">
              {x.holdings.map((h) => (
                <li key={h.name} className="text-sm">
                  <div className="flex justify-between gap-3"><span>{h.symbol?.endsWith(".NS") ? <Link className="hover:text-cyan" to={`/stocks/${encodeURIComponent(h.symbol)}`}>{h.name}</Link> : h.name}</span><span className="tabular-nums">{h.weight.toFixed(2)}%</span></div>
                  <div className="h-1.5 rounded-full bg-line mt-1 overflow-hidden"><div className="h-full bg-cyan" style={{ width: `${Math.min(100, h.weight * 8)}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Top holdings are not reported by our data source for this scheme. See the AMC's monthly portfolio disclosure.</p>}
          {x?.assetMix && <p className="text-xs text-muted mt-3">Asset mix: stocks {x.assetMix.stocks.toFixed(1)}% · bonds {x.assetMix.bonds.toFixed(1)}% · cash {x.assetMix.cash.toFixed(1)}%</p>}
        </div>
        <div className="glass rounded-3xl p-5">
          <h2 className="font-semibold mb-3">Sector allocation</h2>
          {x?.sectors?.length ? (
            <ul className="space-y-2">{x.sectors.slice(0, 8).map((s) => (
              <li key={s.sector} className="text-sm"><div className="flex justify-between capitalize"><span>{s.sector}</span><span>{s.weight.toFixed(1)}%</span></div><div className="h-1.5 rounded-full bg-line mt-1 overflow-hidden"><div className="h-full bg-violet" style={{ width: `${s.weight}%` }} /></div></li>
            ))}</ul>
          ) : <p className="text-sm text-muted">Sector split not reported by our data source.</p>}
        </div>
      </section>

      {holding && (
        <section className="mt-6 glass rounded-3xl p-5 text-sm">
          <h2 className="font-semibold mb-2">Your paper investment</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><div className="text-xs text-muted">Units</div>{holding.qty.toFixed(3)}</div>
            <div><div className="text-xs text-muted">Invested</div>{price(holding.qty * holding.avg)}</div>
            <div><div className="text-xs text-muted">Current value</div>{price(holding.qty * (f.nav ?? 0))}</div>
            <div><div className="text-xs text-muted">Return</div><Ret v={f.nav ? (f.nav / holding.avg - 1) * 100 : null} /></div>
          </div>
        </section>
      )}

      <CompareTray list={compare} />

      <Drawer open={learn} onClose={() => setLearn(false)} title="Learn about this fund">
        <div className="space-y-4 text-[15px] leading-relaxed text-muted">
          <section><h3 className="font-semibold text-cyan">Category: {shortCat(f.category)}</h3><p className="mt-1">This fund {categoryExplainer(f.category)}</p></section>
          <section><h3 className="font-semibold text-cyan">Risk level: {f.risk ?? "—"}</h3><p className="mt-1">SEBI's riskometer has six levels from Low to Very High. Higher levels mean bigger possible swings in value, not certain losses. Match it to your time horizon and how much fall you can handle.</p></section>
          <section><h3 className="font-semibold text-cyan">NAV: {price(f.nav, 4)}</h3><p className="mt-1">NAV is the value of one unit, calculated each business day as (assets − liabilities) ÷ units. A ₹10 NAV isn't “cheaper” than ₹100; only the percentage change matters.</p></section>
          <section><h3 className="font-semibold text-cyan">Expense ratio: {x?.expenseRatio != null ? `${x.expenseRatio.toFixed(2)}%` : "not reported"}</h3><p className="mt-1">The yearly fee, deducted inside the NAV. Over 20 years a 1% difference can cost a large share of your final value, so compare it between similar funds.</p></section>
          <div className="flex flex-wrap gap-2">
            <Link className="chip" to="/learn/mutual-funds/nav">Lesson: NAV</Link>
            <Link className="chip" to="/learn/mutual-funds/risk-levels">Lesson: Riskometer</Link>
            <Link className="chip" to="/learn/mutual-funds/expense-ratio">Lesson: Expense ratio</Link>
            <Link className="chip" to="/learn/mutual-funds/sip">Lesson: SIP</Link>
          </div>
          <VideoPanel lessonId={`fund-${f.code}`} title={shortCat(f.category)} query={`${shortCat(f.category)} mutual fund explained`} compact />
        </div>
      </Drawer>

      {ticket && <OrderTicket key={ticket} open onClose={() => setTicket(null)} kind="fund" symbol={String(f.code)} name={f.name} ltp={f.nav} category={f.category} initialSide={ticket} />}
    </Page>
  );
}
