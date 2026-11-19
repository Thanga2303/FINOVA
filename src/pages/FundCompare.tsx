import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate, getJSON, type FundDetail } from "../lib/api";
import { Page, inr } from "../components/ui";
import { ErrorNote, price, Skeleton } from "../components/market/bits";
import { Ret, setCompare, shortCat } from "../components/market/fundBits";

const COLORS = ["var(--cyan)", "var(--emerald)", "var(--violet)"];

export default function FundCompare() {
  const [params] = useSearchParams();
  const codes = (params.get("codes") ?? "").split(",").map(Number).filter((n) => n > 0).slice(0, 3);
  const [funds, setFunds] = useState<FundDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const key = codes.join(",");
  useEffect(() => {
    setLoading(true);
    Promise.all(key.split(",").filter(Boolean).map((c) => getJSON<FundDetail>(`/api/funds/${c}`, 3600e3)))
      .then((f) => { setFunds(f); setError(null); })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setLoading(false));
  }, [key]);

  const growth = useMemo(() => {
    if (funds.length < 2) return [];
    const start = Math.max(...funds.map((f) => f.history[0]?.t ?? 0), (funds[0].navDate ?? Date.now()) - 5 * 365.25 * 864e5);
    const base = funds.map((f) => f.history.find((p) => p.t >= start)?.nav ?? 1);
    const pts = funds[0].history.filter((p) => p.t >= start);
    return pts.map((p) => {
      const row: Record<string, number> = { t: p.t };
      funds.forEach((f, i) => {
        const h = f.history.filter((x) => x.t <= p.t).at(-1);
        if (h) row[`f${i}`] = Math.round((10000 * h.nav) / base[i]);
      });
      return row;
    });
  }, [funds]);

  const rows: [string, (f: FundDetail) => React.ReactNode][] = [
    ["AMC", (f) => f.amc],
    ["Category", (f) => shortCat(f.category)],
    ["NAV", (f) => `${price(f.nav, 4)} (${fmtDate(f.navDate)})`],
    ["1Y return", (f) => <Ret v={f.returns["1Y"]} />],
    ["3Y CAGR", (f) => <Ret v={f.returns["3Y"]} />],
    ["5Y CAGR", (f) => <Ret v={f.returns["5Y"]} />],
    ["10Y CAGR", (f) => <Ret v={f.returns["10Y"]} />],
    ["Expense ratio", (f) => (f.extra?.expenseRatio != null ? `${f.extra.expenseRatio.toFixed(2)}%` : "Not reported")],
    ["Typical risk", (f) => f.risk ?? "—"],
    ["Min. investment", (f) => (f.extra?.minInvestment ? price(f.extra.minInvestment, 0) : "Not reported")],
    ["Top holding", (f) => (f.extra?.holdings?.[0] ? `${f.extra.holdings[0].name} (${f.extra.holdings[0].weight.toFixed(1)}%)` : "Not reported")],
  ];

  return (
    <Page>
      <nav className="text-sm text-muted"><Link to="/funds" className="hover:text-text">Mutual Funds</Link> / <span className="text-text">Compare</span></nav>
      <h1 className="font-display text-4xl font-semibold mt-4">Compare funds</h1>
      <p className="text-muted mt-2">Side-by-side, using AMFI NAV history. Compare funds within the same category for a fair comparison.</p>
      <ErrorNote error={error} />
      {codes.length < 2 && <p className="mt-6 text-muted">Select 2 or 3 funds using “+ Compare” on the <Link to="/funds" className="text-cyan underline">Mutual Funds</Link> page.</p>}
      {loading && codes.length >= 2 && <Skeleton className="h-96 mt-6" />}
      {!loading && funds.length >= 2 && (
        <>
          {new Set(funds.map((f) => shortCat(f.category))).size > 1 && <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-3 text-sm text-muted">These funds are in different categories, so their risk and purpose differ. Return comparisons can mislead.</div>}
          <section className="mt-6 glass rounded-3xl p-5 overflow-x-auto scroll-thin">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr><th className="text-left py-2 w-40" />{funds.map((f, i) => (
                <th key={f.code} className="text-left align-top py-2 pr-3"><Link to={`/funds/${f.code}`} className="font-semibold hover:underline" style={{ color: COLORS[i] }}>{f.name}</Link></th>
              ))}</tr></thead>
              <tbody>{rows.map(([k, fn]) => (
                <tr key={k} className="border-t border-line"><td className="py-2.5 text-muted">{k}</td>{funds.map((f) => <td key={f.code} className="pr-3">{fn(f)}</td>)}</tr>
              ))}</tbody>
            </table>
          </section>
          <section className="mt-6 glass rounded-3xl p-5">
            <h2 className="font-semibold">Growth of ₹10,000 (historical)</h2>
            <p className="text-xs text-muted mb-3">From {growth[0] ? fmtDate(growth[0].t) : "—"}, the latest common start within the last 5 years. Past performance does not guarantee future returns.</p>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={growth}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => inr(Number(v))} />
                  <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} labelFormatter={(t) => fmtDate(Number(t))} formatter={(v, n) => [inr(Number(v)), funds[Number(String(n).slice(1))]?.name.split(" - ")[0] ?? n]} />
                  <Legend formatter={(v) => funds[Number(String(v).slice(1))]?.name.split(" - ")[0]} wrapperStyle={{ fontSize: 12 }} />
                  {funds.map((_, i) => <Line key={i} dataKey={`f${i}`} stroke={COLORS[i]} dot={false} strokeWidth={2} isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <button className="mt-4 text-sm text-muted hover:text-rose" onClick={() => setCompare([])}>Clear comparison</button>
        </>
      )}
    </Page>
  );
}
