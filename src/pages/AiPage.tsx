import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calcText, detectCalc, isPlanningQuestion, planFor, planText, research, type CalcCard } from "../lib/aiTools";
import { offlineAnswer } from "../lib/tutor";
import { getState, markTool, setState, useStore } from "../lib/store";
import { walletContext } from "../lib/wallet";
import Markdown from "../components/Markdown";
import { Icon, inr, Page } from "../components/ui";
import { OrbLite, type OrbState } from "../components/OrbLite";
import { listen, speak, speechInputSupported, speechOutputSupported, stopSpeaking } from "../lib/voice";

const AiOrb = lazy(() => import("../three/AiOrb"));
const VKEY = "finova.voiceReplies";

type Mode = "learning" | "research" | "planner";
type Msg = { role: "user" | "assistant"; content: string; offline?: boolean; card?: CalcCard; mode?: Mode; source?: string };

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "learning", label: "Learning", desc: "Concepts, terms, charts, roadmaps, quizzes" },
  { id: "research", label: "Research", desc: "Company & fund data, news, risks" },
  { id: "planner", label: "Planner", desc: "Budget, savings and investment planning" },
];

const SUGGEST: Record<Mode, string[]> = {
  learning: ["What are mutual funds?", "Explain SIP with an example", "Difference between stocks and mutual funds", "How does compound interest work?", "What is an index fund?", "Explain the risks of intraday trading", "Give me a beginner roadmap", "Quiz me on P/E ratio"],
  research: ["Summarise Infosys fundamentals", "Explain HDFC Bank's fundamentals", "Explain Parag Parikh Flexi Cap fund", "Explain UTI Nifty 50 index fund", "Summarise today's market news"],
  planner: ["I earn ₹20,000 monthly. How should I manage my money?", "How much should I save every month?", "How much can I potentially invest?", "Should I build an emergency fund first?", "How can I achieve my ₹1 lakh savings goal in 12 months?", "Calculate my SIP if I invest ₹2,000 monthly for 10 years", "How do I start investing as a student?", "How can I reduce unnecessary expenses?"],
};

const WELCOME: Msg = { role: "assistant", content: "Hi, I'm **FINOVA AI**. Pick a mode above:\n\n- **Learning:** I explain concepts with examples and quizzes.\n- **Research:** I summarise real company and fund data with sources.\n- **Planner:** I analyse your income and expenses and suggest an educational monthly plan.\n\nCalculations use exact formulas, and projections are always hypothetical. I don't give stock tips, and FINOVA never moves your money." };
const KEY = "finova.chat.v2";

function CalcView({ c }: { c: CalcCard }) {
  if (c.type === "goal") {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[["Target", inr(c.target)], ["Months", String(c.months)], ["Per month", inr(c.monthly)]].map(([k, v]) => <div key={k} className="rounded-xl border border-line p-2"><div className="text-[11px] text-muted">{k}</div><div className="font-semibold">{v}</div></div>)}
      </div>
    );
  }
  return (
    <div className="mt-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Invested", inr(c.invested), "text-cyan"], ["Est. returns", inr(c.gains), "text-violet"], ["Est. value", inr(c.value), "text-emerald"]].map(([k, v, cl]) => <div key={k} className="rounded-xl border border-line p-2"><div className="text-[11px] text-muted">{k}</div><div className={`font-semibold ${cl}`}>{v}</div></div>)}
      </div>
      <div className="h-40 mt-2">
        <ResponsiveContainer>
          <AreaChart data={c.series}>
            <XAxis dataKey="year" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `Y${v}`} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 12 }} formatter={(v, n) => [inr(Number(v)), n === "value" ? "Estimated value" : "Invested"]} labelFormatter={(l) => `Year ${l}`} />
            <Area dataKey="invested" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.12} />
            <Area dataKey="value" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.18} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-amber mt-1">Hypothetical growth chart at {c.rate}% a year. Not a guaranteed return.</p>
    </div>
  );
}

