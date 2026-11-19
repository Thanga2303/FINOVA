import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { markTool } from "../lib/store";
import { inr, inrShort } from "./ui";

const WealthBars = lazy(() => import("../three/WealthBars"));

function Slider({ label, value, set, min, max, step = 1, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; fmt: (n: number) => string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm text-muted">{label}</span>
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => set(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="field !w-32 shrink-0 text-right !py-1 !px-2 text-sm font-semibold"
          aria-label={label}
        />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} aria-label={`${label} slider`} />
      <div className="text-[11px] text-faint mt-0.5">{fmt(value)}</div>
    </label>
  );
}

function Out({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-display text-xl sm:text-2xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

export function CalcCard({ title, sub, children, id }: { title: string; sub: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="glass rounded-3xl p-5 sm:p-7 scroll-mt-24">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted mt-1 mb-5">{sub}</p>
      {children}
    </section>
  );
}

const Hypo = () => (
  <p className="text-xs text-amber/90 mt-4">
    Results are hypothetical illustrations based on the rate you enter. Actual market returns vary, can be negative, and are not guaranteed.
  </p>
);

function useTrack(tool: string, deps: unknown[]) {
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) return setFirst(false);
    markTool(tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const axisFmt = (v: number) => inrShort(v).replace("₹", "");

function GrowthChart({ data }: { data: { year: number; invested: number; value: number }[] }) {
  return (
    <div className="h-64 mt-5">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--emerald)" stopOpacity={0} /></linearGradient>
            <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `Yr ${v}`} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={axisFmt} width={56} />
          <Tooltip
            contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)" }}
            formatter={(v, n) => [inr(Number(v)), n === "value" ? "Estimated value" : "Amount invested"]}
            labelFormatter={(l) => `Year ${l}`}
          />
          <Legend formatter={(v) => (v === "value" ? "Estimated value" : "Amount invested")} wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="invested" stroke="var(--cyan)" fill="url(#gi)" strokeWidth={2} animationDuration={900} />
          <Area type="monotone" dataKey="value" stroke="var(--emerald)" fill="url(#gv)" strokeWidth={2.5} animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function sipSeries(monthly: number, ratePct: number, years: number, stepUpPct = 0) {
  const i = ratePct / 100 / 12;
  let value = 0, invested = 0, m = monthly;
  const pts = [{ year: 0, invested: 0, value: 0 }];
  for (let y = 1; y <= years; y++) {
    for (let k = 0; k < 12; k++) {
      value = (value + m) * (1 + i);
      invested += m;
    }
    pts.push({ year: y, invested: Math.round(invested), value: Math.round(value) });
    m *= 1 + stepUpPct / 100;
  }
  return pts;
}

export function SipCalculator() {
  const [m, setM] = useState(5000);
  const [r, setR] = useState(12);
  const [y, setY] = useState(15);
  const [step, setStep] = useState(0);
  useTrack("calc-sip", [m, r, y, step]);
  const data = useMemo(() => sipSeries(m, r, y, step), [m, r, y, step]);
  const last = data[data.length - 1];
  return (
    <CalcCard id="sip" title="SIP calculator" sub="See how a monthly investment could grow with compounding.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Slider label="Monthly investment (₹)" value={m} set={setM} min={500} max={200000} step={500} fmt={inr} />
          <Slider label="Expected annual return (%)" value={r} set={setR} min={1} max={30} step={0.5} fmt={(v) => `${v}% a year (assumption)`} />
          <Slider label="Investment duration (years)" value={y} set={setY} min={1} max={40} fmt={(v) => `${v} years`} />
          <Slider label="Annual step-up (%)" value={step} set={setStep} min={0} max={25} fmt={(v) => (v ? `SIP grows ${v}% each year` : "No step-up")} />
        </div>
        <div className="grid grid-cols-1 gap-3 content-start">
          <Out label="Total invested" value={inr(last.invested)} accent="text-cyan" />
          <Out label="Estimated returns" value={inr(last.value - last.invested)} accent="text-violet" />
          <Out label="Estimated final value" value={inr(last.value)} accent="text-emerald" />
        </div>
      </div>
      <GrowthChart data={data} />
      <Hypo />
    </CalcCard>
  );
}

export function LumpSumCalculator() {
  const [p, setP] = useState(100000);
  const [r, setR] = useState(10);
  const [y, setY] = useState(10);
  useTrack("calc-lumpsum", [p, r, y]);
  const data = useMemo(() => Array.from({ length: y + 1 }, (_, k) => ({ year: k, invested: p, value: Math.round(p * Math.pow(1 + r / 100, k)) })), [p, r, y]);
  const fv = data[data.length - 1].value;
  return (
    <CalcCard id="lumpsum" title="Lump-sum calculator" sub="One-time investment growing at a constant assumed rate: FV = P × (1 + r)ⁿ.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Slider label="Investment (₹)" value={p} set={setP} min={1000} max={10000000} step={1000} fmt={inr} />
          <Slider label="Expected annual return (%)" value={r} set={setR} min={1} max={30} step={0.5} fmt={(v) => `${v}% (assumption)`} />
          <Slider label="Duration (years)" value={y} set={setY} min={1} max={40} fmt={(v) => `${v} years`} />
        </div>
        <div className="grid gap-3 content-start">
          <Out label="Invested" value={inr(p)} accent="text-cyan" />
          <Out label="Estimated gain" value={inr(fv - p)} accent="text-violet" />
          <Out label="Estimated value" value={inr(fv)} accent="text-emerald" />
          <Out label="Rule of 72: years to double" value={`≈ ${(72 / r).toFixed(1)} years`} />
        </div>
      </div>
      <GrowthChart data={data} />
      <Hypo />
    </CalcCard>
  );
}

export function CompoundingCalculator() {
  const [p, setP] = useState(50000);
  const [m, setM] = useState(3000);
  const [r, setR] = useState(11);
  const [y, setY] = useState(20);
  useTrack("calc-compound", [p, m, r, y]);
  const data = useMemo(() => {
    const i = r / 100 / 12;
    let v = p, inv = p;
    const pts = [];
    for (let yr = 1; yr <= y; yr++) {
      for (let k = 0; k < 12; k++) { v = v * (1 + i) + m; inv += m; }
      pts.push({ year: yr, invested: Math.round(inv), value: Math.round(v) });
    }
    return pts;
  }, [p, m, r, y]);
  const last = data[data.length - 1];
  const bars = data.filter((_, k) => data.length <= 12 || k % Math.ceil(data.length / 12) === 0 || k === data.length - 1);
  return (
    <CalcCard id="compound" title="Compounding & 3D wealth growth" sub="Start amount plus monthly additions. Drag the 3D chart to rotate it. Cyan = invested, green = estimated value.">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-5">
          <Slider label="Starting amount (₹)" value={p} set={setP} min={0} max={5000000} step={5000} fmt={inr} />
          <Slider label="Monthly addition (₹)" value={m} set={setM} min={0} max={200000} step={500} fmt={inr} />
          <Slider label="Expected annual return (%)" value={r} set={setR} min={1} max={25} step={0.5} fmt={(v) => `${v}% (assumption)`} />
          <Slider label="Years" value={y} set={setY} min={2} max={40} fmt={(v) => `${v} years`} />
          <div className="grid grid-cols-2 gap-3">
            <Out label="Invested" value={inrShort(last.invested)} accent="text-cyan" />
            <Out label="Estimated value" value={inrShort(last.value)} accent="text-emerald" />
          </div>
        </div>
        <div className="h-80 lg:h-auto min-h-80 rounded-2xl border border-line bg-bg2/40 overflow-hidden">
          <Suspense fallback={<div className="h-full grid place-items-center text-muted text-sm">Loading 3D chart…</div>}>
            <WealthBars data={bars} />
          </Suspense>
        </div>
      </div>
      <Hypo />
    </CalcCard>
  );
}

export function InflationCalculator() {
  const [cost, setCost] = useState(100000);
  const [inf, setInf] = useState(6);
  const [y, setY] = useState(15);
  useTrack("calc-inflation", [cost, inf, y]);
  const future = cost * Math.pow(1 + inf / 100, y);
  const power = 100000 / Math.pow(1 + inf / 100, y);
  return (
    <CalcCard id="inflation" title="Inflation calculator" sub="What will today's expense cost in the future, and how much will ₹1 lakh be worth?">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Slider label="Cost today (₹)" value={cost} set={setCost} min={1000} max={10000000} step={1000} fmt={inr} />
          <Slider label="Inflation rate (%)" value={inf} set={setInf} min={1} max={15} step={0.5} fmt={(v) => `${v}% a year`} />
          <Slider label="Years from now" value={y} set={setY} min={1} max={40} fmt={(v) => `${v} years`} />
        </div>
        <div className="grid gap-3 content-start">
          <Out label={`Same item in ${y} years`} value={inr(future)} accent="text-rose" />
          <Out label={`₹1,00,000 in ${y} years buys what ₹… buys today`} value={inr(power)} accent="text-amber" />
          <Out label="Prices multiply by" value={`${(future / cost).toFixed(2)}×`} />
        </div>
      </div>
      <p className="text-xs text-muted mt-4">India's retail inflation target for the RBI is 4% (2–6% band). Actual inflation varies year to year.</p>
    </CalcCard>
  );
}

export function EmergencyFundCalculator() {
  const [items, setItems] = useState([
    { k: "Rent / housing", v: 12000 }, { k: "Food & groceries", v: 6000 }, { k: "Utilities & phone", v: 3000 },
    { k: "Transport", v: 2000 }, { k: "Loan EMIs", v: 4000 }, { k: "Insurance & medical", v: 1500 },
  ]);
  const [months, setMonths] = useState(6);
  useTrack("calc-emergency", [items, months]);
  const total = items.reduce((a, b) => a + b.v, 0);
  return (
    <CalcCard id="emergency" title="Emergency fund planner" sub="Add up essential monthly expenses only, then choose how many months to cover.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {items.map((it, i) => (
            <label key={it.k} className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">{it.k}</span>
              <input
                type="number" min={0} value={it.v} className="field !w-36 text-right"
                onChange={(e) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, v: Math.max(0, Number(e.target.value) || 0) } : x)))}
              />
            </label>
          ))}
          <Slider label="Months to cover" value={months} set={setMonths} min={3} max={12} fmt={(v) => (v >= 6 ? `${v} months (good for irregular income)` : `${v} months`)} />
        </div>
        <div className="grid gap-3 content-start">
          <Out label="Essential monthly expenses" value={inr(total)} accent="text-cyan" />
          <Out label="Emergency fund target" value={inr(total * months)} accent="text-emerald" />
          <p className="text-sm text-muted">Keep it in a savings account, sweep-in FD or liquid fund, separate from your investments.</p>
        </div>
      </div>
    </CalcCard>
  );
}

