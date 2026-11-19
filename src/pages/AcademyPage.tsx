import { Link } from "react-router-dom";
import { academyById, lessonPath, trustedSources } from "../data";
import type { AcademyId, Level } from "../data/types";
import { useStore } from "../lib/store";
import { Disclaimer, Icon, Page, Reveal, Ring } from "../components/ui";
import CandleChart from "../components/CandleChart";
import Simulator from "../components/Simulator";
import {
  CompoundingCalculator, EmergencyFundCalculator, InflationCalculator, LumpSumCalculator,
  RetirementCalculator, RiskRewardCalculator, SipCalculator,
} from "../components/Calculators";

const INTRO: Record<AcademyId, string> = {
  stocks: "Start with what a share is and how NSE and BSE work, then learn to read financial statements and charts, and finish with portfolio construction and risk management.",
  "mutual-funds": "Understand how mutual funds pool money, the main fund types, SIPs and NAV, then learn to evaluate and compare funds using costs, risk and consistency.",
  trading: "Learn trading styles, candlesticks, indicators and the maths of risk, then practise everything in a paper-trading simulator with virtual money.",
  investments: "Build wealth responsibly: compounding, inflation, asset allocation, emergency funds, goals, retirement and the tax basics every investor in India should know.",
};

function Tools({ id }: { id: AcademyId }) {
  if (id === "mutual-funds") return <div className="grid gap-6"><SipCalculator /><LumpSumCalculator /></div>;
  if (id === "investments") return <div className="grid gap-6"><CompoundingCalculator /><div className="grid xl:grid-cols-2 gap-6"><InflationCalculator /><EmergencyFundCalculator /></div><RetirementCalculator /></div>;
  if (id === "trading") return <div className="grid gap-6"><CandleChart /><RiskRewardCalculator /></div>;
  return <div className="grid gap-6"><CandleChart seed={21} /><RiskRewardCalculator /></div>;
}

export default function AcademyPage({ id }: { id: AcademyId }) {
  const a = academyById(id)!;
  const completed = useStore((s) => s.completed);
  const quiz = useStore((s) => s.quiz);
  const n = a.lessons.filter((l) => completed[l.id]).length;
  const next = a.lessons.find((l) => !completed[l.id]);
  const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];

  return (
    <Page>
      <section className="relative overflow-hidden rounded-[2rem] border border-line p-6 sm:p-10" style={{ background: `radial-gradient(60rem 30rem at 90% -20%, color-mix(in srgb, ${a.accent} 22%, transparent), transparent 60%), var(--card)` }}>
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: a.accent }}>Academy</div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold">{a.name}</h1>
            <p className="mt-4 text-muted text-lg max-w-2xl">{INTRO[id]}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {next ? <Link to={lessonPath(next)} className="btn-primary">{n ? "Continue" : "Start"}: {next.title}</Link> : <span className="chip !text-emerald !text-sm !py-2">Academy complete</span>}
              <a href={id === "trading" ? "#simulator" : "#tools"} className="btn-ghost">{id === "trading" ? "Open simulator" : "Interactive tools"}</a>
            </div>
          </div>
          <Ring pct={n / a.lessons.length} size={150} stroke={12} label={`${n}/${a.lessons.length}`} sub="lessons done" />
        </div>
      </section>

      <section className="mt-14 space-y-12">
        {levels.map((lv) => {
          const ls = a.lessons.filter((l) => l.level === lv);
          if (!ls.length) return null;
          return (
            <div key={lv}>
              <Reveal>
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="font-display text-2xl font-semibold">{lv}</h2>
                  <span className="text-sm text-muted">{ls.filter((l) => completed[l.id]).length}/{ls.length} complete</span>
                </div>
              </Reveal>
              <ol className="relative border-l border-line ml-3 space-y-3">
                {ls.map((l, i) => {
                  const done = Boolean(completed[l.id]);
                  const qs = quiz[l.id];
                  return (
                    <Reveal key={l.id} delay={Math.min(i, 6) * 0.03}>
                      <li className="ml-6 relative">
                        <span className={`absolute -left-[32px] top-5 w-4 h-4 rounded-full border-2 ${done ? "bg-emerald border-emerald" : "bg-bg border-line"}`} />
                        <Link to={lessonPath(l)} className="group flex flex-wrap sm:flex-nowrap items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 hover:bg-card-strong transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold group-hover:text-cyan">{l.title}</div>
                            <div className="text-sm text-muted truncate">{l.summary}</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs shrink-0">
                            {qs && <span className="chip">Quiz {qs.score}/{qs.total}</span>}
                            {l.tool && <span className="chip !text-violet">Interactive</span>}
                            <span className="text-muted">{l.minutes} min</span>
                            {done && <Icon name="check" className="w-4 h-4 text-emerald" />}
                          </div>
                        </Link>
                      </li>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </section>

      <section id="tools" className="mt-20 scroll-mt-24">
        <Reveal><h2 className="font-display text-3xl font-semibold mb-6">Interactive tools</h2></Reveal>
        <Tools id={id} />
      </section>

      {id === "trading" && <section className="mt-10"><Simulator /></section>}

      <section className="mt-16 grid md:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-semibold mb-3">Go deeper with trusted sources</h3>
          <ul className="space-y-2 text-sm">
            {trustedSources.map((s) => (
              <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer" className="text-cyan hover:underline">{s.name}</a> <span className="text-muted">· {s.note}</span></li>
            ))}
          </ul>
        </div>
        <Disclaimer />
      </section>
    </Page>
  );
}
