import { useEffect, useMemo, useRef, useState } from "react";
import { Area, Bar, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi, type Chart, type ChartPt } from "../../lib/api";
import { DataBadge, ErrorNote, Skeleton } from "./bits";

export const RANGES = [
  { id: "1d", label: "1D" }, { id: "1w", label: "1W" }, { id: "1m", label: "1M" }, { id: "1y", label: "1Y" }, { id: "5y", label: "5Y" },
] as const;

const tickFmt = (range: string) => (t: number) => {
  const d = new Date(t);
  if (range === "1d") return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  if (range === "1w") return d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
  if (range === "5y") return d.toLocaleDateString("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
};

function Candles({ pts, range }: { pts: ChartPt[]; range: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const data = pts.filter((p) => p.o != null && p.h != null && p.l != null).slice(-160);
  const H = 300, VOL = 50, AX = 62;
  const hi = Math.max(...data.map((d) => d.h!)), lo = Math.min(...data.map((d) => d.l!));
  const vmax = Math.max(1, ...data.map((d) => d.v ?? 0));
  const cw = (w - AX) / Math.max(1, data.length);
  const y = (p: number) => 6 + ((hi - p) / (hi - lo || 1)) * (H - 12);
  const cur = hover != null ? data[hover] : data.at(-1);
  return (
    <div ref={ref} className="relative">
      {cur && (
        <div className="absolute left-0 top-0 z-10 flex flex-wrap gap-x-3 text-[11px] text-muted bg-bg2/70 rounded-lg px-2 py-1">
          <span>{tickFmt(range)(cur.t)}</span><span>O {cur.o?.toFixed(2)}</span><span>H {cur.h?.toFixed(2)}</span><span>L {cur.l?.toFixed(2)}</span><span>C {cur.c.toFixed(2)}</span>
        </div>
      )}
      <svg width={w} height={H + VOL + 8} onMouseLeave={() => setHover(null)} role="img" aria-label="Candlestick price chart">
        {Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4).map((t) => (
          <g key={t}><line x1={0} x2={w - AX} y1={y(t)} y2={y(t)} stroke="var(--line)" /><text x={w - AX + 6} y={y(t) + 4} fontSize={11} fill="var(--muted)">{t.toFixed(t > 1000 ? 0 : 2)}</text></g>
        ))}
        {data.map((d, i) => {
          const up = d.c >= d.o!;
          const col = up ? "var(--emerald)" : "var(--rose)";
          const x = i * cw + cw / 2;
          return (
            <g key={d.t} onMouseEnter={() => setHover(i)}>
              <rect x={i * cw} y={0} width={cw} height={H + VOL} fill={hover === i ? "var(--card-strong)" : "transparent"} />
              <line x1={x} x2={x} y1={y(d.h!)} y2={y(d.l!)} stroke={col} />
              <rect x={x - cw * 0.35} width={Math.max(1, cw * 0.7)} y={y(Math.max(d.o!, d.c))} height={Math.max(1, Math.abs(y(d.o!) - y(d.c)))} fill={col} />
              <rect x={x - cw * 0.35} width={Math.max(1, cw * 0.7)} y={H + 8 + VOL - ((d.v ?? 0) / vmax) * VOL} height={((d.v ?? 0) / vmax) * VOL} fill={col} opacity={0.3} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function PriceChart({ symbol, initial = "1m", height = 320, onRange }: { symbol: string; initial?: string; height?: number; onRange?: (r: string) => void }) {
  const [range, setRange] = useState(initial);
  const [mode, setMode] = useState<"line" | "candle">("line");
  const { data, error, loading } = useApi<Chart>(`/api/market/chart/${encodeURIComponent(symbol)}?range=${range}`, { poll: range === "1d" ? 60e3 : 0, maxAge: 55e3 });
  const pts = useMemo(() => data?.points ?? [], [data]);
  const first = range === "1d" ? data?.prevClose ?? pts[0]?.c : pts[0]?.c;
  const last = pts.at(-1)?.c;
  const up = (last ?? 0) >= (first ?? 0);
  const color = up ? "var(--emerald)" : "var(--rose)";
  const chg = first && last ? ((last - first) / first) * 100 : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex gap-1 rounded-full border border-line p-1" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => { setRange(r.id); onRange?.(r.id); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${range === r.id ? "bg-cyan text-[#04121c]" : "text-muted hover:text-text"}`}>{r.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {chg != null && <span className={`text-sm font-semibold ${up ? "text-emerald" : "text-rose"}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}% <span className="text-muted font-normal">over {RANGES.find((r) => r.id === range)?.label}</span></span>}
          <div className="flex gap-1 rounded-full border border-line p-1">
            {(["line", "candle"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`px-2.5 py-1 rounded-full text-xs ${mode === m ? "bg-card-strong text-text" : "text-muted"}`}>{m === "line" ? "Line" : "Candles"}</button>
            ))}
          </div>
        </div>
      </div>
      <ErrorNote error={error} />
      {loading && !data ? <Skeleton className="w-full" /> : pts.length < 2 ? (
        <div className="grid place-items-center text-sm text-muted" style={{ height }}>No chart data for this range yet.</div>
      ) : mode === "candle" ? (
        <Candles pts={pts} range={range} />
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer>
            <ComposedChart data={pts} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`pg-${symbol}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={tickFmt(range)} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis yAxisId="p" domain={["auto", "auto"]} orientation="right" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => Number(v).toLocaleString("en-IN", { maximumFractionDigits: v > 1000 ? 0 : 2 })} />
              <YAxis yAxisId="v" hide domain={[0, (max: number) => max * 5]} />
              <Tooltip
                contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)" }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: range === "1d" || range === "1w" ? "short" : undefined, timeZone: "Asia/Kolkata" })}
                formatter={(v, n) => (n === "v" ? [Number(v).toLocaleString("en-IN"), "Volume"] : [Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 }), "Price"])}
              />
              {range === "1d" && data?.prevClose && <ReferenceLine yAxisId="p" y={data.prevClose} stroke="var(--faint)" strokeDasharray="4 4" label={{ value: "Prev close", fill: "var(--faint)", fontSize: 10, position: "insideTopLeft" }} />}
              <Bar yAxisId="v" dataKey="v" fill="var(--faint)" opacity={0.35} isAnimationActive={false} />
              <Area yAxisId="p" dataKey="c" type="monotone" stroke={color} strokeWidth={2} fill={`url(#pg-${symbol})`} isAnimationActive={false} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2"><DataBadge meta={data?.meta} /></div>
    </div>
  );
}
