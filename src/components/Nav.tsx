import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { applyTheme, levelFor, setState, useStore } from "../lib/store";
import { Icon } from "./ui";
import { PlanBadge } from "./Membership";

export const NAV = [
  { to: "/", label: "Home", icon: "grid" },
  { to: "/stocks", label: "Stocks", icon: "chart" },
  { to: "/funds", label: "Mutual Funds", icon: "pie" },
  { to: "/investments", label: "Investments", icon: "growth" },
  { to: "/wallet", label: "Wallet", icon: "shield" },
  { to: "/learn", label: "Learn", icon: "bulb" },
  { to: "/business", label: "Business", icon: "trophy" },
  { to: "/ai", label: "FINOVA AI", icon: "spark" },
  { to: "/profile", label: "Profile", icon: "check" },
];

const BOTTOM = ["/", "/stocks", "/funds", "/wallet", "/ai"];

/** Mobile bottom navigation bar (hidden on wide screens). */
export function BottomNav() {
  const [more, setMore] = useState(false);
  const loc = useLocation();
  useEffect(() => setMore(false), [loc.pathname]);
  const items = NAV.filter((n) => BOTTOM.includes(n.to));
  const rest = [...NAV.filter((n) => !BOTTOM.includes(n.to)), { to: "/discover", label: "Discover", icon: "search" }, { to: "/learn/videos", label: "Video Library", icon: "play" }, { to: "/pricing", label: "Pricing", icon: "trophy" }, { to: "/account", label: "Account", icon: "shield" }];
  return (
    <>
      <AnimatePresence>
        {more && (
          <motion.div className="xl:hidden fixed inset-0 z-[55] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} className="absolute bottom-20 inset-x-3 rounded-3xl border border-line bg-bg2 p-3 grid grid-cols-3 gap-2" onClick={(e) => e.stopPropagation()}>
              {rest.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `rounded-2xl p-3 text-center text-xs font-medium border ${isActive ? "border-cyan/60 text-cyan" : "border-line text-muted"}`}>
                  <Icon name={n.icon} className="w-5 h-5 mx-auto mb-1" />{n.label}
                </NavLink>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-[56] glass header-solid border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
        <div className="grid grid-cols-6 h-16">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${isActive ? "text-cyan" : "text-muted"}`}>
              <Icon name={n.icon} className="w-5 h-5" />{n.label === "Mutual Funds" ? "Funds" : n.label === "FINOVA AI" ? "AI" : n.label}
            </NavLink>
          ))}
          <button onClick={() => setMore((m) => !m)} aria-expanded={more} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${more ? "text-cyan" : "text-muted"}`}>
            <Icon name="menu" className="w-5 h-5" />More
          </button>
        </div>
      </nav>
    </>
  );
}

export function Logo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="FINOVA home">
      <img src="/favicon.svg" alt="" className="w-8 h-8 transition-transform duration-500 group-hover:rotate-[-8deg]" />
      <span className="leading-none">
        <span className="font-display text-[17px] font-semibold tracking-[0.2em]">FIN<span className="text-gradient">OVA</span></span>
        {tagline && <span className="block mt-1 text-[10px] tracking-[0.18em] uppercase text-muted">Where Investors Are Made.</span>}
      </span>
    </Link>
  );
}

export default function Nav({ onSearch }: { onSearch: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = useStore((s) => s.theme);
  const xp = useStore((s) => s.xp);
  const { level } = levelFor(xp);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    applyTheme(t);
    setState(() => ({ theme: t }));
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative px-2.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${isActive ? "text-text" : "text-muted hover:text-text"}`;

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled || open ? "glass header-solid border-x-0 border-t-0" : "border-b border-transparent"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <Logo />
        <nav className="hidden xl:flex items-center gap-0.5 mx-auto" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkCls}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-card-strong border border-cyan/30 shadow-[0_0_18px_-6px_var(--cyan)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <span className="relative">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto xl:ml-0 flex items-center gap-1.5">
          <button onClick={onSearch} className="btn-ghost !px-3 !py-2 flex items-center gap-2 text-sm text-muted" aria-label="Search (Ctrl+K)">
            <Icon name="search" className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden 2xl:inline text-[10px] border border-line rounded px-1">Ctrl K</kbd>
          </button>
          <PlanBadge className="hidden md:inline-flex" />
          <Link to="/profile" className="hidden sm:inline-flex chip !text-cyan whitespace-nowrap" title="Your level">
            {level.name} · {xp} XP
          </Link>
          <button onClick={toggleTheme} className="btn-ghost !p-2" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            <Icon name={theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen((o) => !o)} className="hidden md:inline-flex xl:hidden btn-ghost !p-2" aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? "close" : "menu"} className="w-4 h-4" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="xl:hidden overflow-hidden border-t border-line"
            aria-label="Mobile"
          >
            <div className="px-4 py-4 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/"}
                  className={({ isActive }) => `rounded-xl px-3 py-3 text-sm font-medium border border-line ${isActive ? "bg-card-strong text-text" : "text-muted"}`}
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
