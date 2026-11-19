import { Link } from "react-router-dom";
import { cleanSym, useApi, type FundSummary, type Meta, type Overview } from "../lib/api";
import { academies, lessonPath } from "../data";
import { businessIdeas } from "../data/business";
import { Page, Reveal } from "../components/ui";
import { Avatar, Change, DataBadge, ErrorNote, price, Skeleton } from "../components/market/bits";
import { Ret, shortCat } from "../components/market/fundBits";
import NewsList from "../components/market/NewsList";

function StockStrip({ title, list }: { title: string; list: Overview["gainers"] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="flex gap-3 overflow-x-auto scroll-thin pb-2">
        {list.map((q) => (
          <Link key={q.symbol} to={`/stocks/${encodeURIComponent(q.symbol)}`} className="shrink-0 w-44 glass rounded-2xl p-4 hover:border-cyan/50">
            <Avatar name={q.name} size={34} />
            <div className="font-semibold mt-2 truncate">{cleanSym(q.symbol)}</div>
            <div className="text-xs text-muted truncate">{q.name}</div>
            <div className="mt-2 text-sm tabular-nums">{price(q.price)}</div>
            <Change pct={q.changePct} className="text-xs" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function FundCards({ items }: { items: FundSummary[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((f) => (
        <Link key={f.code} to={`/funds/${f.code}`} className="glass rounded-2xl p-4 hover:border-emerald/50">
          <div className="text-xs text-emerald">{shortCat(f.category)}</div>
          <div className="font-semibold mt-1 leading-snug line-clamp-2">{f.name.replace(/ - Direct Plan - Growth| Direct Plan Growth/i, "")}</div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div><div className="text-muted">3Y CAGR</div><Ret v={f.returns["3Y"]} className="font-semibold" /></div>
            <div><div className="text-muted">5Y CAGR</div><Ret v={f.returns["5Y"]} className="font-semibold" /></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Discover() {
  const ov = useApi<Overview>("/api/market/overview", { poll: 60e3, maxAge: 55e3 });
  const pop = useApi<{ items: FundSummary[]; meta: Meta }>("/api/funds/popular", { maxAge: 3600e3 });
  const idx = useApi<{ items: FundSummary[]; meta: Meta }>("/api/funds/index", { maxAge: 3600e3 });
  const top = [...(pop.data?.items ?? [])].filter((f) => !/Liquid|Overnight|Money/i.test(f.category)).sort((a, b) => (b.returns["3Y"] ?? -99) - (a.returns["3Y"] ?? -99)).slice(0, 8);

  return (
    <Page>
      <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Discover</div>
      <h1 className="font-display text-4xl font-semibold">Explore the markets</h1>
      <p className="text-muted mt-2 max-w-2xl">Popular stocks, funds, news and ideas, each with its data source and timestamp. Lists are for discovery and learning, not recommendations.</p>

      <section className="mt-8 space-y-6">
        <ErrorNote error={ov.error} />
        {ov.loading && !ov.data ? <Skeleton className="h-40" /> : ov.data && (
          <>
            <StockStrip title="Popular stocks (most traded by value today)" list={ov.data.mostActive} />
            <StockStrip title="Trending stocks (biggest moves today)" list={ov.data.trending} />
            <DataBadge meta={ov.data.meta} kind="Delayed quotes" />
          </>
        )}
      </section>

      <Reveal>
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div><h2 className="font-display text-2xl font-semibold">Top mutual funds by 3-year CAGR</h2><p className="text-xs text-muted">Within FINOVA's list of widely held Direct-Growth funds (liquid funds excluded). Past returns don't guarantee future returns.</p></div>
            <Link to="/funds" className="btn-ghost !py-2 text-sm">All funds</Link>
          </div>
          {pop.loading && !pop.data ? <Skeleton className="h-40" /> : <FundCards items={top} />}
          {pop.data && <DataBadge meta={pop.data.meta} kind="End-of-day NAV" className="mt-2" />}
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-3">Popular index funds</h2>
          {idx.loading && !idx.data ? <Skeleton className="h-32" /> : idx.data && <FundCards items={idx.data.items} />}
        </section>
      </Reveal>

      <section className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="glass rounded-3xl p-5"><h2 className="font-semibold mb-2">Market news</h2><NewsList q="Sensex Nifty India markets" count={8} /></div>
        <div className="space-y-6">
          <div className="glass rounded-3xl p-5">
            <h2 className="font-semibold">Newly listed & upcoming IPOs</h2>
            <p className="text-sm text-muted mt-2">FINOVA doesn't have a licensed IPO data feed yet, so we don't show IPO lists rather than risk inaccurate details. See the official exchange pages:</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a className="btn-ghost !py-2 text-sm" href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">NSE IPO calendar</a>
              <a className="btn-ghost !py-2 text-sm" href="https://www.bseindia.com/markets/PublicIssues/IPOIssues_new.aspx" target="_blank" rel="noreferrer">BSE public issues</a>
            </div>
            <Link to="/learn/stocks/what-is-ipo" className="text-sm text-cyan underline mt-3 inline-block">Learn how IPOs work</Link>
          </div>
          <div className="glass rounded-3xl p-5">
            <h2 className="font-semibold mb-2">Business trends</h2>
            <NewsList q="India startups business funding" count={4} />
            <Link to="/business" className="text-sm text-cyan underline mt-2 inline-block">Explore {businessIdeas.length} business playbooks</Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold mb-3">Investment education</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {academies.map((a) => (
            <Link key={a.id} to={`/learn/${a.id}`} className="glass rounded-2xl p-4 hover:border-cyan/50">
              <div className="font-semibold" style={{ color: a.accent }}>{a.name}</div>
              <div className="text-xs text-muted mt-1">{a.lessons.length} lessons</div>
              <div className="text-sm mt-2">Start: <span className="text-muted">{a.lessons[0].title}</span></div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {["sip", "index-funds", "pe-ratio", "risk-reward"].map((id) => {
            const l = academies.flatMap((a) => a.lessons).find((x) => x.id === id)!;
            return <Link key={id} to={lessonPath(l)} className="chip !text-sm !py-1.5 !px-3">{l.title}</Link>;
          })}
        </div>
      </section>
    </Page>
  );
}
