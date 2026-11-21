import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { academies, allLessons, lessonPath } from "../data";
import type { Level } from "../data/types";
import { useStore } from "../lib/store";
import { Icon, LevelBadge, Page, Reveal, Ring, SectionHead } from "../components/ui";
import DailyChallenge from "../components/DailyChallenge";
import ConceptLab from "../components/ConceptLab";
import { AdSlot } from "../components/Membership";
import { useAccount } from "../lib/account";
import { TiltCard } from "../components/fx";
import { LEVELS as XP_LEVELS, levelFor } from "../lib/store";

const LearningPath = lazy(() => import("../three/LearningPath"));

const LEVELS: (Level | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Learn() {
  const [level, setLevel] = useState<Level | "All">("All");
  const [acad, setAcad] = useState<string>("all");
  const completed = useStore((s) => s.completed);
  const list = useMemo(
    () => allLessons.filter((l) => (level === "All" || l.level === level) && (acad === "all" || l.academy === acad)),
    [level, acad],
  );
  const done = Object.keys(completed).length;
  const xp = useStore((s) => s.xp);
  const { features } = useAccount();
  const { level: lvl, next } = levelFor(xp);

  return (
    <Page>
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div>
          <SectionHead eyebrow="Learn" title="Your financial university" sub="Four academies, Beginner to Advanced. Complete lessons and quizzes to earn XP and level up." />
          <div className="grid sm:grid-cols-2 gap-4">
            {academies.map((a, i) => {
              const n = a.lessons.filter((l) => completed[l.id]).length;
              return (
                <Reveal key={a.id} delay={i * 0.05}>
                  <Link to={`/learn/${a.id}`} className="block h-full">
                    <TiltCard className="p-5">
                      <div className="flex items-center gap-5">
                        <Ring pct={n / a.lessons.length} size={76} stroke={7} label={`${Math.round((n / a.lessons.length) * 100)}%`} />
                        <div className="min-w-0">
                          <div className="font-display text-lg font-semibold">{a.name}</div>
                          <div className="text-sm text-muted">{n}/{a.lessons.length} lessons complete</div>
                        </div>
                      </div>
                    </TiltCard>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass rounded-3xl p-5">
            <div className="text-sm text-muted">Overall progress</div>
            <div className="font-display text-3xl font-semibold mt-1">{done}<span className="text-muted text-lg">/{allLessons.length}</span></div>
            <div className="h-2 rounded-full bg-line mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan to-emerald" style={{ width: `${(done / allLessons.length) * 100}%` }} /></div>
          </div>
          <DailyChallenge />
        </div>
      </div>

      <section className="mt-12 glass rounded-3xl p-5 sm:p-7 relative overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-cyan mb-2">Your journey</div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">From Beginner to Finance Master</h2>
          </div>
          <div className="text-sm text-muted">You are <span className="text-emerald font-semibold">{lvl.name}</span> · {xp} XP{next ? ` · ${next.min - xp} XP to ${next.name}` : ""}</div>
        </div>
        <div className="h-[260px] sm:h-[320px] mt-2">
          <Suspense fallback={<div className="h-full grid place-items-center text-sm text-muted">Loading your journey…</div>}>
            <LearningPath levels={XP_LEVELS} xp={xp} />
          </Suspense>
        </div>
        <p className="text-xs text-faint">Earn XP from lessons (+20), quiz answers (+10), tools and daily challenges to move along the path.</p>
      </section>

      <div className="mt-8"><ConceptLab /></div>

      <Link to="/learn/masterclasses" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber/30 bg-gradient-to-r from-amber/10 via-transparent to-violet/10 p-6 hover:border-amber/60 transition-colors">
        <div><div className="text-xs font-semibold tracking-[0.2em] uppercase text-amber">FINOVA Elite</div><div className="font-display text-2xl font-semibold mt-1">Masterclasses</div><p className="text-sm text-muted mt-1">Annual reports, allocation plans and position sizing, in depth.</p></div>
        <span className="chip !text-amber">Explore →</span>
      </Link>
      <AdSlot index={1} className="mt-6" />

      <div className="mt-14 flex flex-wrap items-center gap-2">
        {LEVELS.map((lv) => (
          <button key={lv} onClick={() => setLevel(lv)} className={`chip !text-sm !px-4 !py-2 ${level === lv ? "!text-text !border-cyan/60 !bg-card-strong" : ""}`} aria-pressed={level === lv}>{lv}</button>
        ))}
        <span className="w-px h-6 bg-line mx-2" />
        <select value={acad} onChange={(e) => setAcad(e.target.value)} className="field !w-auto !py-2 text-sm" aria-label="Filter by academy">
          <option value="all">All academies</option>
          {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-sm text-muted ml-auto">{list.length} lessons</span>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((l) => (
          <Link key={l.id} to={lessonPath(l)} className="group rounded-2xl border border-line bg-card p-5 hover:bg-card-strong transition-colors">
            <div className="flex items-center justify-between gap-2">
              <LevelBadge level={l.level} />
              {completed[l.id] ? <span className="chip !text-emerald"><Icon name="check" className="w-3.5 h-3.5" /> Done</span> : !features.academyLevels.includes(l.level) ? <span className="chip !text-cyan">Pro</span> : <span className="text-xs text-muted">{l.minutes} min</span>}
            </div>
            <h3 className="font-semibold mt-3 group-hover:text-cyan">{l.title}</h3>
            <p className="text-sm text-muted mt-1 line-clamp-2">{l.summary}</p>
            <div className="text-xs text-faint mt-3">{academies.find((a) => a.id === l.academy)!.name}</div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
