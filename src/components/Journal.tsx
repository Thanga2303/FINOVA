import { useMemo, useState } from "react";
import { cleanSym } from "../lib/api";
import { useAccount } from "../lib/account";
import { uid, useStore } from "../lib/store";
import { Locked } from "./Membership";
import { Icon } from "./ui";

/** Trading journal. Entries are the member's own notes, kept in this browser. Plan limits come from the server. */
type Entry = { id: string; date: string; symbol: string; side: "BUY" | "SELL" | "WATCH"; note: string; setup?: string; emotion?: string; lesson?: string; rating?: number };
const KEY = "finova.journal";
const SETUPS = ["Breakout", "Pullback", "Support bounce", "Trend follow", "Long-term value", "Other"];
const EMOTIONS = ["Calm", "Confident", "Anxious", "Greedy", "Fearful", "Impatient"];

function load(): Entry[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(e: Entry[]) { try { localStorage.setItem(KEY, JSON.stringify(e)); } catch { /* ignore */ } }

export default function Journal() {
  const { features } = useAccount();
  const full = features.journal === "full";
  const limit = features.journalLimit;
  const allOrders = useStore((s) => s.paper.orders); // stable reference; derive below (a new array here would loop)
  const orders = useMemo(() => allOrders.filter((o) => o.status === "EXECUTED").slice(0, 30), [allOrders]);
  const [entries, setEntries] = useState<Entry[]>(load);
  const blank: Entry = { id: "", date: new Date().toLocaleDateString("en-CA"), symbol: "", side: "BUY", note: "", setup: "", emotion: "", lesson: "", rating: 0 };
  const [f, setF] = useState<Entry>(blank);
  const atLimit = limit != null && entries.length >= limit;
  const update = (list: Entry[]) => { setEntries(list); save(list); };

  const stats = useMemo(() => {
    const by = (k: "setup" | "emotion") => Object.entries(entries.reduce<Record<string, number>>((m, e) => { if (e[k]) m[e[k]!] = (m[e[k]!] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
    const rated = entries.filter((e) => e.rating);
    return { setups: by("setup"), emotions: by("emotion"), avgRating: rated.length ? rated.reduce((a, e) => a + (e.rating ?? 0), 0) / rated.length : null };
  }, [entries]);

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
      <section className="glass rounded-3xl p-5">
        <h3 className="font-semibold">New journal entry</h3>
        <p className="text-xs text-muted mb-3">{full ? "Full journal: setups, emotions, lessons and ratings." : `Basic journal: ${entries.length}/${limit} entries used.`}</p>
        {atLimit ? <Locked compact plan="pro" title="Journal limit reached" text="FINOVA Pro unlocks an unlimited journal with setups, emotions and review stats." /> : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!f.symbol.trim() || !f.note.trim()) return; update([{ ...f, id: uid(), symbol: f.symbol.trim().toUpperCase().slice(0, 24), note: f.note.slice(0, 1000) }, ...entries]); setF(blank); }}>
            {orders.length > 0 && (
              <label className="block text-sm"><span className="text-muted">From a paper order (optional)</span>
                <select className="field mt-1" value="" onChange={(e) => { const o = orders.find((x) => x.id === e.target.value); if (o) setF({ ...f, symbol: o.kind === "stock" ? cleanSym(o.symbol) : o.name.split(" - ")[0], side: o.side }); }}>
                  <option value="">Choose an order…</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.side} {o.kind === "stock" ? cleanSym(o.symbol) : o.name.split(" - ")[0]} · {new Date(o.executedAt ?? o.placedAt).toLocaleDateString("en-IN")}</option>)}
                </select>
              </label>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm"><span className="text-muted">Symbol</span><input className="field mt-1" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} placeholder="INFY" required /></label>
              <label className="text-sm"><span className="text-muted">Action</span><select className="field mt-1" value={f.side} onChange={(e) => setF({ ...f, side: e.target.value as Entry["side"] })}><option>BUY</option><option>SELL</option><option>WATCH</option></select></label>
            </div>
            <label className="block text-sm"><span className="text-muted">Why? What's the plan?</span><textarea className="field mt-1 min-h-20" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={1000} required /></label>
            {full && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm"><span className="text-muted">Setup</span><select className="field mt-1" value={f.setup} onChange={(e) => setF({ ...f, setup: e.target.value })}><option value="">—</option>{SETUPS.map((s) => <option key={s}>{s}</option>)}</select></label>
                  <label className="text-sm"><span className="text-muted">Emotion</span><select className="field mt-1" value={f.emotion} onChange={(e) => setF({ ...f, emotion: e.target.value })}><option value="">—</option>{EMOTIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
                </div>
                <label className="block text-sm"><span className="text-muted">Lesson learned</span><input className="field mt-1" value={f.lesson} onChange={(e) => setF({ ...f, lesson: e.target.value })} maxLength={300} /></label>
                <div className="text-sm"><span className="text-muted">How well did you follow your plan?</span>
                  <div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setF({ ...f, rating: n })} aria-label={`${n} of 5`} className={`w-8 h-8 rounded-lg border ${(f.rating ?? 0) >= n ? "border-amber bg-amber/20 text-amber" : "border-line text-muted"}`}>★</button>)}</div>
                </div>
              </>
            )}
            <button className="btn-primary w-full">Save entry</button>
          </form>
        )}
      </section>
      <div className="space-y-6 min-w-0">
        {full ? (
          entries.length > 0 && (
            <section className="glass rounded-3xl p-5 grid sm:grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-muted">Entries</div><div className="font-display text-2xl font-semibold">{entries.length}</div></div>
              <div><div className="text-xs text-muted">Most used setup</div><div className="font-semibold">{stats.setups[0]?.[0] ?? "—"}</div></div>
              <div><div className="text-xs text-muted">Avg. plan discipline</div><div className="font-semibold">{stats.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : "—"}</div></div>
              {stats.emotions.length > 0 && <div className="sm:col-span-3 text-xs text-muted">Emotions logged: {stats.emotions.map(([k, v]) => `${k} (${v})`).join(" · ")}</div>}
            </section>
          )
        ) : <Locked compact plan="pro" title="Journal review stats" text="Pro adds setups, emotions, lessons, discipline ratings and review statistics." />}
        <section className="glass rounded-3xl p-5">
          <h3 className="font-semibold mb-3">Entries</h3>
          {entries.length === 0 ? <p className="text-sm text-muted">No entries yet. Journal each paper trade: why you entered, your plan, and what you learned.</p> : (
            <ul className="divide-y divide-line">{entries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`chip ${e.side === "BUY" ? "!text-emerald" : e.side === "SELL" ? "!text-rose" : ""}`}>{e.side}</span>
                  <span className="font-semibold">{e.symbol}</span><span className="text-xs text-faint">{e.date}</span>
                  {e.setup && <span className="chip">{e.setup}</span>}{e.emotion && <span className="chip">{e.emotion}</span>}{e.rating ? <span className="text-amber text-xs">{"★".repeat(e.rating)}</span> : null}
                  <button className="ml-auto text-xs text-muted hover:text-rose" onClick={() => update(entries.filter((x) => x.id !== e.id))} aria-label="Delete entry"><Icon name="close" className="w-4 h-4" /></button>
                </div>
                <p className="text-sm mt-1.5 whitespace-pre-wrap">{e.note}</p>
                {e.lesson && <p className="text-xs text-muted mt-1">Lesson: {e.lesson}</p>}
              </li>
            ))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
