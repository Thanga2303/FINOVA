import { Link } from "react-router-dom";
import type { Returns } from "../../lib/api";
import { setState, useStore } from "../../lib/store";
import { Icon } from "../ui";

export const RISK_LEVELS = ["Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High"];

export function Ret({ v, className = "" }: { v: number | null | undefined; className?: string }) {
  if (v == null || !Number.isFinite(v)) return <span className={`text-muted ${className}`}>—</span>;
  return <span className={`${v >= 0 ? "text-emerald" : "text-rose"} tabular-nums ${className}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
}

export function Riskometer({ level, size = 150 }: { level: string | null; size?: number }) {
  const i = level ? RISK_LEVELS.indexOf(level) : -1;
  const cols = ["#00E6A0", "#7EE787", "#FBBF24", "#F59E0B", "#FB7185", "#E11D48"];
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const arc = (k: number) => {
    const a0 = Math.PI + (k / 6) * Math.PI, a1 = Math.PI + ((k + 1) / 6) * Math.PI;
    return `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  };
  const ang = Math.PI + ((i + 0.5) / 6) * Math.PI;
  return (
    <div className="text-center">
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`} role="img" aria-label={`Riskometer: ${level ?? "unknown"}`}>
        {cols.map((c, k) => <path key={k} d={arc(k)} stroke={c} strokeWidth={14} fill="none" opacity={k === i ? 1 : 0.35} />)}
        {i >= 0 && <line x1={cx} y1={cy} x2={cx + (r - 16) * Math.cos(ang)} y2={cy + (r - 16) * Math.sin(ang)} stroke="var(--text)" strokeWidth={3} strokeLinecap="round" />}
        <circle cx={cx} cy={cy} r={5} fill="var(--text)" />
      </svg>
      <div className="font-semibold text-sm">{level ?? "Not available"}</div>
    </div>
  );
}

export function FundWatchButton({ code }: { code: number }) {
  const on = useStore((s) => s.fundWatch.includes(code));
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setState((s) => ({ fundWatch: on ? s.fundWatch.filter((c) => c !== code) : [...s.fundWatch, code] })); }}
      className={`p-2 rounded-full border ${on ? "border-cyan text-cyan" : "border-line text-muted hover:text-text"}`} aria-pressed={on} aria-label={on ? "Remove from fund watchlist" : "Add to fund watchlist"}>
      <Icon name="bookmark" className="w-4 h-4" />
    </button>
  );
}

const KEY = "finova.compare";
export function getCompare(): number[] { try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function setCompare(c: number[]) { try { sessionStorage.setItem(KEY, JSON.stringify(c.slice(0, 3))); } catch { /* ignore */ } window.dispatchEvent(new Event("finova-compare")); }

export function CompareToggle({ code, list }: { code: number; list: number[] }) {
  const on = list.includes(code);
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompare(on ? list.filter((c) => c !== code) : [...list, code]); }}
      disabled={!on && list.length >= 3} className={`chip ${on ? "!text-violet !border-violet/50" : ""} disabled:opacity-40`} aria-pressed={on}>
      {on ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}

export function CompareTray({ list }: { list: number[] }) {
  if (!list.length) return null;
  return (
    <div className="fixed bottom-20 xl:bottom-6 left-1/2 -translate-x-1/2 z-40 glass header-solid rounded-full px-4 py-2.5 flex items-center gap-3 shadow-2xl">
      <span className="text-sm">{list.length} fund{list.length > 1 ? "s" : ""} selected</span>
      <Link to={`/funds/compare?codes=${list.join(",")}`} className={`btn-primary !py-1.5 !px-4 text-sm ${list.length < 2 ? "pointer-events-none opacity-50" : ""}`} aria-disabled={list.length < 2}>Compare</Link>
      <button className="text-xs text-muted hover:text-rose" onClick={() => setCompare([])}>Clear</button>
    </div>
  );
}

export const shortCat = (c: string) => c.replace(/^(Equity|Debt|Hybrid|Other|Income\/Debt Oriented) Schemes? - /i, "").replace(/^Other Scheme - /, "");
export const returnsRow = (r: Returns) => [r["1Y"], r["3Y"], r["5Y"]];
