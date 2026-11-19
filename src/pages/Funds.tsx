import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi, type FundRow, type FundSummary, type Meta } from "../lib/api";
import { useStore } from "../lib/store";
import { Page } from "../components/ui";
import { DataBadge, Drawer, ErrorNote, LearnButton, price, Skeleton } from "../components/market/bits";
import { CompareToggle, CompareTray, FundWatchButton, getCompare, Ret, shortCat } from "../components/market/fundBits";
import { LumpSumCalculator, SipCalculator } from "../components/Calculators";
import VideoPanel from "../components/VideoPanel";

const CATS = [
  { id: "", label: "All" }, { id: "equity", label: "Equity" }, { id: "debt", label: "Debt" }, { id: "hybrid", label: "Hybrid" },
  { id: "index", label: "Index" }, { id: "elss", label: "ELSS" }, { id: "liquid", label: "Liquid" },
  { id: "large-cap", label: "Large-cap" }, { id: "mid-cap", label: "Mid-cap" }, { id: "small-cap", label: "Small-cap" },
];

const CAT_INFO: Record<string, string> = {
  "": "Browse every open-ended Direct-Growth scheme published by AMFI.",
  equity: "Invest mainly in shares. Suited to goals 5+ years away; values can swing sharply.",
  debt: "Lend to governments and companies. Lower volatility, with interest-rate and credit risk.",
  hybrid: "Mix equity and debt (sometimes gold) to balance growth and stability.",
  index: "Copy an index like Nifty 50 at low cost; you get the market's return, not more.",
  elss: "Equity funds with a 3-year lock-in that qualify for Section 80C under the old tax regime.",
  liquid: "Very short-term debt. Often used to park emergency money or cash needed within months.",
  "large-cap": "At least 80% in India's top 100 companies by market cap.",
  "mid-cap": "At least 65% in companies ranked 101–250. More growth potential, more volatility.",
  "small-cap": "At least 65% in companies ranked 251+. The most volatile diversified equity category.",
};

export function useCompareList() {
  const [list, setList] = useState<number[]>(getCompare);
  useEffect(() => { const f = () => setList(getCompare()); window.addEventListener("finova-compare", f); return () => window.removeEventListener("finova-compare", f); }, []);
  return list;
}

