import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { search } from "../data";
import { Icon } from "./ui";

const SUGGEST = ["SIP", "P/E ratio", "Demat", "RSI", "index fund", "AI business", "emergency fund", "options"];

export default function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const hits = useMemo(() => search(term), [term]);

  useEffect(() => {
    if (open) {
      setTerm("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => setSel(0), [term]);

  const go = (to: string) => {
    onClose();
    nav(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label="Search FINOVA"
            initial={{ y: -20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.98 }}
            className="w-full max-w-2xl rounded-2xl border border-line bg-bg2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Icon name="search" className="w-5 h-5 text-muted" />
              <input
                ref={input}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && hits[sel]) go(hits[sel].to);
                }}
                placeholder="Search lessons, funds, trading terms, business ideas, videos…"
                className="flex-1 bg-transparent py-4 outline-none text-base"
                aria-label="Search"
              />
              <kbd className="text-[10px] border border-line rounded px-1.5 py-0.5 text-muted">Esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scroll-thin p-2">
              {!term && (
                <div className="p-3">
                  <div className="text-xs text-muted mb-2">Try</div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGEST.map((s) => (
                      <button key={s} className="chip hover:!text-text" onClick={() => setTerm(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {term && hits.length === 0 && <div className="p-6 text-center text-muted text-sm">No results for “{term}”. Try asking FINOVA AI instead.</div>}
              {hits.map((h, i) => (
                <button
                  key={h.kind + h.to + h.title}
                  onClick={() => go(h.to)}
                  onMouseEnter={() => setSel(i)}
                  className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === sel ? "bg-card-strong" : ""}`}
                >
                  <span className="chip shrink-0 w-24 justify-center">{h.kind}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{h.title}</span>
                    <span className="block truncate text-xs text-muted">{h.sub}</span>
                  </span>
                </button>
              ))}
              {term && (
                <button onClick={() => go(`/ai?q=${encodeURIComponent(term)}`)} className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 text-cyan hover:bg-card-strong">
                  <Icon name="spark" className="w-4 h-4" /> Ask FINOVA AI: “{term}”
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
