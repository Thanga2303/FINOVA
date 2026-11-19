import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cleanSym, fmtTime, type Meta } from "../../lib/api";
import { setState, uid, useStore } from "../../lib/store";
import { Icon } from "../ui";

export function Change({ pct, abs, className = "" }: { pct: number | null | undefined; abs?: number | null; className?: string }) {
  if (pct == null || !Number.isFinite(pct)) return <span className={`text-muted ${className}`}>—</span>;
  const up = pct >= 0;
  return (
    <span className={`${up ? "text-emerald" : "text-rose"} tabular-nums ${className}`}>
      {up ? "▲" : "▼"} {abs != null ? `${Math.abs(abs).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ` : ""}({Math.abs(pct).toFixed(2)}%)
    </span>
  );
}

export const price = (n: number | null | undefined, d = 2) => (n == null ? "—" : "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }));
export const level = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export const crore = (n: number | null | undefined) => {
  if (n == null) return "—";
  const cr = n / 1e7;
  if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)} L Cr`;
  if (cr >= 1) return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
  return `₹${(n / 1e5).toFixed(2)} L`;
};

export function DataBadge({ meta, kind, className = "" }: { meta?: Meta | null; kind?: string; className?: string }) {
  if (!meta) return null;
  const label = kind ?? meta.dataType ?? "Data";
  const color = /real-time/i.test(label) ? "!text-emerald" : /delayed|intraday/i.test(label) ? "!text-amber" : "!text-cyan";
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-[11px] text-muted ${className}`}>
      <span className={`chip !py-0.5 ${color}`}>{label}</span>
      <span>{meta.source}</span>
      <span>· {meta.asOf ? `as of ${fmtTime(meta.asOf)}` : `fetched ${fmtTime(meta.fetchedAt)}`}</span>
    </span>
  );
}

export function Sparkline({ values, w = 96, h = 30, up }: { values: number[]; w?: number; h?: number; up?: boolean }) {
  if (values.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  const pos = up ?? values.at(-1)! >= values[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={pos ? "var(--emerald)" : "var(--rose)"} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

const PALETTE = ["#00D4FF", "#00E6A0", "#8B5CF6", "#FBBF24", "#FB7185", "#38BDF8", "#34D399", "#F472B6"];
export function Avatar({ name, logo, size = 40 }: { name: string; logo?: string | null; size?: number }) {
  const [bad, setBad] = useState(false);
  const initials = name.replace(/limited|ltd\.?|india|the/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const color = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  if (logo && !bad) return <img src={logo} alt="" width={size} height={size} onError={() => setBad(true)} className="rounded-xl bg-white object-contain p-1 shrink-0" style={{ width: size, height: size }} />;
  return (
    <span className="rounded-xl grid place-items-center font-display font-semibold shrink-0" style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 18%, transparent)`, color, fontSize: size * 0.36 }} aria-hidden>
      {initials}
    </span>
  );
}

export function WatchButton({ symbol, compact }: { symbol: string; compact?: boolean }) {
  const lists = useStore((s) => s.watchlists);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inAny = lists.some((l) => l.symbols.includes(symbol));
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const toggleIn = (id: string) => setState((s) => ({ watchlists: s.watchlists.map((l) => (l.id === id ? { ...l, symbols: l.symbols.includes(symbol) ? l.symbols.filter((x) => x !== symbol) : [...l.symbols, symbol] } : l)) }));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`btn-ghost !py-2 ${compact ? "!px-2.5" : "!px-4"} text-sm inline-flex items-center gap-2 ${inAny ? "!border-cyan/60 !text-cyan" : ""}`} aria-expanded={open} aria-label={`Add ${cleanSym(symbol)} to a watchlist`}>
        <Icon name="bookmark" className="w-4 h-4" /> {!compact && (inAny ? "Watching" : "Watchlist")}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-line bg-bg2 p-2 shadow-2xl">
            {lists.map((l) => (
              <label key={l.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-card-strong cursor-pointer text-sm">
                <input type="checkbox" checked={l.symbols.includes(symbol)} onChange={() => toggleIn(l.id)} className="accent-[var(--cyan)]" /> {l.name}
                <span className="ml-auto text-xs text-muted">{l.symbols.length}</span>
              </label>
            ))}
            <button className="w-full text-left text-sm text-cyan px-2 py-2 rounded-lg hover:bg-card-strong" onClick={() => {
              const name = prompt("New watchlist name");
              if (name?.trim()) setState((s) => ({ watchlists: [...s.watchlists, { id: uid(), name: name.trim().slice(0, 40), symbols: [symbol] }] }));
            }}>+ New watchlist</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto scroll-thin bg-bg2 border-l border-line p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Icon name="bulb" className="w-5 h-5 text-cyan" /> {title}</h2>
              <button className="btn-ghost !p-2" onClick={onClose} aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LearnButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-ghost !py-2 !px-4 text-sm inline-flex items-center gap-2 !border-violet/50 !text-violet">
      <Icon name="bulb" className="w-4 h-4" /> Learn
    </button>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="rounded-2xl border border-rose/40 bg-rose/5 p-4 text-sm text-rose" role="alert">{error}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-2xl bg-card animate-pulse ${className}`} />;
}
