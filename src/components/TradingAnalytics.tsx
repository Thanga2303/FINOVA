import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccount } from "../lib/account";
import { useStore } from "../lib/store";
import { Locked } from "./Membership";
import { inr } from "./ui";

type Row = { symbol: string; name: string; trades: number; pnl: number; wins: number };
type Result = {
  level: "basic" | "advanced" | "report"; trades: number; buys: number; sells: number; realised: number; charges: number;
  winRate?: number | null; avgWin?: number; avgLoss?: number; profitFactor?: number | null; expectancy?: number | null;
  best?: { symbol: string; pnl: number } | null; worst?: { symbol: string; pnl: number } | null; bySymbol?: Row[];
  report?: { curve: { at: number; equity: number }[]; maxDrawdown: number; longestWinStreak: number; longestLossStreak: number; monthly: { month: string; trades: number; pnl: number; wins: number }[]; generatedAt: number };
};

const Stat = ({ k, v, c = "" }: { k: string; v: string; c?: string }) => <div className="rounded-2xl border border-line bg-card p-3"><div className="text-xs text-muted">{k}</div><div className={`font-semibold mt-0.5 tabular-nums ${c}`}>{v}</div></div>;

/** Paper-trading analytics. The server decides the depth of analysis from the verified membership. */
export default function TradingAnalytics() {
  const orders = useStore((s) => s.paper.orders);
  const { plan, loaded } = useAccount();
  const [r, setR] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded) return;
    fetch("/api/analytics/trading", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orders }) })
      .then((x) => x.json()).then(setR).catch(() => setErr("Analytics are unavailable right now."));
  }, [orders, loaded, plan.id]);
  if (err) return <p className="text-sm text-rose">{err}</p>;
  if (!r) return <div className="h-28 rounded-3xl bg-card animate-pulse" />;
  const pnlC = (v: number) => (v >= 0 ? "text-emerald" : "text-rose");

  const csv = () => {
    if (!r.report) return;
    const lines = [["month", "trades", "wins", "pnl"], ...r.report.monthly.map((m) => [m.month, m.trades, m.wins, m.pnl.toFixed(2)])].map((l) => l.join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `finova-performance-${new Date().toLocaleDateString("en-CA")}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Paper-trading analytics</h3><span className="chip">{r.level === "basic" ? "Basic" : r.level === "advanced" ? "Pro" : "Elite"}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat k="Executed orders" v={String(r.trades)} /><Stat k="Closed sells" v={String(r.sells)} />
          <Stat k="Realised P&L" v={inr(r.realised, 2)} c={pnlC(r.realised)} /><Stat k="Charges (est.)" v={inr(r.charges, 2)} />
        </div>
        {r.level !== "basic" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <Stat k="Win rate" v={r.winRate == null ? "—" : `${(r.winRate * 100).toFixed(0)}%`} />
              <Stat k="Avg win / avg loss" v={`${inr(r.avgWin ?? 0)} / ${inr(r.avgLoss ?? 0)}`} />
              <Stat k="Profit factor" v={r.profitFactor == null ? "—" : r.profitFactor.toFixed(2)} />
              <Stat k="Expectancy per trade" v={r.expectancy == null ? "—" : inr(r.expectancy, 2)} c={pnlC(r.expectancy ?? 0)} />
            </div>
            {!!r.bySymbol?.length && (
              <div className="h-48 mt-4">
                <ResponsiveContainer>
                  <BarChart data={r.bySymbol.slice(0, 10).map((s) => ({ ...s, symbol: s.symbol.replace(/\.(NS|BO)$/, "") }))}>
                    <XAxis dataKey="symbol" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => inr(Number(v))} />
                    <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v) => [inr(Number(v), 2), "Realised P&L"]} />
                    <Bar dataKey="pnl" fill="var(--cyan)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {r.sells === 0 && <p className="text-xs text-muted mt-3">Close (sell) some paper positions to see win rate, profit factor and per-symbol results.</p>}
          </>
        )}
      </section>
      {r.level === "basic" && <Locked compact plan="pro" title="Advanced paper-trading analytics" text="Win rate, profit factor, expectancy and per-symbol results with FINOVA Pro." />}
      {r.level === "advanced" && <Locked compact plan="elite" title="Detailed performance reports" text="Equity curve, drawdown, streaks and monthly breakdown with CSV export in FINOVA Elite." />}
      {r.report && (
        <section className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold">Performance report</h3>
            <button className="chip !text-cyan" onClick={csv} disabled={!r.report.monthly.length}>Download CSV</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat k="Max drawdown (realised)" v={inr(r.report.maxDrawdown, 2)} c="text-rose" />
            <Stat k="Longest win streak" v={String(r.report.longestWinStreak)} />
            <Stat k="Longest loss streak" v={String(r.report.longestLossStreak)} />
          </div>
          {r.report.curve.length > 1 ? (
            <div className="h-44 mt-4">
              <ResponsiveContainer>
                <AreaChart data={r.report.curve}>
                  <XAxis dataKey="at" type="number" scale="time" domain={["dataMin", "dataMax"]} hide />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => inr(Number(v))} />
                  <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-IN")} formatter={(v) => [inr(Number(v), 2), "Cumulative realised P&L"]} />
                  <Area dataKey="equity" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.15} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-muted mt-3">The equity curve appears after two or more closed trades.</p>}
          {r.report.monthly.length > 0 && (
            <table className="w-full text-sm mt-4"><thead className="text-xs text-muted text-left"><tr><th className="py-1">Month</th><th>Trades</th><th>Wins</th><th className="text-right">P&L</th></tr></thead>
              <tbody>{r.report.monthly.map((m) => <tr key={m.month} className="border-t border-line"><td className="py-1.5">{m.month}</td><td>{m.trades}</td><td>{m.wins}</td><td className={`text-right ${pnlC(m.pnl)}`}>{inr(m.pnl, 2)}</td></tr>)}</tbody></table>
          )}
          <p className="text-[11px] text-faint mt-3">Generated by FINOVA's server from your paper orders. Paper results don't predict real trading results.</p>
        </section>
      )}
    </div>
  );
}

export type PortfolioInsight = { level: "warn" | "info"; text: string };
