import { useMemo, useState } from "react";
import { candles, pattern, rsi, sma } from "../lib/sim";
import { inr } from "./ui";
import { useAccount } from "../lib/account";
import { Link } from "react-router-dom";

/** Interactive candlestick practice chart using SIMULATED prices. */
export default function CandleChart({ seed = 7, n = 70 }: { seed?: number; n?: number }) {
  const [s, setS] = useState(seed);
  const data = useMemo(() => candles(n, s, 500), [n, s]);
  const [hover, setHover] = useState<number | null>(null);
  const [showMA, setShowMA] = useState(true);
  const [showPat, setShowPat] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const { features } = useAccount();
  const adv = features.advancedIndicators;

  const W = 820, H = 300, VOL = 60, RS = showRSI ? 80 : 0, PAD = 8, AX = 58;
  const hi = Math.max(...data.map((d) => d.h));
  const lo = Math.min(...data.map((d) => d.l));
  const vmax = Math.max(...data.map((d) => d.v));
  const cw = (W - AX - PAD) / data.length;
  const y = (p: number) => PAD + ((hi - p) / (hi - lo)) * (H - PAD * 2);
  const ma20 = sma(data.map((d) => d.c), 20);
  const rs = rsi(data.map((d) => d.c), 14);
  const total = H + VOL + RS + 20;
  const cur = hover !== null ? data[hover] : data[data.length - 1];
  const curPat = hover !== null && adv ? pattern(data, hover) : null;

  const maPath = ma20.map((v, i) => (v == null ? "" : `${ma20[i - 1] == null ? "M" : "L"}${i * cw + cw / 2},${y(v)}`)).join(" ");
  const rsY = (v: number) => H + VOL + 20 + (1 - v / 100) * (RS - 10);
  const rsPath = rs.map((v, i) => (v == null ? "" : `${rs[i - 1] == null ? "M" : "L"}${i * cw + cw / 2},${rsY(v)}`)).join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
        <div>
          <div className="font-display text-lg font-semibold">Candlestick practice chart</div>
          <div className="text-xs text-amber">Simulated prices for learning, not real market data</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button className={`chip ${showMA ? "!text-cyan !border-cyan/50" : ""}`} onClick={() => setShowMA((v) => !v)} aria-pressed={showMA}>20 SMA</button>
          {adv ? (
            <>
              <button className={`chip ${showPat ? "!text-violet !border-violet/50" : ""}`} onClick={() => setShowPat((v) => !v)} aria-pressed={showPat}>Patterns</button>
              <button className={`chip ${showRSI ? "!text-emerald !border-emerald/50" : ""}`} onClick={() => setShowRSI((v) => !v)} aria-pressed={showRSI}>RSI 14</button>
            </>
          ) : <Link to="/pricing?highlight=pro" className="chip" title="Advanced indicators are part of FINOVA Pro">🔒 Patterns · RSI (Pro)</Link>}
          <button className="chip" onClick={() => setS((x) => x + 1)}>New chart</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3">
        {[["Open", cur.o], ["High", cur.h], ["Low", cur.l], ["Close", cur.c]].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border border-line px-2 py-1.5"><span className="text-muted">{k} </span><span className="font-semibold">{inr(v as number, 2)}</span></div>
        ))}
        <div className="rounded-lg border border-line px-2 py-1.5 col-span-2 sm:col-span-1"><span className="text-muted">Pattern </span><span className="font-semibold text-violet">{curPat ?? "—"}</span></div>
      </div>
      <svg viewBox={`0 0 ${W} ${total}`} className="w-full h-auto select-none touch-none" onMouseLeave={() => setHover(null)} role="img" aria-label="Simulated candlestick chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={0} x2={W - AX} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={W - AX + 6} y={y(t) + 4} fontSize={11} fill="var(--muted)">{t.toFixed(0)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const up = d.c >= d.o;
          const col = up ? "var(--emerald)" : "var(--rose)";
          const x = i * cw + cw / 2;
          const p = adv && showPat ? pattern(data, i) : null;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              <rect x={i * cw} y={0} width={cw} height={total} fill={hover === i ? "var(--card-strong)" : "transparent"} />
              <line x1={x} x2={x} y1={y(d.h)} y2={y(d.l)} stroke={col} strokeWidth={1.2} />
              <rect x={x - cw * 0.32} width={cw * 0.64} y={y(Math.max(d.o, d.c))} height={Math.max(1, Math.abs(y(d.o) - y(d.c)))} fill={col} rx={1} />
              <rect x={x - cw * 0.32} width={cw * 0.64} y={H + 10 + VOL - (d.v / vmax) * VOL} height={(d.v / vmax) * VOL} fill={col} opacity={0.35} />
              {p && <circle cx={x} cy={y(d.l) + 9} r={3} fill="var(--violet)" />}
            </g>
          );
        })}
        {showMA && <path d={maPath} fill="none" stroke="var(--cyan)" strokeWidth={1.6} />}
        {adv && showRSI && (
          <g>
            <line x1={0} x2={W - AX} y1={rsY(70)} y2={rsY(70)} stroke="var(--rose)" strokeDasharray="4 4" opacity={0.6} />
            <line x1={0} x2={W - AX} y1={rsY(30)} y2={rsY(30)} stroke="var(--emerald)" strokeDasharray="4 4" opacity={0.6} />
            <text x={W - AX + 6} y={rsY(70) + 4} fontSize={10} fill="var(--muted)">70</text>
            <text x={W - AX + 6} y={rsY(30) + 4} fontSize={10} fill="var(--muted)">30</text>
            <path d={rsPath} fill="none" stroke="var(--emerald)" strokeWidth={1.4} />
          </g>
        )}
      </svg>
      <p className="text-xs text-muted mt-3">
        Hover or tap a candle to read its open, high, low and close. Purple dots mark simple rule-based patterns (doji, hammer, shooting star, engulfing).
        Patterns are signals to study, not buy or sell instructions.
      </p>
    </div>
  );
}
