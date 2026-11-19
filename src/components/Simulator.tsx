import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { candles, SIM_ASSETS } from "../lib/sim";
import { getState, setState, START_CASH, useStore, type Trade } from "../lib/store";
import { inr, inrShort } from "./ui";

const PKEY = "finova.simprices";
type Series = Record<string, number[]>;

function initialSeries(): Series {
  try {
    const saved = JSON.parse(localStorage.getItem(PKEY) || "null");
    if (saved && SIM_ASSETS.every((a) => Array.isArray(saved[a.symbol]))) return saved;
  } catch { /* ignore */ }
  const s: Series = {};
  SIM_ASSETS.forEach((a) => (s[a.symbol] = candles(60, a.seed, a.start, 0.0004, a.vol).map((c) => +c.c.toFixed(2))));
  return s;
}

const charges = (value: number) => Math.min(20, value * 0.0003);

export default function Simulator() {
  const [series, setSeries] = useState<Series>(initialSeries);
  const [sel, setSel] = useState(SIM_ASSETS[0].symbol);
  const [qty, setQty] = useState(10);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [running, setRunning] = useState(true);
  const sim = useStore((s) => s.sim);
  const seriesRef = useRef(series);
  seriesRef.current = series;

  // Simulated price ticks every 2 seconds while the tab is visible.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setSeries((prev) => {
        const next: Series = {};
        SIM_ASSETS.forEach((a) => {
          const arr = prev[a.symbol];
          const last = arr[arr.length - 1];
          const p = Math.max(1, last * (1 + (Math.random() - 0.495) * a.vol * 0.6));
          next[a.symbol] = [...arr.slice(-119), +p.toFixed(2)];
        });
        try { localStorage.setItem(PKEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [running]);

  const price = (sym: string) => { const a = series[sym]; return a[a.length - 1]; };
  const holdingsValue = sim.positions.reduce((t, p) => t + p.qty * price(p.symbol), 0);
  const equity = sim.cash + holdingsValue;

  // Record equity curve roughly every 10 seconds.
  useEffect(() => {
    const id = setInterval(() => {
      const s = getState().sim;
      const v = s.cash + s.positions.reduce((t, p) => t + p.qty * (seriesRef.current[p.symbol]?.slice(-1)[0] ?? p.avg), 0);
      setState((st) => ({ sim: { ...st.sim, equity: [...st.sim.equity, { t: Date.now(), v: Math.round(v) }].slice(-200) } }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const asset = SIM_ASSETS.find((a) => a.symbol === sel)!;
  const cur = price(sel);
  const first = series[sel][0];
  const chg = ((cur - first) / first) * 100;
  const pos = sim.positions.find((p) => p.symbol === sel);

  function trade(side: "BUY" | "SELL") {
    const q = Math.floor(qty);
    if (q <= 0) return setMsg({ ok: false, text: "Enter a quantity of at least 1." });
    const value = q * cur;
    const fee = charges(value);
    const s = getState().sim;
    if (side === "BUY") {
      if (value + fee > s.cash) return setMsg({ ok: false, text: `Not enough virtual cash. You need ${inr(value + fee)}.` });
      const ex = s.positions.find((p) => p.symbol === sel);
      const positions = ex
        ? s.positions.map((p) => (p.symbol === sel ? { ...p, qty: p.qty + q, avg: (p.avg * p.qty + value) / (p.qty + q) } : p))
        : [...s.positions, { symbol: sel, qty: q, avg: cur }];
      const t: Trade = { id: crypto.randomUUID(), symbol: sel, side, qty: q, price: cur, time: Date.now() };
      setState((st) => ({ sim: { ...st.sim, cash: s.cash - value - fee, positions, history: [t, ...s.history].slice(0, 200) } }));
      setMsg({ ok: true, text: `Bought ${q} ${sel} at ${inr(cur, 2)} (simulated charges ${inr(fee, 2)}).` });
    } else {
      const ex = s.positions.find((p) => p.symbol === sel);
      if (!ex || ex.qty < q) return setMsg({ ok: false, text: `You hold ${ex?.qty ?? 0} ${sel}. Short selling is not enabled in this simulator.` });
      const pnl = (cur - ex.avg) * q - fee;
      const positions = ex.qty === q ? s.positions.filter((p) => p.symbol !== sel) : s.positions.map((p) => (p.symbol === sel ? { ...p, qty: p.qty - q } : p));
      const t: Trade = { id: crypto.randomUUID(), symbol: sel, side, qty: q, price: cur, time: Date.now(), pnl };
      setState((st) => ({ sim: { ...st.sim, cash: s.cash + value - fee, positions, history: [t, ...s.history].slice(0, 200) } }));
      setMsg({ ok: pnl >= 0, text: `Sold ${q} ${sel} at ${inr(cur, 2)}. Realised P&L ${inr(pnl, 2)}.` });
    }
  }

  function reset() {
    if (!confirm("Reset the simulator? Your virtual balance, positions and history will be cleared.")) return;
    setState((st) => ({ sim: { cash: START_CASH, positions: [], history: [], equity: [] }, xp: st.xp }));
    try { localStorage.removeItem(PKEY); } catch { /* ignore */ }
    setSeries(initialSeries());
    setMsg({ ok: true, text: "Simulator reset to ₹10,00,000 virtual cash." });
  }

  const closed = sim.history.filter((t) => t.side === "SELL");
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const realised = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const unrealised = sim.positions.reduce((a, p) => a + (price(p.symbol) - p.avg) * p.qty, 0);
  const chart = useMemo(() => series[sel].map((v, i) => ({ i, v })), [series, sel]);
  const eq = sim.equity.length ? sim.equity.map((e) => ({ t: e.t, v: e.v })) : [{ t: Date.now(), v: Math.round(equity) }];

  return (
    <section id="simulator" className="glass rounded-3xl p-4 sm:p-7 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-2xl font-semibold">Paper-trading simulator</h3>
          <p className="text-sm text-muted mt-1">Practise buying and selling with ₹10 lakh of virtual money. Fictional companies, simulated prices, no real trades ever.</p>
        </div>
        <div className="flex gap-2">
          <button className="chip" onClick={() => setRunning((r) => !r)} aria-pressed={!running}>{running ? "Pause prices" : "Resume prices"}</button>
          <button className="chip hover:!text-rose" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          ["Virtual balance", inr(sim.cash), "text-cyan"],
          ["Holdings value", inr(holdingsValue), ""],
          ["Total equity", inr(equity), "text-emerald"],
          ["Unrealised P&L", inr(unrealised), unrealised >= 0 ? "text-emerald" : "text-rose"],
          ["Overall return", `${(((equity - START_CASH) / START_CASH) * 100).toFixed(2)}%`, equity >= START_CASH ? "text-emerald" : "text-rose"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-2xl border border-line bg-card p-3">
            <div className="text-xs text-muted">{k}</div>
            <div className={`font-display text-lg font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <div className="flex lg:flex-col gap-2 overflow-x-auto scroll-thin pb-1" role="listbox" aria-label="Simulated assets">
          {SIM_ASSETS.map((a) => {
            const arr = series[a.symbol];
            const c = ((arr[arr.length - 1] - arr[0]) / arr[0]) * 100;
            return (
              <button
                key={a.symbol} role="option" aria-selected={sel === a.symbol} onClick={() => setSel(a.symbol)}
                className={`shrink-0 text-left rounded-xl border px-3 py-2.5 transition ${sel === a.symbol ? "border-cyan/60 bg-card-strong" : "border-line hover:bg-card"}`}
              >
                <div className="flex justify-between gap-4 text-sm font-semibold"><span>{a.symbol}</span><span>{inr(arr[arr.length - 1], 2)}</span></div>
                <div className="flex justify-between gap-4 text-xs text-muted"><span className="truncate max-w-[9rem]">{a.sector}</span><span className={c >= 0 ? "text-emerald" : "text-rose"}>{c >= 0 ? "+" : ""}{c.toFixed(2)}%</span></div>
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <div className="font-display text-xl font-semibold">{asset.name}</div>
            <div className="text-2xl font-display font-semibold">{inr(cur, 2)}</div>
            <div className={chg >= 0 ? "text-emerald" : "text-rose"}>{chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%</div>
            <span className="chip !text-amber">Simulated</span>
          </div>
          <div className="h-48 mt-2">
            <ResponsiveContainer>
              <AreaChart data={chart}>
                <defs><linearGradient id="simg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chg >= 0 ? "var(--emerald)" : "var(--rose)"} stopOpacity={0.4} /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                <XAxis dataKey="i" hide />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--muted)", fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v) => [inr(Number(v), 2), "Price"]} labelFormatter={() => ""} />
                <Area dataKey="v" type="monotone" stroke={chg >= 0 ? "var(--emerald)" : "var(--rose)"} fill="url(#simg)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-end gap-3 mt-3">
            <label className="text-sm">
              <span className="text-muted block mb-1">Quantity</span>
              <input type="number" min={1} className="field !w-28" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <div className="text-sm text-muted pb-2">Order value ≈ {inr(qty * cur)}</div>
            <div className="flex gap-2 ml-auto">
              <button className="rounded-full px-5 py-2.5 font-semibold bg-emerald text-[#04121c] hover:brightness-110" onClick={() => trade("BUY")}>Buy (virtual)</button>
              <button className="rounded-full px-5 py-2.5 font-semibold bg-rose text-white hover:brightness-110 disabled:opacity-40" disabled={!pos} onClick={() => trade("SELL")}>Sell (virtual)</button>
            </div>
          </div>
          {msg && <p className={`text-sm mt-3 ${msg.ok ? "text-emerald" : "text-rose"}`} role="status">{msg.text}</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-7">
        <div className="lg:col-span-2">
          <h4 className="font-semibold mb-2">Open positions</h4>
          {sim.positions.length === 0 ? (
            <p className="text-sm text-muted">No open positions yet. Pick an asset and place a virtual buy order.</p>
          ) : (
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="text-muted text-xs text-left"><tr><th className="py-2">Asset</th><th>Qty</th><th>Avg</th><th>LTP</th><th className="text-right">P&L</th></tr></thead>
                <tbody>
                  {sim.positions.map((p) => {
                    const l = price(p.symbol), pl = (l - p.avg) * p.qty;
                    return (
                      <tr key={p.symbol} className="border-t border-line cursor-pointer hover:bg-card" onClick={() => setSel(p.symbol)}>
                        <td className="py-2 font-semibold">{p.symbol}</td><td>{p.qty}</td><td>{inr(p.avg, 2)}</td><td>{inr(l, 2)}</td>
                        <td className={`text-right ${pl >= 0 ? "text-emerald" : "text-rose"}`}>{inr(pl, 2)} ({((l / p.avg - 1) * 100).toFixed(2)}%)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <h4 className="font-semibold mt-6 mb-2">Trading history</h4>
          {sim.history.length === 0 ? (
            <p className="text-sm text-muted">Your trades will appear here.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="text-muted text-xs text-left sticky top-0 bg-bg2"><tr><th className="py-2">Time</th><th>Side</th><th>Asset</th><th>Qty</th><th>Price</th><th className="text-right">Realised</th></tr></thead>
                <tbody>
                  {sim.history.map((t) => (
                    <tr key={t.id} className="border-t border-line">
                      <td className="py-1.5 text-muted">{new Date(t.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className={t.side === "BUY" ? "text-emerald" : "text-rose"}>{t.side}</td>
                      <td>{t.symbol}</td><td>{t.qty}</td><td>{inr(t.price, 2)}</td>
                      <td className={`text-right ${(t.pnl ?? 0) >= 0 ? "text-emerald" : "text-rose"}`}>{t.pnl == null ? "—" : inr(t.pnl, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold mb-2">Performance dashboard</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Trades</div><div className="font-semibold">{sim.history.length}</div></div>
            <div className="rounded-xl border border-line p-3"><div className="text-xs text-muted">Win rate</div><div className="font-semibold">{closed.length ? `${Math.round((wins / closed.length) * 100)}%` : "—"}</div></div>
            <div className="rounded-xl border border-line p-3 col-span-2"><div className="text-xs text-muted">Realised P&L</div><div className={`font-semibold ${realised >= 0 ? "text-emerald" : "text-rose"}`}>{inr(realised, 2)}</div></div>
          </div>
          <div className="h-32 mt-3 rounded-xl border border-line p-2">
            <ResponsiveContainer>
              <AreaChart data={eq}>
                <XAxis dataKey="t" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v) => [inrShort(Number(v)), "Equity"]} labelFormatter={(l) => new Date(Number(l)).toLocaleTimeString("en-IN")} />
                <Area dataKey="v" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.12} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted mt-1">Equity curve (sampled every 10 seconds while open).</p>
        </div>
      </div>
      <p className="text-xs text-amber/90 mt-6">Simulation only. Prices are randomly generated for fictional companies and do not represent any real security. Simulated profits do not mean you would make money in real markets.</p>
    </section>
  );
}