function SummaryTable({ items, compare }: { items: FundSummary[]; compare: number[] }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="text-xs text-muted border-b border-line text-left">
          <tr><th className="py-2">Fund</th><th>Category</th><th className="text-right">NAV</th><th className="text-right">1Y</th><th className="text-right">3Y CAGR</th><th className="text-right">5Y CAGR</th><th /></tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.code} className="border-b border-line/60 hover:bg-card">
              <td className="py-2.5 pr-3"><Link to={`/funds/${f.code}`} className="font-medium hover:text-cyan">{f.name.replace(/ - Direct Plan - Growth| Direct Plan Growth/i, "")}</Link><div className="text-xs text-muted">{f.amc}</div></td>
              <td className="text-xs text-muted">{shortCat(f.category)}</td>
              <td className="text-right tabular-nums">{price(f.nav, 2)}</td>
              <td className="text-right"><Ret v={f.returns["1Y"]} /></td>
              <td className="text-right"><Ret v={f.returns["3Y"]} /></td>
              <td className="text-right"><Ret v={f.returns["5Y"]} /></td>
              <td className="text-right pl-2"><div className="flex justify-end gap-2"><CompareToggle code={f.code} list={compare} /><FundWatchButton code={f.code} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Funds() {
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [learn, setLearn] = useState(false);
  const compare = useCompareList();
  const watch = useStore((s) => s.fundWatch);
  useEffect(() => { const id = setTimeout(() => { setTerm(q); setPage(0); }, 300); return () => clearTimeout(id); }, [q]);
  useEffect(() => setPage(0), [cat]);
  const list = useApi<{ total: number; items: FundRow[]; meta: Meta }>(`/api/funds?cat=${cat}&q=${encodeURIComponent(term)}&limit=25&offset=${page * 25}`, { maxAge: 3600e3 });
  const popular = useApi<{ items: FundSummary[]; meta: Meta }>("/api/funds/popular", { maxAge: 3600e3 });
  const watched = useApi<{ items: FundSummary[]; meta: Meta }>(watch.length ? `/api/funds/summary?codes=${watch.join(",")}` : null, { maxAge: 3600e3 });
  const sorted = [...(popular.data?.items ?? [])].sort((a, b) => (b.returns["3Y"] ?? -99) - (a.returns["3Y"] ?? -99));

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald mb-2">Mutual Funds</div>
          <h1 className="font-display text-4xl font-semibold">Discover & compare funds</h1>
          <p className="text-muted mt-2 max-w-2xl">Real NAVs from AMFI. Returns are calculated from each scheme's published NAV history. Past performance does not indicate future returns.</p>
        </div>
        <LearnButton onClick={() => setLearn(true)} />
      </div>

      {watch.length > 0 && (
        <section className="mt-8 glass rounded-3xl p-5">
          <h2 className="font-semibold mb-3">Your fund watchlist</h2>
          {watched.loading && !watched.data ? <Skeleton className="h-24" /> : watched.data && <SummaryTable items={watched.data.items} compare={compare} />}
        </section>
      )}

      <section className="mt-8 glass rounded-3xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold">Popular funds</h2>
            <p className="text-xs text-muted">Widely held Direct-Growth schemes, sorted by 3-year CAGR. An editorial list, not a recommendation.</p>
          </div>
        </div>
        <ErrorNote error={popular.error} />
        {popular.loading && !popular.data ? <Skeleton className="h-64" /> : <SummaryTable items={sorted} compare={compare} />}
        {popular.data && <DataBadge meta={popular.data.meta} kind="End-of-day NAV" className="mt-3" />}
      </section>

      <section className="mt-8 glass rounded-3xl p-5">
        <h2 className="font-semibold">Explore all schemes</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          {CATS.map((c) => <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={`chip !text-sm !px-3.5 !py-1.5 ${cat === c.id ? "!text-text !border-emerald/60 !bg-card-strong" : ""}`}>{c.label}</button>)}
        </div>
        <p className="text-sm text-muted mt-3">{CAT_INFO[cat]}</p>
        <input className="field mt-3 max-w-md" placeholder="Search by fund or AMC name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search funds" />
        <ErrorNote error={list.error} />
        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-xs text-muted border-b border-line text-left"><tr><th className="py-2">Scheme</th><th>Category</th><th className="text-right">NAV</th><th className="text-right">NAV date</th><th className="text-right">Typical risk</th><th /></tr></thead>
            <tbody>
              {list.data?.items.map((f) => (
                <tr key={f.code} className="border-b border-line/60 hover:bg-card">
                  <td className="py-2.5 pr-3"><Link to={`/funds/${f.code}`} className="font-medium hover:text-cyan">{f.name}</Link><div className="text-xs text-muted">{f.amc}</div></td>
                  <td className="text-xs text-muted">{shortCat(f.category)}</td>
                  <td className="text-right tabular-nums">{price(f.nav, 4)}</td>
                  <td className="text-right text-xs text-muted">{f.date}</td>
                  <td className="text-right text-xs">{f.risk ?? "—"}</td>
                  <td className="text-right pl-2"><div className="flex justify-end gap-2"><CompareToggle code={f.code} list={compare} /><FundWatchButton code={f.code} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.loading && !list.data && <Skeleton className="h-48 mt-2" />}
        </div>
        {list.data && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
            <span className="text-muted">{list.data.total.toLocaleString("en-IN")} schemes · page {page + 1} of {Math.max(1, Math.ceil(list.data.total / 25))}</span>
            <div className="flex gap-2">
              <button className="btn-ghost !py-1.5 !px-4 disabled:opacity-40" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn-ghost !py-1.5 !px-4 disabled:opacity-40" disabled={(page + 1) * 25 >= list.data.total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
        {list.data && <DataBadge meta={list.data.meta} kind="End-of-day NAV" className="mt-2" />}
        <p className="text-xs text-faint mt-2">“Typical risk” is the usual riskometer level for the category, as a learning guide. Each scheme publishes its own riskometer monthly in its factsheet.</p>
      </section>

      <section id="calculators" className="mt-8 grid gap-6 scroll-mt-24"><SipCalculator /><LumpSumCalculator /></section>

      <CompareTray list={compare} />

      <Drawer open={learn} onClose={() => setLearn(false)} title="Learn: mutual funds">
        <div className="space-y-4 text-[15px] leading-relaxed text-muted">
          <p><strong className="text-text">NAV</strong> is the price of one unit. A low NAV doesn't make a fund cheap; compare returns, risk and cost instead.</p>
          <p><strong className="text-text">CAGR</strong> (compound annual growth rate) is the yearly rate that would turn the starting NAV into today's NAV. FINOVA shows 1-year as absolute return and 3-year+ as CAGR.</p>
          <p><strong className="text-text">Direct vs regular:</strong> FINOVA lists Direct-Growth plans, which have lower expense ratios because no distributor commission is paid.</p>
          <p><strong className="text-text">Category first:</strong> pick the category that fits your goal and time horizon, then compare funds within it.</p>
          <div className="flex flex-wrap gap-2">
            <Link className="chip" to="/learn/mutual-funds/what-is-mutual-fund">What is a mutual fund?</Link>
            <Link className="chip" to="/learn/mutual-funds/evaluate-mf">How to evaluate funds</Link>
            <Link className="chip" to="/learn/mutual-funds/expense-ratio">Expense ratio</Link>
          </div>
          <VideoPanel lessonId="learn-funds" title="Mutual funds for beginners" query="mutual funds explained for beginners India" compact />
        </div>
      </Drawer>
    </Page>
  );
}
