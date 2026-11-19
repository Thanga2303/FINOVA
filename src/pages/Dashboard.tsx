import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { academies, allLessons, lessonById, lessonPath } from "../data";
import { businessIdeas } from "../data/business";
import { BADGES, LEVELS, levelFor, resetProgress, setState, streak, useStore } from "../lib/store";
import { Icon, Page, Reveal, Ring } from "../components/ui";
import DailyChallenge from "../components/DailyChallenge";

const WEEKLY_GOAL = 5;

function Heatmap({ days }: { days: string[] }) {
  const set = new Set(days);
  const cells = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const k = d.toLocaleDateString("en-CA");
    return { k, on: set.has(k) };
  });
  return (
    <div className="grid grid-rows-7 grid-flow-col gap-1 w-fit" aria-label="Learning activity, last 12 weeks">
      {cells.map((c) => <div key={c.k} title={c.k} className={`w-3 h-3 rounded-[3px] ${c.on ? "bg-emerald" : "bg-line"}`} />)}
    </div>
  );
}

export default function Dashboard() {
  const s = useStore((x) => x);
  const [name, setName] = useState(s.name);
  const { level, next, pct, index } = levelFor(s.xp);
  const done = Object.keys(s.completed).length;
  const st = streak(s.activeDays);
  const quizzes = Object.values(s.quiz);
  const avg = quizzes.length ? Math.round((quizzes.reduce((a, q) => a + q.score / q.total, 0) / quizzes.length) * 100) : 0;
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = Object.values(s.completed).filter((t) => t > weekAgo).length;

  const recommended = useMemo(() => {
    const out = [];
    for (const lv of ["Beginner", "Intermediate", "Advanced"]) {
      for (const a of academies) {
        const l = a.lessons.find((x) => x.level === lv && !s.completed[x.id]);
        if (l) out.push(l);
        if (out.length >= 4) return out;
      }
    }
    return out;
  }, [s.completed]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Page>
      <section className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="text-sm text-muted">{greet}</div>
          {s.name ? (
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">Welcome back, <span className="text-gradient">{s.name}</span></h1>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setState(() => ({ name: name.trim().slice(0, 40) })); }} className="mt-2 flex flex-wrap gap-2 items-center">
              <h1 className="font-display text-4xl font-semibold mr-2">Welcome to FINOVA</h1>
              <input className="field !w-56" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
              <button className="btn-primary !py-2.5">Save</button>
            </form>
          )}
          <p className="text-muted mt-2">Progress is saved in this browser.</p>
        </div>
        <div className="flex items-center gap-5 glass rounded-3xl p-5">
          <Ring pct={pct} size={110} label={`Lv ${index + 1}`} sub={`${s.xp} XP`} />
          <div>
            <div className="text-sm text-muted">Level {index + 1} of {LEVELS.length}</div>
            <div className="font-display text-2xl font-semibold">{level.name}</div>
            <div className="text-sm text-muted">{next ? `${next.min - s.xp} XP to ${next.name}` : "Top level reached"}</div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { k: "Lessons completed", v: `${done}/${allLessons.length}`, icon: "check", c: "text-emerald" },
          { k: "Learning streak", v: `${st} day${st === 1 ? "" : "s"}`, icon: "flame", c: "text-amber" },
          { k: "Average quiz score", v: quizzes.length ? `${avg}%` : "—", icon: "trophy", c: "text-cyan" },
          { k: "Weekly goal", v: `${Math.min(thisWeek, WEEKLY_GOAL)}/${WEEKLY_GOAL} lessons`, icon: "spark", c: "text-violet" },
        ].map((x, i) => (
          <Reveal key={x.k} delay={i * 0.05}>
            <div className="glass rounded-3xl p-5">
              <Icon name={x.icon} className={`w-5 h-5 ${x.c}`} />
              <div className="font-display text-2xl font-semibold mt-3">{x.v}</div>
              <div className="text-sm text-muted">{x.k}</div>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mt-8 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-semibold mb-5">Academy progress</h2>
            <div className="space-y-4">
              {academies.map((a) => {
                const n = a.lessons.filter((l) => s.completed[l.id]).length;
                return (
                  <Link key={a.id} to={`/${a.id}`} className="block group">
                    <div className="flex justify-between text-sm mb-1.5"><span className="font-medium group-hover:text-cyan">{a.name}</span><span className="text-muted">{n}/{a.lessons.length}</span></div>
                    <div className="h-2.5 rounded-full bg-line overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${a.accent}, var(--emerald))` }} initial={{ width: 0 }} animate={{ width: `${(n / a.lessons.length) * 100}%` }} transition={{ duration: 1.1, ease: "easeOut" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Recommended next lessons</h2>
            {recommended.length === 0 ? <p className="text-muted">You've completed every lesson. Impressive!</p> : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recommended.map((l) => (
                  <Link key={l.id} to={lessonPath(l)} className="rounded-2xl border border-line bg-card p-4 hover:bg-card-strong">
                    <div className="text-xs text-muted">{academies.find((a) => a.id === l.academy)!.name} · {l.level}</div>
                    <div className="font-semibold mt-1">{l.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BADGES.map((b) => {
                const got = s.badges.includes(b.id);
                return (
                  <div key={b.id} className={`rounded-2xl border p-4 ${got ? "border-amber/50 bg-amber/5" : "border-line opacity-60"}`}>
                    <div className={`w-10 h-10 rounded-full grid place-items-center font-display text-sm font-bold ${got ? "bg-gradient-to-br from-amber to-rose text-[#1a0f00]" : "bg-line text-muted"}`}>{b.icon}</div>
                    <div className="font-semibold mt-2 text-sm">{b.name}</div>
                    <div className="text-xs text-muted">{b.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Quiz scores</h2>
            {quizzes.length === 0 ? <p className="text-muted text-sm">Take a quiz at the end of any lesson to see your scores here.</p> : (
              <ul className="divide-y divide-line">
                {Object.entries(s.quiz).map(([id, q]) => {
                  const l = lessonById(id);
                  return l ? (
                    <li key={id} className="flex justify-between py-2 text-sm">
                      <Link to={lessonPath(l)} className="hover:text-cyan">{l.title}</Link>
                      <span className={q.score === q.total ? "text-emerald" : "text-muted"}>{q.score}/{q.total}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <DailyChallenge />
          <div className="glass rounded-3xl p-5">
            <h2 className="font-semibold mb-3">Activity (12 weeks)</h2>
            <Heatmap days={s.activeDays} />
          </div>
          <div className="glass rounded-3xl p-5">
            <h2 className="font-semibold mb-3">Saved videos</h2>
            {s.savedVideos.length === 0 ? <p className="text-sm text-muted">Save a video topic from any lesson.</p> : (
              <ul className="space-y-1.5 text-sm">
                {s.savedVideos.map((id) => {
                  const l = lessonById(id);
                  const b = businessIdeas.find((x) => `biz-${x.id}` === id);
                  return <li key={id}><Link to={`/videos?topic=${id}`} className="text-muted hover:text-cyan">▶ {l?.title ?? b?.name ?? id}</Link></li>;
                })}
              </ul>
            )}
          </div>
          <div className="glass rounded-3xl p-5">
            <h2 className="font-semibold mb-3">Bookmarked business ideas</h2>
            {s.bookmarks.length === 0 ? <p className="text-sm text-muted">Bookmark ideas in the Business Idea Hub.</p> : (
              <ul className="space-y-1.5 text-sm">
                {s.bookmarks.map((id) => {
                  const b = businessIdeas.find((x) => x.id === id);
                  return b && <li key={id}><Link to={`/business/${id}`} className="text-muted hover:text-cyan">{b.name}</Link></li>;
                })}
              </ul>
            )}
          </div>
          <button className="text-xs text-faint hover:text-rose" onClick={() => confirm("Reset all learning progress in this browser?") && resetProgress()}>Reset progress</button>
        </div>
      </section>
    </Page>
  );
}
