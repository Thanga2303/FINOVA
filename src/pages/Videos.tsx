import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { academies, allLessons, lessonById, lessonPath, trustedSources } from "../data";
import { businessIdeas } from "../data/business";
import { useStore } from "../lib/store";
import { Icon, Page, SectionHead } from "../components/ui";
import VideoPanel from "../components/VideoPanel";

type Topic = { id: string; title: string; query: string; group: string; to: string };

const topics: Topic[] = [
  ...allLessons.map((l) => ({ id: l.id, title: l.title, query: l.video, group: academies.find((a) => a.id === l.academy)!.name, to: lessonPath(l) })),
  ...businessIdeas.map((b) => ({ id: `biz-${b.id}`, title: b.name, query: b.video, group: "Business Ideas", to: `/business/${b.id}` })),
];

export default function Videos() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const saved = useStore((s) => s.savedVideos);
  const topicId = params.get("topic") ?? topics[0].id;
  const current = topics.find((t) => t.id === topicId) ?? topics[0];

  const groups = useMemo(() => {
    const f = filter.toLowerCase();
    const list = topics.filter((t) => (!f || t.title.toLowerCase().includes(f)) && (!savedOnly || saved.includes(t.id)));
    const g = new Map<string, Topic[]>();
    list.forEach((t) => g.set(t.group, [...(g.get(t.group) ?? []), t]));
    return [...g.entries()];
  }, [filter, savedOnly, saved]);

  const lesson = lessonById(current.id);

  return (
    <Page>
      <SectionHead eyebrow="FINOVA Video Learning Center" title="A video for every topic" sub="Pick a topic to find a matching educational video. We favour trusted educators and never invent video links." />
      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <aside className="glass rounded-3xl p-4 lg:sticky lg:top-24">
          <input className="field" placeholder="Filter topics…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter topics" />
          <button className={`chip mt-3 ${savedOnly ? "!text-emerald !border-emerald/50" : ""}`} onClick={() => setSavedOnly((v) => !v)} aria-pressed={savedOnly}>
            <Icon name="bookmark" className="w-3.5 h-3.5" /> Saved only ({saved.length})
          </button>
          <div className="mt-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1 space-y-4">
            {groups.map(([g, ts]) => (
              <div key={g}>
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">{g}</div>
                <ul className="space-y-0.5">
                  {ts.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setParams({ topic: t.id })}
                        className={`w-full text-left text-sm rounded-lg px-2.5 py-1.5 flex items-center gap-2 ${t.id === current.id ? "bg-card-strong text-text" : "text-muted hover:text-text"}`}
                      >
                        <Icon name="play" className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{t.title}</span>
                        {saved.includes(t.id) && <Icon name="bookmark" className="w-3 h-3 text-emerald ml-auto shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {groups.length === 0 && <p className="text-sm text-muted p-2">No topics found.</p>}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <VideoPanel key={current.id} lessonId={current.id} title={current.title} query={current.query} />
          <div className="glass rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted">{current.group}</div>
              <div className="font-display text-xl font-semibold">{current.title}</div>
              {lesson && <p className="text-sm text-muted mt-1 max-w-xl">{lesson.summary}</p>}
            </div>
            <Link to={current.to} className="btn-primary">{lesson ? "Open lesson & quiz" : "Open playbook"}</Link>
          </div>
          <div className="rounded-3xl border border-line p-6">
            <h3 className="font-semibold mb-3">Official investor-education channels and sites</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {trustedSources.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-line bg-card p-4 hover:bg-card-strong">
                  <div className="font-medium text-cyan">{s.name}</div>
                  <div className="text-xs text-muted mt-1">{s.note}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
