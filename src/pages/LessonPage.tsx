import { Link, useParams } from "react-router-dom";
import { academyById, lessonById, lessonPath, nextLesson, prevLesson } from "../data";
import { completeLesson, useStore } from "../lib/store";
import { Disclaimer, Icon, LevelBadge, Page, Reveal } from "../components/ui";
import Quiz from "../components/Quiz";
import VideoPanel from "../components/VideoPanel";
import ToolEmbed from "../components/ToolEmbed";
import NotFound from "./NotFound";

export default function LessonPage() {
  const { academy = "", lessonId = "" } = useParams();
  const lesson = lessonById(lessonId);
  const a = academyById(academy);
  const done = useStore((s) => Boolean(lesson && s.completed[lesson.id]));
  if (!lesson || !a || lesson.academy !== a.id) return <NotFound />;
  const next = nextLesson(lesson);
  const prev = prevLesson(lesson);
  const idx = a.lessons.findIndex((l) => l.id === lesson.id);

  return (
    <Page>
      <nav className="text-sm text-muted flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
        <Link to="/learn" className="hover:text-text">Learn</Link><span>/</span>
        <Link to={`/${a.id}`} className="hover:text-text">{a.name}</Link><span>/</span>
        <span className="text-text truncate">{lesson.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_300px] gap-10 mt-6 items-start">
        <article className="min-w-0">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={lesson.level} />
              <span className="chip">{lesson.minutes} min read</span>
              <span className="chip">Lesson {idx + 1} of {a.lessons.length}</span>
              {done && <span className="chip !text-emerald"><Icon name="check" className="w-3.5 h-3.5" /> Completed</span>}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-4 leading-tight">{lesson.title}</h1>
            <p className="text-lg text-muted mt-4">{lesson.summary}</p>
          </Reveal>

          <Reveal>
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold mb-3">Simple explanation</h2>
              <div className="space-y-4 text-[17px] leading-relaxed">
                {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section className="mt-8 rounded-3xl border border-cyan/30 bg-cyan/5 p-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Icon name="bulb" className="w-5 h-5 text-cyan" /> Practical example</h2>
              <p className="mt-3 leading-relaxed">{lesson.example}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mt-8">
              <h2 className="font-display text-2xl font-semibold mb-3">Important points</h2>
              <ul className="space-y-2">
                {lesson.points.map((p) => (
                  <li key={p} className="flex gap-3"><Icon name="check" className="w-5 h-5 text-emerald shrink-0 mt-0.5" /><span>{p}</span></li>
                ))}
              </ul>
            </section>
          </Reveal>

          {lesson.tool && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold mb-4">Try it yourself</h2>
              <ToolEmbed tool={lesson.tool} />
            </section>
          )}

          <section className="mt-10">
            <VideoPanel lessonId={lesson.id} title={lesson.title} query={lesson.video} />
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold mb-4">Knowledge quiz</h2>
            <Quiz key={lesson.id} id={lesson.id} questions={lesson.quiz} onDone={() => completeLesson(lesson.id)} />
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {!done && <button className="btn-ghost" onClick={() => completeLesson(lesson.id)}>Mark as complete (+20 XP)</button>}
            <Link to={`/ai?q=${encodeURIComponent(`Explain ${lesson.title} with another example`)}`} className="btn-ghost inline-flex items-center gap-2"><Icon name="spark" className="w-4 h-4 text-cyan" /> Ask FINOVA AI about this</Link>
          </div>

          <nav className="mt-10 grid sm:grid-cols-2 gap-4" aria-label="Lesson navigation">
            {prev ? (
              <Link to={lessonPath(prev)} className="rounded-2xl border border-line p-4 hover:bg-card"><div className="text-xs text-muted">Previous</div><div className="font-semibold">{prev.title}</div></Link>
            ) : <span />}
            {next ? (
              <Link to={lessonPath(next)} className="rounded-2xl border border-cyan/40 bg-cyan/5 p-4 text-right hover:bg-cyan/10">
                <div className="text-xs text-cyan">Next lesson →</div><div className="font-semibold">{next.title}</div>
              </Link>
            ) : (
              <Link to={`/${a.id}`} className="rounded-2xl border border-emerald/40 bg-emerald/5 p-4 text-right"><div className="text-xs text-emerald">Academy finished</div><div className="font-semibold">Back to {a.name}</div></Link>
            )}
          </nav>
          <Disclaimer className="mt-10" />
        </article>

        <aside className="hidden lg:block sticky top-24">
          <div className="glass rounded-3xl p-5">
            <div className="text-sm font-semibold mb-3">{a.name}</div>
            <ol className="space-y-1 max-h-[70vh] overflow-y-auto scroll-thin pr-1">
              {a.lessons.map((l) => (
                <li key={l.id}><LessonLink id={l.id} title={l.title} current={l.id === lesson.id} to={lessonPath(l)} /></li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function LessonLink({ id, title, current, to }: { id: string; title: string; current: boolean; to: string }) {
  const done = useStore((s) => Boolean(s.completed[id]));
  return (
    <Link to={to} aria-current={current ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${current ? "bg-card-strong text-text" : "text-muted hover:text-text"}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${done ? "bg-emerald" : "bg-line"}`} />
      <span className="truncate">{title}</span>
    </Link>
  );
}