export function RetirementCalculator() {
  const [age, setAge] = useState(22);
  const [ret, setRet] = useState(60);
  const [life, setLife] = useState(85);
  const [exp, setExp] = useState(30000);
  const [inf, setInf] = useState(6);
  const [pre, setPre] = useState(11);
  const [post, setPost] = useState(7);
  useTrack("calc-retirement", [age, ret, life, exp, inf, pre, post]);
  const years = Math.max(1, ret - age);
  const nRet = Math.max(1, life - ret);
  const expAtRet = exp * Math.pow(1 + inf / 100, years);
  const rr = (1 + post / 100) / (1 + inf / 100) - 1;
  const annual = expAtRet * 12;
  const corpus = rr === 0 ? annual * nRet : annual * ((1 - Math.pow(1 + rr, -nRet)) / rr) * (1 + rr);
  const i = pre / 100 / 12, n = years * 12;
  const sip = corpus / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  return (
    <CalcCard id="retirement" title="Retirement planner" sub="Estimate the corpus you'd need and the monthly SIP to build it, under your own assumptions.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Slider label="Current age" value={age} set={(v) => setAge(Math.min(v, ret - 1))} min={18} max={59} fmt={(v) => `${v} years old`} />
          <Slider label="Retirement age" value={ret} set={(v) => setRet(Math.max(v, age + 1))} min={40} max={70} fmt={(v) => `Retire at ${v}`} />
          <Slider label="Plan until age" value={life} set={(v) => setLife(Math.max(v, ret + 1))} min={70} max={100} fmt={(v) => `${v - ret} years in retirement`} />
          <Slider label="Monthly expenses today (₹)" value={exp} set={setExp} min={5000} max={500000} step={1000} fmt={inr} />
          <Slider label="Inflation (%)" value={inf} set={setInf} min={2} max={12} step={0.5} fmt={(v) => `${v}%`} />
          <Slider label="Return before retirement (%)" value={pre} set={setPre} min={4} max={16} step={0.5} fmt={(v) => `${v}% (assumption)`} />
          <Slider label="Return after retirement (%)" value={post} set={setPost} min={3} max={12} step={0.5} fmt={(v) => `${v}% (assumption)`} />
        </div>
        <div className="grid gap-3 content-start">
          <Out label={`Monthly expenses at ${ret} (future rupees)`} value={inr(expAtRet)} accent="text-rose" />
          <Out label="Estimated corpus needed" value={inrShort(corpus)} accent="text-emerald" />
          <Out label="Monthly SIP needed from today" value={inr(sip)} accent="text-cyan" />
          <p className="text-sm text-muted">Starting 5 years later raises the monthly SIP sharply. Try changing your current age to see it.</p>
        </div>
      </div>
      <Hypo />
    </CalcCard>
  );
}

