import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAccount } from "../lib/account";
import { Locked } from "../components/Membership";
import { Icon, Page } from "../components/ui";

type Item = { id: string; title: string; summary: string; minutes: number; topics: string[] };
type Full = Item & { sections: { h: string; p: string[] }[]; checklist: string[] };

export function MasterclassList() {
  const [data, setData] = useState<{ unlocked: boolean; items: Item[] } | null>(null);
  const { status } = useAccount();
  useEffect(() => { fetch("/api/content/masterclasses", { credentials: "same-origin" }).then((r) => r.json()).then(setData).catch(() => setData({ unlocked: false, items: [] })); }, [status?.plan.id]);
  return (
    <Page>
      <div className="text-xs font-semibold tracking-[0.25em] uppercase text-amber mb-3">FINOVA Elite</div>
      <h1 className="font-display text-4xl font-semibold">Masterclasses</h1>
      <p className="text-muted mt-2 max-w-2xl">Long-form, practical guides that go beyond the academy, with checklists you can reuse.</p>
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        {(data?.items ?? []).map((m) => (
          <Link key={m.id} to={`/learn/masterclasses/${m.id}`} className="glass rounded-3xl p-6 hover:border-amber/50 transition-colors">
            <div className="flex items-center justify-between"><span className="chip !text-amber">{m.minutes} min</span>{!data?.unlocked && <Icon name="shield" className="w-4 h-4 text-faint" />}</div>
            <h2 className="font-display text-xl font-semibold mt-4">{m.title}</h2>
            <p className="text-sm text-muted mt-2">{m.summary}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{m.topics.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          </Link>
        ))}
      </div>
      {data && !data.unlocked && <div className="mt-8"><Locked plan="elite" title="Unlock every masterclass" text="Masterclasses are included with FINOVA Elite (₹299/month)." /></div>}
    </Page>
  );
}

export function MasterclassView() {
  const { id = "" } = useParams();
  const { status } = useAccount();
  const [m, setM] = useState<Full | null>(null);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    fetch(`/api/content/masterclasses/${encodeURIComponent(id)}`, { credentials: "same-origin" }).then(async (r) => {
      if (r.status === 402) { setLocked(true); setM(null); return; }
      setLocked(false); setM(r.ok ? await r.json() : null);
    });
  }, [id, status?.plan.id]);
  return (
    <Page>
      <nav className="text-sm text-muted"><Link to="/learn/masterclasses" className="hover:text-text">Masterclasses</Link></nav>
      {locked && <div className="mt-6"><Locked plan="elite" title="This masterclass is part of FINOVA Elite" text="Upgrade to read the full guide and checklist." /></div>}
      {m && (
        <article className="mt-6 max-w-3xl">
          <span className="chip !text-amber">Elite · {m.minutes} min read</span>
          <h1 className="font-display text-4xl font-semibold mt-4 leading-tight">{m.title}</h1>
          <p className="text-lg text-muted mt-3">{m.summary}</p>
          {m.sections.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
              {s.p.map((p, i) => <p key={i} className="mt-3 text-[17px] leading-relaxed">{p}</p>)}
            </section>
          ))}
          <section className="mt-10 rounded-3xl border border-amber/30 bg-amber/5 p-6">
            <h2 className="font-semibold">Checklist</h2>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">{m.checklist.map((c) => <li key={c} className="flex gap-2"><Icon name="check" className="w-4 h-4 text-emerald shrink-0 mt-0.5" />{c}</li>)}</ul>
          </section>
          <p className="text-xs text-faint mt-6">Educational content, not investment advice.</p>
        </article>
      )}
    </Page>
  );
}
