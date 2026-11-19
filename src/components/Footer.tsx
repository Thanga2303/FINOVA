import { Link } from "react-router-dom";
import { trustedSources } from "../data";
import { Logo, NAV } from "./Nav";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-[1.2fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted max-w-sm">
            An interactive financial university: learn stocks, mutual funds, trading, investing and business, from first steps to confident investor.
          </p>
          <p className="mt-4 text-xs text-faint max-w-sm">
            Education only, not investment advice. FINOVA never executes real trades or handles real money. Calculator and simulator figures are hypothetical.
            Market investments are subject to risk; read all scheme-related documents carefully.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Explore</div>
          <ul className="grid grid-cols-2 gap-y-2 text-sm text-muted">
            {NAV.map((n) => (
              <li key={n.to}><Link className="hover:text-text" to={n.to}>{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Trusted learning sources</div>
          <ul className="space-y-2 text-sm">
            {trustedSources.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-muted hover:text-cyan">{s.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-faint pb-8">© {new Date().getFullYear()} FINOVA · Built by Thangathazhamuthu V</div>
    </footer>
  );
}
