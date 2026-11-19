import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BIZ_CATEGORIES, businessIdeas, type BizCategory } from "../data/business";
import { toggle, useStore } from "../lib/store";
import { Icon, Page, Reveal, SectionHead } from "../components/ui";

const BUDGETS = [
  { label: "Any budget", max: Infinity },
  { label: "Under ₹10,000", max: 10000 },
  { label: "Under ₹1 lakh", max: 100000 },
  { label: "Under ₹5 lakh", max: 500000 },
];

export default function Business() {
  const [cat, setCat] = useState<BizCategory | "All">("All");
  const [budget, setBudget] = useState(0);
  const [onlySaved, setOnlySaved] = useState(false);
  const bookmarks = useStore((s) => s.bookmarks);
  const list = useMemo(
    () => businessIdeas.filter((b) => (cat === "All" || b.categories.includes(cat)) && b.investmentLow <= BUDGETS[budget].max && (!onlySaved || bookmarks.includes(b.id))),
    [cat, budget, onlySaved, bookmarks],
  );

  return (
    <Page>
      <SectionHead eyebrow="Business Idea Hub" title="Learn to build a business, step by step" sub="Each idea covers costs, skills, customers, business model, revenue, marketing, challenges and a startup roadmap, with videos to learn more." />
      <div className="rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-muted mb-8">
        Investment figures are <strong className="text-text">rough estimates</strong> for India and vary widely by city, scale and choices. They are not guarantees of cost, revenue or success.
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", ...BIZ_CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`chip !text-sm !px-3.5 !py-1.5 ${cat === c ? "!text-text !border-emerald/60 !bg-card-strong" : ""}`} aria-pressed={cat === c}>{c}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select className="field !w-auto !py-2 text-sm" value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Starting budget">
          {BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
        </select>
        <button className={`chip !text-sm !py-2 !px-4 ${onlySaved ? "!text-emerald !border-emerald/50" : ""}`} onClick={() => setOnlySaved((v) => !v)} aria-pressed={onlySaved}>
          <Icon name="bookmark" className="w-3.5 h-3.5" /> Bookmarked ({bookmarks.length})
        </button>
        <span className="text-sm text-muted ml-auto">{list.length} ideas</span>
      </div>

      <div className="mt-8 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map((b, i) => {
          const saved = bookmarks.includes(b.id);
          return (
            <Reveal key={b.id} delay={(i % 3) * 0.05}>
              <article className="glass rounded-3xl p-6 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">{b.categories.slice(0, 3).map((c) => <span key={c} className="chip">{c}</span>)}</div>
                  <button onClick={() => toggle("bookmarks", b.id)} className={`p-2 rounded-full border ${saved ? "border-emerald text-emerald" : "border-line text-muted"}`} aria-pressed={saved} aria-label={saved ? `Remove ${b.name} bookmark` : `Bookmark ${b.name}`}>
                    <Icon name="bookmark" className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display text-xl font-semibold mt-4">{b.name}</h3>
                <p className="text-sm text-muted mt-2 flex-1">{b.overview}</p>
                <dl className="grid grid-cols-2 gap-3 mt-5 text-sm">
                  <div><dt className="text-xs text-muted">Est. start-up cost</dt><dd className="font-semibold">{b.investment}</dd></div>
                  <div><dt className="text-xs text-muted">Key skill</dt><dd className="font-semibold truncate">{b.skills[0]}</dd></div>
                </dl>
                <Link to={`/business/${b.id}`} className="mt-5 btn-ghost text-center text-sm">View full playbook</Link>
              </article>
            </Reveal>
          );
        })}
      </div>
      {list.length === 0 && <p className="text-muted mt-8">No ideas match these filters.</p>}
    </Page>
  );
}
