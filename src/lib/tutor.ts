import { academies, allLessons, lessonPath } from "../data";
import type { Lesson } from "../data/types";

/** Offline FINOVA AI: answers from FINOVA's own lesson library when no AI key is configured on the server. */
const SYN: Record<string, string> = {
  "systematic investment plan": "sip", "price to earnings": "pe ratio", "p/e": "pe ratio", "pe": "pe ratio",
  "earnings per share": "eps", "net asset value": "nav", "relative strength": "rsi", "initial public offering": "ipo",
  "f&o": "options futures", "fno": "options futures", "derivatives": "options futures", "demat": "demat account",
  "mf": "mutual fund", "etf": "index funds", "stoploss": "stop-loss", "stop loss": "stop-loss", "idcw": "growth vs idcw",
  "dividend option": "growth vs idcw", "ter": "expense ratio", "retire": "retirement planning", "tax": "tax basics",
  "ltcg": "tax basics", "stcg": "tax basics", "emergency": "emergency fund", "compound": "compounding",
};

const STOP = new Set("what is are the a an of to in how do does i me my and or for with about explain tell why can you on it this that be should".split(" "));

function score(l: Lesson, words: string[]) {
  const t = l.title.toLowerCase(), s = (l.summary + " " + l.points.join(" ")).toLowerCase(), id = l.id.replace(/-/g, " ");
  let n = 0;
  words.forEach((w) => {
    if (t.includes(w) || id.includes(w)) n += 3;
    else if (s.includes(w)) n += 1;
  });
  return n;
}

export function findLesson(text: string): Lesson | undefined {
  let q = text.toLowerCase();
  Object.entries(SYN).forEach(([k, v]) => { if (q.includes(k)) q += " " + v; });
  const words = q.replace(/[^a-z0-9&/ -]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return;
  const ranked = allLessons.map((l) => [l, score(l, words)] as const).sort((a, b) => b[1] - a[1]);
  return ranked[0][1] >= 3 ? ranked[0][0] : undefined;
}

export function offlineAnswer(text: string): string {
  const t = text.toLowerCase();
  if (/\b(should i|which (stock|fund|share)|best (stock|fund|share)|buy or sell|tip|target price|will .* go up)\b/.test(t)) {
    return "I can't recommend specific stocks or funds or predict prices. FINOVA is for education, not personalised advice.\n\nWhat I can do is help you learn how to evaluate them yourself:\n- **Stocks:** fundamental analysis, P/E ratio, EPS and risk management.\n- **Mutual funds:** how to evaluate and compare funds, expense ratio, riskometer.\n\nFor personal advice, consult a SEBI-registered investment adviser.";
  }
  if (/roadmap|where (do|should) i start|beginner path|learning path|study plan/.test(t)) {
    const pick = (id: string) => academies.find((a) => a.id === id)!.lessons.filter((l) => l.level === "Beginner").slice(0, 4).map((l) => `- ${l.title}`).join("\n");
    return `Here's a 4-week beginner roadmap:\n\n**Week 1 – Money basics**\n${["emergency-fund", "inflation", "compounding", "financial-goals"].map((id) => `- ${allLessons.find((l) => l.id === id)!.title}`).join("\n")}\n\n**Week 2 – Stock market basics**\n${pick("stocks")}\n\n**Week 3 – Mutual funds**\n${pick("mutual-funds")}\n\n**Week 4 – Investing habits**\n- Asset allocation\n- Risk tolerance\n- Diversification\n- Try the SIP calculator and the paper-trading simulator\n\nDo one lesson a day and take each quiz to earn XP.`;
  }
  const lesson = findLesson(text);
  if (!lesson) {
    return "I couldn't find that in FINOVA's lesson library. Try asking about a specific term, for example “What is SIP?”, “Explain P/E ratio”, “What is a Demat account?” or “Give me a beginner roadmap”.\n\n(FINOVA AI is running in offline mode. Add an AI key on the server for open-ended answers.)";
  }
  if (/quiz|test me|practice question/.test(t)) {
    return `**Practice quiz: ${lesson.title}**\n\n${lesson.quiz.map((qq, i) => `${i + 1}. ${qq.q}\n${qq.options.map((o, j) => `   ${String.fromCharCode(97 + j)}) ${o}`).join("\n")}`).join("\n\n")}\n\n**Answers:** ${lesson.quiz.map((qq, i) => `${i + 1}) ${qq.options[qq.answer]}`).join(" · ")}`;
  }
  if (/summar/.test(t)) {
    return `**Summary: ${lesson.title}**\n\n${lesson.summary}\n\n${lesson.points.map((p) => `- ${p}`).join("\n")}\n\n[Open the full lesson](${lessonPath(lesson)})`;
  }
  return `**${lesson.title}**\n\n${lesson.body[0]}\n\n**Example:** ${lesson.example}\n\n**Key points**\n${lesson.points.map((p) => `- ${p}`).join("\n")}\n\n[Open the full lesson with a video and quiz](${lessonPath(lesson)})\n\n_Education only, not investment advice._`;
}
