import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { applyTheme, levelFor, setState, useStore } from "../lib/store";
import { Icon } from "./ui";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/learn", label: "Learn" },
  { to: "/stocks", label: "Stocks" },
  { to: "/mutual-funds", label: "Mutual Funds" },
  { to: "/trading", label: "Trading" },
  { to: "/investments", label: "Investments" },
  { to: "/business", label: "Business Ideas" },
  { to: "/videos", label: "Video Library" },
  { to: "/ai", label: "FINOVA AI" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="FINOVA home">
      <img src="/favicon.svg" alt="" className="w-8 h-8" />
      <span className="font-display text-lg font-bold tracking-wide">FIN<span className="text-gradient">OVA</span></span>
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
    `px-2.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${isActive ? "text-text bg-card-strong" : "text-muted hover:text-text"}`;

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled || open ? "glass header-solid border-x-0 border-t-0" : "border-b border-transparent"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <Logo />
        <nav className="hidden xl:flex items-center gap-0.5 mx-auto" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkCls}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto xl:ml-0 flex items-center gap-1.5">
          <button onClick={onSearch} className="btn-ghost !px-3 !py-2 flex items-center gap-2 text-sm text-muted" aria-label="Search (Ctrl+K)">
            <Icon name="search" className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline text-[10px] border border-line rounded px-1">Ctrl K</kbd>
          </button>
          <Link to="/dashboard" className="hidden sm:inline-flex chip !text-cyan whitespace-nowrap" title="Your level">
            {level.name} · {xp} XP
          </Link>
          <button onClick={toggleTheme} className="btn-ghost !p-2" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            <Icon name={theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen((o) => !o)} className="xl:hidden btn-ghost !p-2" aria-label="Menu" aria-expanded={open}>
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
