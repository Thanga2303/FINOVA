import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const inr = (n: number, digits = 0) => {
  const v = Number.isFinite(n) ? n : 0;
  const s = Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return (v < 0 && s.replace(/[0.,]/g, "") !== "" ? "-₹" : "₹") + s;
};

/** Compact Indian format: ₹12.4 L, ₹1.2 Cr */
export const inrShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return inr(n);
};

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={`min-w-0 ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={`mb-8 ${center ? "text-center mx-auto" : ""} max-w-3xl`}>
      {eyebrow && <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-3">{eyebrow}</div>}
      <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">{title}</h2>
      {sub && <p className="mt-3 text-muted text-base sm:text-lg">{sub}</p>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20"
    >
      {children}
    </motion.main>
  );
}

export function Disclaimer({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-muted ${className}`} role="note">
      <span aria-hidden className="mt-0.5 text-amber font-bold">!</span>
      <div>
        {children ?? (
          <>
            FINOVA is for <strong className="text-text">education only</strong>. Nothing here is investment advice or a recommendation to buy or sell.
            Market investments carry risk, and past or hypothetical returns do not guarantee future results. Research independently or consult a SEBI-registered adviser.
          </>
        )}
      </div>
    </div>
  );
}

export function Ring({ pct, size = 120, stroke = 10, label, sub }: { pct: number; size?: number; stroke?: number; label?: ReactNode; sub?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--emerald)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-xl font-semibold">{label}</div>
        {sub && <div className="text-[11px] text-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const color = level === "Beginner" ? "text-emerald" : level === "Intermediate" ? "text-cyan" : "text-violet";
  return <span className={`chip ${color}`}>{level}</span>;
}

export const lowPower = () => {
  if (typeof window === "undefined") return true;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency ?? 4;
  return reduce || small || cores <= 4;
};

export function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const p: Record<string, ReactNode> = {
    chart: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
    pie: <><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>,
    candle: <><path d="M7 3v4M7 17v4M17 5v3M17 16v3" /><rect x="5" y="7" width="4" height="10" rx="1" /><rect x="15" y="8" width="4" height="8" rx="1" /></>,
    growth: <><path d="M3 20h18" /><rect x="5" y="13" width="3" height="7" /><rect x="10.5" y="9" width="3" height="11" /><rect x="16" y="5" width="3" height="15" /></>,
    bulb: <><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" /></>,
    spark: <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    check: <path d="M5 12l5 5L20 7" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
    flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 0-3 0-4 0-6z" />,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>,
    send: <path d="M4 12l16-8-6 16-2-7z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name] ?? p.spark}
    </svg>
  );
}
