/** Seeded random numbers so simulated charts look the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Candle = { i: number; o: number; h: number; l: number; c: number; v: number };

/** Simulated OHLC candles: a random walk with gentle drift and volatility clustering. Not real market data. */
export function candles(n: number, seed = 7, start = 500, drift = 0.0006, vol = 0.016): Candle[] {
  const r = rng(seed);
  const out: Candle[] = [];
  let price = start;
  let v = vol;
  for (let i = 0; i < n; i++) {
    v = Math.max(0.006, Math.min(0.04, v * (0.9 + r() * 0.2)));
    const o = price;
    const move = (r() - 0.5) * 2 * v + drift;
    const c = Math.max(1, o * (1 + move));
    const h = Math.max(o, c) * (1 + r() * v * 0.8);
    const l = Math.min(o, c) * (1 - r() * v * 0.8);
    out.push({ i, o, h, l, c, v: Math.round(50000 + r() * 150000 * (1 + Math.abs(move) * 30)) });
    price = c;
  }
  return out;
}

export function sma(values: number[], n: number): (number | null)[] {
  return values.map((_, i) => (i < n - 1 ? null : values.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n));
}

export function rsi(values: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  let g = 0, l = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gain = Math.max(0, d), loss = Math.max(0, -d);
    if (i <= n) {
      g += gain; l += loss;
      if (i === n) { g /= n; l /= n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    } else {
      g = (g * (n - 1) + gain) / n;
      l = (l * (n - 1) + loss) / n;
      out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    }
  }
  return out;
}

/** Simple, rule-based pattern tags on a candle (educational). */
export function pattern(cs: Candle[], i: number): string | null {
  const k = cs[i];
  const body = Math.abs(k.c - k.o);
  const range = k.h - k.l || 1;
  const upper = k.h - Math.max(k.o, k.c);
  const lower = Math.min(k.o, k.c) - k.l;
  if (body / range < 0.1) return "Doji";
  if (lower > body * 2 && upper < body) return k.c >= k.o ? "Hammer" : "Hanging man";
  if (upper > body * 2 && lower < body) return "Shooting star";
  const p = cs[i - 1];
  if (p && p.c < p.o && k.c > k.o && k.c > p.o && k.o < p.c) return "Bullish engulfing";
  if (p && p.c > p.o && k.c < k.o && k.o > p.c && k.c < p.o) return "Bearish engulfing";
  return null;
}

/** Fictional assets for the paper-trading simulator. Names and prices are invented. */
export const SIM_ASSETS = [
  { symbol: "AURA", name: "Aurora Tech (fictional)", sector: "IT", start: 1450, vol: 0.018, seed: 11 },
  { symbol: "GANGA", name: "Ganga Power (fictional)", sector: "Energy", start: 320, vol: 0.014, seed: 23 },
  { symbol: "KIRAN", name: "Kiran Bank (fictional)", sector: "Banking", start: 860, vol: 0.016, seed: 37 },
  { symbol: "MITRA", name: "Mitra Foods (fictional)", sector: "FMCG", start: 2150, vol: 0.011, seed: 41 },
  { symbol: "NAVYA", name: "Navya Pharma (fictional)", sector: "Pharma", start: 640, vol: 0.02, seed: 53 },
  { symbol: "F50", name: "FINOVA 50 Index (fictional)", sector: "Index", start: 24000, vol: 0.009, seed: 67 },
];
