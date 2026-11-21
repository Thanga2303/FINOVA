import { Link } from "react-router-dom";
import { trustedSources } from "../data";
import { Logo } from "./Nav";
import { Icon } from "./ui";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Invest", links: [["Stocks", "/stocks"], ["Mutual Funds", "/funds"], ["Compare funds", "/funds/compare"], ["Discover", "/discover"], ["Portfolio", "/investments"], ["Watchlists", "/investments?tab=watchlists"]] },
  { title: "Learn", links: [["Academies", "/learn"], ["Video library", "/learn/videos"], ["Business ideas", "/business"], ["FINOVA AI", "/ai"]] },
  { title: "Money", links: [["Smart Wallet", "/wallet"], ["Goals", "/wallet?tab=goals"], ["Health score", "/wallet?tab=health"], ["Profile & data", "/profile?tab=privacy"], ["Pricing", "/pricing"], ["Billing", "/account"]] },
];

export default function Footer() {
  return (
    <footer className="relative mt-4 border-t border-line overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[48rem] max-w-[120vw] h-80 rounded-full bg-cyan/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-line">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Every investor starts somewhere.</h2>
            <p className="text-muted mt-2">Start with one lesson today. No account, no money, no risk.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/learn" className="btn-primary inline-flex items-center gap-2">Start learning <Icon name="arrow" className="w-4 h-4" /></Link>
            <Link to="/stocks" className="btn-ghost">Explore markets</Link>
          </div>
        </div>

        <div className="py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo tagline />
            <p className="mt-5 font-display text-sm tracking-wide text-text">Learn. Practice. Analyse. Master the Market.</p>
            <p className="mt-3 text-sm text-muted max-w-xs">A financial learning platform with real Indian market data, paper trading, an AI tutor and a personal finance wallet.</p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-faint mb-4">{c.title}</div>
              <ul className="space-y-2.5 text-sm">
                {c.links.map(([label, to]) => <li key={to}><Link className="text-muted hover:text-text transition-colors" to={to}>{label}</Link></li>)}
              </ul>
            </nav>
          ))}
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-faint mb-4">Learn from the source</div>
            <ul className="space-y-2.5 text-sm">
              {trustedSources.map((s) => <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer" className="text-muted hover:text-cyan transition-colors">{s.name}</a></li>)}
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-line grid gap-4 lg:grid-cols-[1fr_auto] items-start text-xs text-faint">
          <p className="max-w-3xl leading-relaxed">
            FINOVA is an educational platform, not a SEBI-registered investment adviser, broker or distributor. Nothing here is investment advice. Orders are paper trades; no real money is moved.
            Market data is delayed and sourced from Yahoo Finance and AMFI; calculator and projection figures are hypothetical. Investments in securities are subject to market risks; read all related documents carefully.
          </p>
          <p className="lg:text-right whitespace-nowrap">© {new Date().getFullYear()} FINOVA · Made in India · Built by Thangathazhamuthu V</p>
        </div>
      </div>
    </footer>
  );
}
