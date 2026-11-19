import { useSyncExternalStore } from "react";

/** Learner progress, saved in this browser (localStorage). */
export type Trade = { id: string; symbol: string; side: "BUY" | "SELL"; qty: number; price: number; time: number; pnl?: number };
export type Position = { symbol: string; qty: number; avg: number };

export type State = {
  name: string;
  theme: "dark" | "light";
  xp: number;
  completed: Record<string, number>; // lessonId -> completed at (ms)
  quiz: Record<string, { score: number; total: number }>;
  bookmarks: string[]; // business idea ids
  savedVideos: string[]; // lesson ids whose video was saved
  activeDays: string[]; // YYYY-MM-DD
  challengesDone: string[]; // YYYY-MM-DD
  badges: string[];
  usedTools: string[];
  sim: { cash: number; positions: Position[]; history: Trade[]; equity: { t: number; v: number }[] };
};

export const START_CASH = 1_000_000;

const KEY = "finova.v2";
const fresh = (): State => ({
  name: "",
  theme: "dark",
  xp: 0,
  completed: {},
  quiz: {},
  bookmarks: [],
  savedVideos: [],
  activeDays: [],
  challengesDone: [],
  badges: [],
  usedTools: [],
  sim: { cash: START_CASH, positions: [], history: [], equity: [] },
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* storage blocked */
  }
  return fresh();
}

let state = load();
const subs = new Set<() => void>();

export function getState() {
  return state;
}
export function setState(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  state = { ...state, badges: computeBadges(state) };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => sel(state),
  );
}
export function resetProgress() {
  const keep = { name: state.name, theme: state.theme };
  state = { ...fresh(), ...keep };
  setState(() => ({}));
}

export const today = () => new Date().toLocaleDateString("en-CA");

export function markActive() {
  const d = today();
  if (!state.activeDays.includes(d)) setState((s) => ({ activeDays: [...s.activeDays, d].slice(-400) }));
}

export function streak(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  if (!set.has(d.toLocaleDateString("en-CA"))) d.setDate(d.getDate() - 1);
  while (set.has(d.toLocaleDateString("en-CA"))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function completeLesson(id: string) {
  markActive();
  if (state.completed[id]) return;
  setState((s) => ({ completed: { ...s.completed, [id]: Date.now() }, xp: s.xp + 20 }));
}

export function recordQuiz(id: string, score: number, total: number) {
  markActive();
  const prev = state.quiz[id]?.score ?? 0;
  const gained = Math.max(0, score - prev) * 10;
  setState((s) => ({ quiz: { ...s.quiz, [id]: { score: Math.max(score, prev), total } }, xp: s.xp + gained }));
}

export function markTool(tool: string) {
  if (!state.usedTools.includes(tool)) setState((s) => ({ usedTools: [...s.usedTools, tool], xp: s.xp + 5 }));
}

export function toggle(list: "bookmarks" | "savedVideos", id: string) {
  setState((s) => ({ [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id] }) as Partial<State>);
}

export function finishChallenge() {
  const d = today();
  if (state.challengesDone.includes(d)) return;
  markActive();
  setState((s) => ({ challengesDone: [...s.challengesDone, d], xp: s.xp + 30 }));
}

export const LEVELS = [
  { name: "Beginner", min: 0 },
  { name: "Explorer", min: 200 },
  { name: "Analyst", min: 600 },
  { name: "Strategist", min: 1200 },
  { name: "Finance Master", min: 2000 },
];
export function levelFor(xp: number) {
  let i = 0;
  LEVELS.forEach((l, j) => {
    if (xp >= l.min) i = j;
  });
  const next = LEVELS[i + 1];
  const pct = next ? (xp - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { level: LEVELS[i], index: i, next, pct };
}

export const BADGES: { id: string; name: string; desc: string; icon: string }[] = [
  { id: "first-lesson", name: "First Step", desc: "Complete your first lesson", icon: "1" },
  { id: "five-lessons", name: "Bookworm", desc: "Complete 5 lessons", icon: "5" },
  { id: "twenty-lessons", name: "Scholar", desc: "Complete 20 lessons", icon: "20" },
  { id: "perfect-quiz", name: "Sharp Mind", desc: "Score full marks on a quiz", icon: "Q" },
  { id: "streak-3", name: "On a Roll", desc: "Learn 3 days in a row", icon: "3d" },
  { id: "planner", name: "Planner", desc: "Use a financial calculator", icon: "%" },
  { id: "first-trade", name: "Paper Trader", desc: "Place a simulated trade", icon: "T" },
  { id: "founder", name: "Founder Mindset", desc: "Bookmark a business idea", icon: "B" },
  { id: "curious", name: "Curious", desc: "Ask FINOVA AI a question", icon: "AI" },
];

function computeBadges(s: State): string[] {
  const n = Object.keys(s.completed).length;
  const b = new Set(s.badges);
  if (n >= 1) b.add("first-lesson");
  if (n >= 5) b.add("five-lessons");
  if (n >= 20) b.add("twenty-lessons");
  if (Object.values(s.quiz).some((q) => q.total > 0 && q.score === q.total)) b.add("perfect-quiz");
  if (streak(s.activeDays) >= 3) b.add("streak-3");
  if (s.usedTools.some((t) => t.startsWith("calc"))) b.add("planner");
  if (s.sim.history.length > 0) b.add("first-trade");
  if (s.bookmarks.length > 0) b.add("founder");
  if (s.usedTools.includes("ai")) b.add("curious");
  return [...b];
}

export function applyTheme(t: "dark" | "light") {
  document.documentElement.dataset.theme = t;
}
