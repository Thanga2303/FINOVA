import { useEffect, useRef, useState } from "react";
import { cleanSym, getJSON } from "../../lib/api";
import { Icon } from "../ui";

type Hit = { symbol: string; name: string; exchange?: string; type?: string; sector?: string | null };

/** Searches NSE/BSE stocks and indices (Yahoo Finance search, via FINOVA's server). */
export default function StockSearch({ onPick, placeholder = "Search stocks (e.g. Infosys, TCS)" }: { onPick: (symbol: string, name: string) => void; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const id = setTimeout(() => {
      setBusy(true);
      getJSON<Hit[]>(`/api/market/search?q=${encodeURIComponent(q.trim())}`, 3600e3).then((h) => { setHits(h); setOpen(true); setSel(0); }).catch(() => setHits([])).finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const pick = (h: Hit) => { onPick(h.symbol, h.name); setQ(""); setOpen(false); };
  return (
    <div ref={box} className="relative">
      <div className="flex items-center gap-2 field !py-0">
        <Icon name="search" className="w-4 h-4 text-muted shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => hits.length && setOpen(true)} placeholder={placeholder} aria-label="Search stocks"
          className="bg-transparent outline-none py-2.5 w-full text-sm"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === "Enter" && hits[sel]) pick(hits[sel]);
            if (e.key === "Escape") setOpen(false);
          }} />
        {busy && <span className="w-4 h-4 rounded-full border-2 border-line border-t-cyan animate-spin shrink-0" />}
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-line bg-bg2 shadow-2xl p-1.5 max-h-80 overflow-y-auto scroll-thin">
          {hits.length === 0 && !busy && <div className="p-3 text-sm text-muted">No NSE/BSE matches.</div>}
          {hits.map((h, i) => (
            <button key={h.symbol} onMouseEnter={() => setSel(i)} onClick={() => pick(h)} className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between gap-3 ${i === sel ? "bg-card-strong" : ""}`}>
              <span className="min-w-0"><span className="block font-medium truncate">{h.name}</span><span className="block text-xs text-muted">{cleanSym(h.symbol)} · {h.exchange}{h.sector ? ` · ${h.sector}` : ""}</span></span>
              <span className="chip shrink-0">{h.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
