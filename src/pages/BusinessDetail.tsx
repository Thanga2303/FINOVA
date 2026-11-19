import { Link, useParams } from "react-router-dom";
import { businessIdeas } from "../data/business";
import { toggle, useStore } from "../lib/store";
import { Icon, Page, Reveal } from "../components/ui";
import VideoPanel from "../components/VideoPanel";
import NotFound from "./NotFound";

function Block({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="rounded-3xl border border-line bg-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full grid place-items-center text-sm font-display font-semibold bg-emerald/15 text-emerald">{n}</span>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
        </div>
        {children}
      </section>
    </Reveal>
  );
}
const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">{items.map((x) => <li key={x} className="flex gap-2"><span className="text-emerald">•</span><span>{x}</span></li>)}</ul>
);

export default function BusinessDetail() {
  const { id } = useParams();
  const b = businessIdeas.find((x) => x.id === id);
  const saved = useStore((s) => (b ? s.bookmarks.includes(b.id) : false));
  if (!b) return <NotFound />;
  const others = businessIdeas.filter((x) => x.id !== b.id && x.categories.some((c) => b.categories.includes(c))).slice(0, 3);

  return (
    <Page>
      <nav className="text-sm text-muted"><Link to="/business" className="hover:text-text">Business Ideas</Link> / <span className="text-text">{b.name}</span></nav>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5">{b.categories.map((c) => <span key={c} className="chip">{c}</span>)}</div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-4">{b.name}</h1>
        </div>
        <button onClick={() => toggle("bookmarks", b.id)} className={`btn-ghost inline-flex items-center gap-2 ${saved ? "!border-emerald !text-emerald" : ""}`} aria-pressed={saved}>
          <Icon name="bookmark" className="w-4 h-4" /> {saved ? "Bookmarked" : "Bookmark idea"}
        </button>
      </header>

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <Block n={1} title="Business overview"><p className="leading-relaxed">{b.overview}</p></Block>
        <Block n={2} title="Initial investment estimate">
          <div className="font-display text-3xl font-semibold text-emerald">{b.investment}</div>
          <p className="text-sm text-muted mt-2">Indicative estimate only. Costs depend on location, scale and choices; build a detailed budget before starting.</p>
        </Block>
        <Block n={3} title="Required skills"><List items={b.skills} /></Block>
        <Block n={4} title="Target customers"><List items={b.customers} /></Block>
        <Block n={5} title="Business model"><p className="leading-relaxed">{b.model}</p></Block>
        <Block n={6} title="Revenue generation methods"><List items={b.revenue} /></Block>
        <Block n={7} title="Marketing strategy"><List items={b.marketing} /></Block>
        <Block n={8} title="Potential challenges"><List items={b.challenges} /></Block>
      </div>

      <div className="mt-5">
        <Block n={9} title="Step-by-step startup roadmap">
          <ol className="grid md:grid-cols-2 gap-3">
            {b.roadmap.map((s, i) => (
              <li key={s} className="flex gap-3 rounded-2xl border border-line p-3">
                <span className="font-display font-semibold text-cyan w-6 shrink-0">{i + 1}</span><span>{s}</span>
              </li>
            ))}
          </ol>
        </Block>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 rounded-full grid place-items-center text-sm font-display font-semibold bg-emerald/15 text-emerald">10</span><h2 className="font-display text-xl font-semibold">Recommended educational videos</h2></div>
        <VideoPanel lessonId={`biz-${b.id}`} title={b.name} query={b.video} />
      </div>

      <p className="text-xs text-amber/90 mt-6">Estimates and examples are for learning. Business outcomes are never guaranteed; research local regulations (GST, licences, registrations) before you start.</p>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold mb-4">Related ideas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {others.map((o) => (
              <Link key={o.id} to={`/business/${o.id}`} className="rounded-2xl border border-line bg-card p-5 hover:bg-card-strong">
                <div className="font-semibold">{o.name}</div>
                <div className="text-sm text-muted mt-1">{o.investment}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
