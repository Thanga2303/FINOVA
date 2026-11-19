import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { offlineAnswer } from "../lib/tutor";
import { markTool } from "../lib/store";
import Markdown from "../components/Markdown";
import { Icon, Page } from "../components/ui";

type Msg = { role: "user" | "assistant"; content: string; offline?: boolean };

const SUGGESTIONS = [
  "What is SIP?",
  "Explain P/E ratio with an example",
  "Give me a beginner learning roadmap",
  "Difference between direct and regular mutual funds",
  "How does compounding work? Show the calculation",
  "Quiz me on stop-loss",
  "Summarise the lesson on asset allocation",
  "What is an IPO and how do I apply?",
];

const KEY = "finova.chat";
const WELCOME: Msg = {
  role: "assistant",
  content: "Hi, I'm **FINOVA AI**, your financial learning tutor. Ask me to explain a concept, walk through a calculation, build a learning roadmap, summarise a lesson or quiz you.\n\nI teach concepts; I don't give personal investment advice or stock tips.",
};

export default function AiPage() {
  const [params, setParams] = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { const s = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (Array.isArray(s) && s.length) return s; } catch { /* ignore */ }
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"openai" | "gemini" | "offline" | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((j) => setMode(j.ai)).catch(() => setMode("offline"));
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* ignore */ }
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);
  useEffect(() => {
    const q = params.get("q");
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      setParams({}, { replace: true });
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    markTool("ai");
    const history = [...msgs.filter((m) => m.content !== WELCOME.content), { role: "user" as const, content: t }];
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.reply) setMsgs((m) => [...m, { role: "assistant", content: j.reply }]);
      else throw new Error(j.error || "offline");
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: offlineAnswer(t), offline: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <section className="min-w-0 glass rounded-3xl flex flex-col h-[calc(100vh-9rem)] min-h-[520px]">
          <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl grid place-items-center bg-gradient-to-br from-cyan to-emerald text-[#04121c]"><Icon name="spark" className="w-5 h-5" /></div>
              <div>
                <h1 className="font-display text-lg font-semibold">FINOVA AI</h1>
                <div className="text-xs text-muted">
                  {mode === null ? "Connecting…" : mode === "offline" ? "Offline tutor mode (answers from FINOVA lessons)" : "Online · education, not advice"}
                </div>
              </div>
            </div>
            <button className="chip" onClick={() => setMsgs([WELCOME])}>New chat</button>
          </header>

          <div className="flex-1 overflow-y-auto scroll-thin px-4 sm:px-6 py-5 space-y-4" aria-live="polite">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] ${m.role === "user" ? "bg-gradient-to-br from-cyan/25 to-emerald/15 border border-cyan/30" : "bg-card-strong border border-line"}`}>
                    {m.role === "assistant" ? <Markdown text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
                    {m.offline && <div className="text-[10px] text-faint mt-2">Offline answer from the FINOVA lesson library</div>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && (
              <div className="flex gap-1.5 px-4 py-3 w-fit rounded-2xl bg-card-strong border border-line" aria-label="FINOVA AI is typing">
                {[0, 1, 2].map((k) => <span key={k} className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />)}
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="px-4 sm:px-5 pt-3 pb-4 border-t border-line">
            <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
              {SUGGESTIONS.slice(0, 5).map((s) => (
                <button key={s} onClick={() => send(s)} disabled={busy} className="chip shrink-0 hover:!text-text">{s}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 mt-1">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any financial concept…" className="field" aria-label="Your question" maxLength={2000} />
              <button className="btn-primary !px-4 shrink-0 disabled:opacity-50" disabled={busy || !input.trim()} aria-label="Send"><Icon name="send" className="w-5 h-5" /></button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-amber/30 bg-amber/5 p-5 text-sm text-muted">
            <div className="font-semibold text-text mb-1">Education, not advice</div>
            FINOVA AI explains financial concepts. It is not a SEBI-registered adviser, doesn't recommend specific stocks or funds and can make mistakes. Verify important facts and make your own decisions.
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="font-semibold mb-3">Try asking</div>
            <ul className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}><button onClick={() => send(s)} disabled={busy} className="text-left text-sm text-muted hover:text-cyan">{s}</button></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Page>
  );
}