export default function AiPage() {
  const [params, setParams] = useSearchParams();
  const consent = useStore((s) => s.consent);
  const [mode, setMode] = useState<Mode>(() => (["learning", "research", "planner"].includes(params.get("mode") ?? "") ? (params.get("mode") as Mode) : "learning"));
  const storage = () => (consent.aiRemembers ? localStorage : sessionStorage);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { const raw = (getStoreConsent() ? localStorage : sessionStorage).getItem(KEY); const s = raw && JSON.parse(raw); if (Array.isArray(s) && s.length) return s; } catch { /* ignore */ }
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const [voiceReplies, setVoiceReplies] = useState(() => { try { return localStorage.getItem(VKEY) === "1"; } catch { return false; } });
  const stopRef = useRef<() => void>(() => {});
  const level = useRef(0);
  const voiceRef = useRef(voiceReplies);
  voiceRef.current = voiceReplies;
  const orbState: OrbState = listening ? "listening" : speaking ? "speaking" : busy ? (mode === "research" ? "processing" : "thinking") : "idle";
  useEffect(() => () => { stopSpeaking(); stopRef.current(); }, []);

  function say(text: string) {
    if (!voiceRef.current || !speechOutputSupported()) return;
    speak(text, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false), onPulse: () => { level.current = 1; } });
  }
  function toggleMic() {
    if (listening) { stopRef.current(); return; }
    stopSpeaking(); setSpeaking(false); setVoiceErr(null); setListening(true);
    stopRef.current = listen({
      onInterim: (t) => setInput(t),
      onFinal: (t) => { if (!voiceRef.current) { setVoiceReplies(true); voiceRef.current = true; try { localStorage.setItem(VKEY, "1"); } catch { /* ignore */ } } send(t); },
      onEnd: () => setListening(false),
      onError: (m) => setVoiceErr(m),
    });
  }

  useEffect(() => { fetch("/api/health").then((r) => r.json()).then((j) => setProvider(j.ai)).catch(() => setProvider("offline")); }, []);
  useEffect(() => {
    try { storage().setItem(KEY, JSON.stringify(msgs.slice(-40))); if (!consent.aiRemembers) localStorage.removeItem(KEY); } catch { /* ignore */ }
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, consent.aiRemembers]);
  useEffect(() => {
    const q = params.get("q");
    if (q && !sentInitial.current) { sentInitial.current = true; setParams({ mode }, { replace: true }); send(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function llm(t: string, m: Mode, context: string, history: Msg[]) {
    if (provider === "offline") return null;
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, context, messages: [...history.filter((x) => x.content !== WELCOME.content).slice(-10).map(({ role, content }) => ({ role, content })), { role: "user", content: t }] }),
      });
      const j = await r.json().catch(() => ({}));
      return r.ok && j.reply ? (j.reply as string) : null;
    } catch { return null; }
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    markTool("ai");
    const history = msgs;
    setMsgs((m) => [...m, { role: "user", content: t, mode }]);
    setInput("");
    setBusy(true);
    const push = (msg: Msg) => { setMsgs((m) => [...m, { mode, ...msg }]); if (msg.role === "assistant") say(msg.content); };
    try {
      // 1) Exact calculators, in any mode.
      const calc = detectCalc(t);
      if (calc) { push({ role: "assistant", content: calcText(calc), card: calc, source: "FINOVA calculator (exact formula)" }); return; }

      // 2) Planner: deterministic plan, optionally explained further by the AI model.
      if (mode === "planner" || isPlanningQuestion(t)) {
        const useWallet = consent.aiUsesWallet;
        const { plan, input: pi, usedWallet } = planFor(t, useWallet);
        if (pi.income > 0) {
          const assumed = !/spend|expense/i.test(t) && !(usedWallet && pi.expenses > 0);
          push({ role: "assistant", content: planText(plan, pi, assumed, usedWallet), source: usedWallet ? "Your FINOVA Wallet data + FINOVA planner rules" : "FINOVA planner rules" });
          return;
        }
        const ctx = useWallet ? walletContext(getState()) : "";
        const reply = await llm(t, "planner", ctx, history);
        push(reply ? { role: "assistant", content: reply } : { role: "assistant", content: `${offlineAnswer(t)}\n\nTo get a personal plan, tell me your monthly income (for example “I earn ₹25,000 and spend ₹15,000”)${useWallet ? "" : ", or allow FINOVA AI to use your Wallet data below"}.`, offline: true });
        return;
      }

      // 3) Research: fetch real data, then summarise.
      if (mode === "research") {
        const r = await research(t).catch(() => null);
        if (!r) { push({ role: "assistant", content: "I couldn't find matching company or fund data. Try a name like “Summarise Infosys fundamentals” or “Explain Parag Parikh Flexi Cap fund”." }); return; }
        const reply = await llm(t, "research", r.context, history);
        push({ role: "assistant", content: reply ? `${reply}${r.link ? `\n\n[Open ${r.label}](${r.link})` : ""}` : r.summary, offline: !reply, source: "Real data from FINOVA's market and fund services" });
        return;
      }

      // 4) Learning.
      const reply = await llm(t, "learning", "", history);
      push(reply ? { role: "assistant", content: reply } : { role: "assistant", content: offlineAnswer(t), offline: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="min-w-0 glass rounded-3xl flex flex-col h-[calc(100vh-11rem)] min-h-[540px]">
          <header className="px-4 sm:px-5 py-4 border-b border-line">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <OrbLite state={orbState} size={40} />
                <div>
                  <h1 className="font-display text-lg font-semibold">FINOVA AI</h1>
                  <div className="text-xs text-muted"><span className="capitalize text-cyan">{orbState}</span> · {provider === null ? "Connecting…" : provider === "offline" ? "Offline mode: calculators, planner, research and lesson library" : "Online · education, not advice"}</div>
                </div>
              </div>
              <button className="chip" onClick={() => setMsgs([WELCOME])}>New chat</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-line p-1" role="tablist" aria-label="AI mode">
              {MODES.map((m) => (
                <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => { setMode(m.id); setParams({ mode: m.id }, { replace: true }); }} className={`rounded-xl px-2 py-1.5 text-left ${mode === m.id ? "bg-card-strong" : ""}`}>
                  <div className={`text-sm font-semibold ${mode === m.id ? "text-cyan" : ""}`}>{m.label}</div>
                  <div className="text-[10px] text-muted hidden sm:block">{m.desc}</div>
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto scroll-thin px-4 sm:px-6 py-5 space-y-4" aria-live="polite">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[15px] ${m.role === "user" ? "bg-gradient-to-br from-cyan/25 to-emerald/15 border border-cyan/30" : "bg-card-strong border border-line"}`}>
                    {m.role === "assistant" ? <Markdown text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
                    {m.card && <CalcView c={m.card} />}
                    {(m.source || m.offline) && <div className="text-[10px] text-faint mt-2">{m.source ?? "Offline answer from the FINOVA lesson library"}</div>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && <div className="flex gap-1.5 px-4 py-3 w-fit rounded-2xl bg-card-strong border border-line" aria-label="FINOVA AI is thinking">{[0, 1, 2].map((k) => <span key={k} className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />)}</div>}
            <div ref={end} />
          </div>

          <div className="px-4 sm:px-5 pt-3 pb-4 border-t border-line">
            <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
              {SUGGEST[mode].slice(0, 5).map((s) => <button key={s} onClick={() => send(s)} disabled={busy} className="chip shrink-0 hover:!text-text">{s}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 mt-1">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "planner" ? "e.g. I earn ₹30,000 and spend ₹15,000. How should I plan?" : mode === "research" ? "e.g. Summarise TCS fundamentals" : "Ask about any financial concept…"} className="field" aria-label="Your question" maxLength={2000} />
              {speechInputSupported() && (
                <button type="button" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Speak your question"} className={`btn-ghost !px-3 shrink-0 ${listening ? "!border-emerald !text-emerald" : ""}`}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                </button>
              )}
              <button className="btn-primary !px-4 shrink-0 disabled:opacity-50" disabled={busy || !input.trim()} aria-label="Send"><Icon name="send" className="w-5 h-5" /></button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4 hidden lg:block">
            <Suspense fallback={<div className="h-[220px] grid place-items-center"><OrbLite state={orbState} size={110} /></div>}>
              <AiOrb state={orbState} level={level} size={220} />
            </Suspense>
            <div className="text-center text-sm"><span className="font-semibold capitalize text-cyan">{orbState}</span><span className="text-muted"> · {listening ? "speak now" : speaking ? "reading the answer aloud" : busy ? "working on it" : "ready"}</span></div>
          </div>
          <div className="glass rounded-3xl p-5 space-y-3">
            <div className="font-semibold">Voice</div>
            {speechInputSupported() ? <p className="text-xs text-muted">Tap the mic next to the message box and ask your question out loud (English, India). Your browser handles speech recognition.</p> : <p className="text-xs text-muted">Voice input needs Chrome or Edge.</p>}
            {speechOutputSupported() && (
              <label className="flex items-center justify-between text-sm"><span>Read answers aloud</span><input type="checkbox" className="accent-[var(--cyan)] w-4 h-4" checked={voiceReplies} onChange={(e) => { setVoiceReplies(e.target.checked); try { localStorage.setItem(VKEY, e.target.checked ? "1" : "0"); } catch { /* ignore */ } if (!e.target.checked) { stopSpeaking(); setSpeaking(false); } }} /></label>
            )}
            {speaking && <button className="chip" onClick={() => { stopSpeaking(); setSpeaking(false); }}>Stop speaking</button>}
            {voiceErr && <p className="text-xs text-rose" role="alert">{voiceErr}</p>}
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="font-semibold mb-2">Your privacy choices</div>
            <label className="flex items-start gap-3 text-sm py-2">
              <input type="checkbox" className="accent-[var(--cyan)] mt-1" checked={consent.aiUsesWallet} onChange={(e) => setState((s) => ({ consent: { ...s.consent, aiUsesWallet: e.target.checked } }))} />
              <span>Let FINOVA AI use my Wallet summary (income, expenses, goals, debts) for personalised planning.<span className="block text-xs text-muted mt-0.5">Planner maths runs in your browser. If an online AI model is used for follow-up questions, a short summary (no notes) is sent to it.</span></span>
            </label>
            <label className="flex items-start gap-3 text-sm py-2">
              <input type="checkbox" className="accent-[var(--cyan)] mt-1" checked={consent.aiRemembers} onChange={(e) => setState((s) => ({ consent: { ...s.consent, aiRemembers: e.target.checked } }))} />
              <span>Remember this conversation on this device.<span className="block text-xs text-muted mt-0.5">Off: the chat is cleared when you close the tab.</span></span>
            </label>
            {consent.aiUsesWallet && <Link to="/wallet" className="text-xs text-cyan underline">Review your Wallet data</Link>}
          </div>
          <div className="rounded-3xl border border-amber/30 bg-amber/5 p-5 text-sm text-muted">
            <div className="font-semibold text-text mb-1">Education, not advice</div>
            FINOVA AI is not a SEBI-registered adviser. It doesn't recommend specific stocks or funds, predict prices, or promise returns, and it never invests or moves money. You approve every financial decision.
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="font-semibold mb-3">Try asking ({MODES.find((m) => m.id === mode)!.label})</div>
            <ul className="space-y-2">{SUGGEST[mode].map((s) => <li key={s}><button onClick={() => send(s)} disabled={busy} className="text-left text-sm text-muted hover:text-cyan">{s}</button></li>)}</ul>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function getStoreConsent() { try { return JSON.parse(localStorage.getItem("finova.v2") || "{}")?.consent?.aiRemembers === true; } catch { return false; } }
