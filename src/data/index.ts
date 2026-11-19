import { stockLessons } from "./stocks";
import { mfLessons } from "./mutualFunds";
import { tradingLessons } from "./trading";
import { investmentLessons } from "./investments";
import { businessIdeas } from "./business";
import type { Academy, AcademyId, Lesson } from "./types";

export const academies: Academy[] = [
  { id: "stocks", name: "Stock Market Academy", tagline: "From “what is a share?” to portfolio construction.", accent: "var(--cyan)", lessons: stockLessons },
  { id: "mutual-funds", name: "Mutual Fund Academy", tagline: "SIPs, NAV, fund types and how to choose a fund.", accent: "var(--emerald)", lessons: mfLessons },
  { id: "trading", name: "Trading Academy", tagline: "Charts, indicators, risk and a paper-trading simulator.", accent: "var(--violet)", lessons: tradingLessons },
  { id: "investments", name: "Investment Academy", tagline: "Compounding, allocation, goals, retirement and tax.", accent: "var(--amber)", lessons: investmentLessons },
];

export const allLessons: Lesson[] = academies.flatMap((a) => a.lessons);
export const academyById = (id: string) => academies.find((a) => a.id === id);
export const lessonById = (id: string) => allLessons.find((l) => l.id === id);
export const lessonPath = (l: Lesson) => `/learn/${l.academy}/${l.id}`;
export const academyPath = (id: AcademyId) => `/learn/${id}`;

export function nextLesson(l: Lesson): Lesson | undefined {
  const list = academyById(l.academy)!.lessons;
  const i = list.findIndex((x) => x.id === l.id);
  return list[i + 1];
}
export function prevLesson(l: Lesson): Lesson | undefined {
  const list = academyById(l.academy)!.lessons;
  const i = list.findIndex((x) => x.id === l.id);
  return i > 0 ? list[i - 1] : undefined;
}

export const youtubeSearchUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

/** Trusted Indian investor-education sources. Links are to the official sites. */
export const trustedSources = [
  { name: "Zerodha Varsity", url: "https://zerodha.com/varsity/", note: "Free modules from markets basics to options" },
  { name: "SEBI Investor Website", url: "https://investor.sebi.gov.in/", note: "The regulator's investor education portal" },
  { name: "NSE India", url: "https://www.nseindia.com/", note: "Official site of the National Stock Exchange, with investor resources" },
  { name: "BSE Investor Protection Fund", url: "https://www.bseindia.com/static/ipf/about/", note: "BSE's investor awareness programmes" },
  { name: "NISM", url: "https://www.nism.ac.in/", note: "National Institute of Securities Markets" },
  { name: "AMFI – Mutual Funds Sahi Hai", url: "https://www.mutualfundssahihai.com/", note: "Mutual fund industry investor corner" },
];

export const trending = ["sip", "what-is-ipo", "index-funds", "pe-ratio", "options-futures", "compounding", "tax-basics", "rsi"];
export const recentlyAdded = ["institutional-investing", "compare-mf", "macd", "retirement-planning", "market-psychology", "growth-vs-idcw"];

export type SearchHit = { kind: "Lesson" | "Business idea" | "Video" | "Module" | "Tool"; title: string; sub: string; to: string };

const tools: SearchHit[] = [
  { kind: "Tool", title: "SIP calculator", sub: "Mutual Fund Academy", to: "/learn/mutual-funds#tools" },
  { kind: "Tool", title: "Lump-sum calculator", sub: "Mutual Fund Academy", to: "/learn/mutual-funds#tools" },
  { kind: "Tool", title: "Compounding & 3D wealth growth", sub: "Investment Academy", to: "/learn/investments#tools" },
  { kind: "Tool", title: "Inflation calculator", sub: "Investment Academy", to: "/learn/investments#tools" },
  { kind: "Tool", title: "Emergency fund planner", sub: "Investment Academy", to: "/learn/investments#tools" },
  { kind: "Tool", title: "Retirement planner", sub: "Investment Academy", to: "/learn/investments#tools" },
  { kind: "Tool", title: "Paper-trading simulator", sub: "Trading Academy", to: "/learn/trading#simulator" },
  { kind: "Tool", title: "Risk-reward calculator", sub: "Trading Academy", to: "/learn/trading#tools" },
  { kind: "Tool", title: "Candlestick chart practice", sub: "Trading Academy", to: "/learn/trading#tools" },
];

export function search(term: string): SearchHit[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const words = t.split(/\s+/);
  const match = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  const hits: SearchHit[] = [];
  academies.forEach((a) => {
    if (match(a.name + " " + a.tagline)) hits.push({ kind: "Module", title: a.name, sub: a.tagline, to: `/learn/${a.id}` });
  });
  allLessons.forEach((l) => {
    if (match(l.title + " " + l.summary + " " + l.points.join(" "))) hits.push({ kind: "Lesson", title: l.title, sub: `${academyById(l.academy)!.name} · ${l.level}`, to: lessonPath(l) });
  });
  businessIdeas.forEach((b) => {
    if (match(b.name + " " + b.overview + " " + b.categories.join(" "))) hits.push({ kind: "Business idea", title: b.name, sub: b.categories.join(" · "), to: `/business/${b.id}` });
  });
  allLessons.forEach((l) => {
    if (match(l.video + " " + l.title)) hits.push({ kind: "Video", title: `Video: ${l.title}`, sub: "Video Library", to: `/learn/videos?topic=${l.id}` });
  });
  tools.forEach((x) => match(x.title + " " + x.sub) && hits.push(x));
  return hits.slice(0, 30);
}

export { businessIdeas };