export function RiskRewardCalculator() {
  const [cap, setCap] = useState(500000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(250);
  const [stop, setStop] = useState(240);
  const [target, setTarget] = useState(280);
  useTrack("calc-riskreward", [cap, riskPct, entry, stop, target]);
  const long = target >= entry;
  const risk = Math.abs(entry - stop) || 0.01;
  const reward = Math.abs(target - entry);
  const ratio = reward / risk;
  const maxLoss = (cap * riskPct) / 100;
  const qty = Math.floor(maxLoss / risk);
  const valid = long ? stop < entry : stop > entry;
  return (
    <CalcCard id="riskreward" title="Risk-reward & position size" sub="Decide how much to risk first; the position size follows from your stop-loss.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <Slider label="Trading capital (₹)" value={cap} set={setCap} min={10000} max={10000000} step={10000} fmt={inr} />
          <Slider label="Risk per trade (%)" value={riskPct} set={setRiskPct} min={0.25} max={5} step={0.25} fmt={(v) => `${v}% = ${inr((cap * v) / 100)}`} />
          <div className="grid grid-cols-3 gap-3">
            {[["Entry", entry, setEntry], ["Stop-loss", stop, setStop], ["Target", target, setTarget]].map(([k, v, s]) => (
              <label key={k as string} className="block text-sm">
                <span className="text-muted">{k as string} (₹)</span>
                <input type="number" className="field mt-1" value={v as number} onChange={(e) => (s as (n: number) => void)(Number(e.target.value) || 0)} />
              </label>
            ))}
          </div>
          {!valid && <p className="text-sm text-rose">For a {long ? "long (buy)" : "short"} trade the stop-loss must be {long ? "below" : "above"} the entry.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Out label="Risk : reward" value={`1 : ${ratio.toFixed(2)}`} accent={ratio >= 2 ? "text-emerald" : ratio >= 1 ? "text-amber" : "text-rose"} />
          <Out label="Break-even win rate" value={`${((1 / (1 + ratio)) * 100).toFixed(0)}%`} />
          <Out label="Position size" value={`${qty.toLocaleString("en-IN")} shares`} accent="text-cyan" />
          <Out label="Capital used" value={inrShort(qty * entry)} />
          <Out label="Max planned loss" value={inr(qty * risk)} accent="text-rose" />
          <Out label="Potential profit" value={inr(qty * reward)} accent="text-emerald" />
        </div>
      </div>
      <p className="text-xs text-muted mt-4">Before charges and slippage. Stops can fill worse than planned when prices gap.</p>
    </CalcCard>
  );
}
