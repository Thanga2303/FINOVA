/** Browser voice features for FINOVA AI. Speech is processed by the browser's own speech service. */

type Rec = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function speechInputSupported() {
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
export const speechOutputSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Starts listening once. Calls onInterim with partial text, onFinal with the full sentence. Returns a stop function. */
export function listen({ onInterim, onFinal, onEnd, onError }: { onInterim: (t: string) => void; onFinal: (t: string) => void; onEnd: () => void; onError: (msg: string) => void }) {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) { onError("Voice input isn't supported in this browser. Try Chrome or Edge."); onEnd(); return () => {}; }
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let final = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    onInterim((final + " " + interim).trim());
  };
  rec.onerror = (e) => onError(e.error === "not-allowed" ? "Microphone permission was denied." : e.error === "no-speech" ? "I didn't hear anything. Tap the mic and try again." : `Voice input error: ${e.error}`);
  rec.onend = () => { if (final.trim()) onFinal(final.trim()); onEnd(); };
  try { rec.start(); } catch { onEnd(); }
  return () => { try { rec.stop(); } catch { /* ignore */ } };
}

/** Converts a markdown reply into natural speech text (no symbols, links or tables). */
export function toSpeech(md: string) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#`>|]/g, "")
    .replace(/₹\s?([\d,]+)/g, "rupees $1")
    .replace(/\bP\/E\b/g, "P E")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\.\s*\./g, ".")
    .slice(0, 900);
}

let voiceCache: SpeechSynthesisVoice | null = null;
function pickVoice() {
  if (voiceCache) return voiceCache;
  const vs = window.speechSynthesis.getVoices();
  voiceCache = vs.find((v) => /en-IN/i.test(v.lang) && /natural|online/i.test(v.name)) ?? vs.find((v) => /en-IN/i.test(v.lang)) ?? vs.find((v) => /en-(GB|US)/i.test(v.lang) && /natural|online/i.test(v.name)) ?? vs.find((v) => /^en/i.test(v.lang)) ?? null;
  return voiceCache;
}

/** Speaks text. onPulse fires on word boundaries so the orb can pulse with the voice. */
export function speak(text: string, { onStart, onEnd, onPulse }: { onStart?: () => void; onEnd?: () => void; onPulse?: () => void } = {}) {
  if (!speechOutputSupported()) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSpeech(text));
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-IN";
  u.rate = 1.02;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  u.onboundary = () => onPulse?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechOutputSupported()) window.speechSynthesis.cancel();
}
