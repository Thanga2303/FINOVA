// FINOVA API server: AI tutor + YouTube video search, and serves the built app from dist/.
// Keys are read from .env on the server only and never sent to the browser.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });
const app = express();
app.use(cors({ origin: [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] }));
app.use(express.json({ limit: "64kb" }));

const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim();
const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();
const YT_KEY = process.env.YOUTUBE_API_KEY?.trim();
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

const SYSTEM = `You are FINOVA AI, a friendly financial EDUCATION tutor for Indian learners.
- Explain concepts in simple language with a short practical example in Indian rupees (₹).
- Use short paragraphs or bullet points; keep answers under about 220 words unless asked for more.
- You may create learning roadmaps, lesson summaries, practice quizzes (with answers at the end) and walk through calculations step by step.
- You are NOT a SEBI-registered investment adviser. Never recommend specific stocks, funds or trades to buy or sell, never predict prices, never promise returns.
  If asked for personal investment advice, explain the concepts that would help them decide and suggest consulting a SEBI-registered adviser.
- If you are unsure or a rule may have changed (tax, regulations), say so and point to official sources (SEBI, AMFI, Income Tax Department).
- End answers that touch on investing with a one-line reminder that this is education, not advice.`;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ai: openai ? "openai" : GEMINI_KEY ? "gemini" : "offline", youtube: Boolean(YT_KEY) });
});

async function askOpenAI(messages) {
  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "system", content: SYSTEM }, ...messages],
    max_tokens: 700,
    temperature: 0.4,
  });
  return r.choices[0]?.message?.content?.trim();
}

async function askGemini(messages) {
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
}

app.post("/api/chat", async (req, res) => {
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Please enter a question." });
  }
  const providers = [];
  if (openai) providers.push(["openai", askOpenAI]);
  if (GEMINI_KEY) providers.push(["gemini", askGemini]);
  for (const [name, fn] of providers) {
    try {
      const reply = await fn(messages);
      if (reply) return res.json({ reply, provider: name });
    } catch (e) {
      console.error(`[chat] ${name} failed:`, e?.message || e);
    }
  }
  res.status(503).json({ offline: true, error: providers.length ? "The AI service is busy right now." : "No AI key configured." });
});

// ---------- YouTube video search ----------
const TRUSTED = ["zerodha varsity", "zerodha", "sebi", "nse india", "nseindia", "bse india", "nism", "amfi", "mutual funds sahi hai"];
const cache = new Map();

function isoDuration(d = "") {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [h, mi, s] = [m[1], m[2], m[3]].map((x) => Number(x || 0));
  return h ? `${h}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${mi}:${String(s).padStart(2, "0")}`;
}

app.get("/api/videos", async (req, res) => {
  const q = String(req.query.q || "").slice(0, 160).trim();
  if (!q) return res.status(400).json({ error: "Missing q" });
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  if (!YT_KEY) return res.json({ source: "search", searchUrl, videos: [] });
  if (cache.has(q)) return res.json(cache.get(q));
  try {
    const s = new URL("https://www.googleapis.com/youtube/v3/search");
    Object.entries({ part: "snippet", type: "video", q, maxResults: "8", safeSearch: "strict", relevanceLanguage: "en", regionCode: "IN", videoEmbeddable: "true", key: YT_KEY })
      .forEach(([k, v]) => s.searchParams.set(k, v));
    const sr = await fetch(s, { signal: AbortSignal.timeout(10000) });
    if (!sr.ok) throw new Error(`search ${sr.status}`);
    const sj = await sr.json();
    const ids = (sj.items || []).map((i) => i.id?.videoId).filter(Boolean);
    if (!ids.length) return res.json({ source: "search", searchUrl, videos: [] });
    const v = new URL("https://www.googleapis.com/youtube/v3/videos");
    Object.entries({ part: "snippet,contentDetails", id: ids.join(","), key: YT_KEY }).forEach(([k, val]) => v.searchParams.set(k, val));
    const vr = await fetch(v, { signal: AbortSignal.timeout(10000) });
    if (!vr.ok) throw new Error(`videos ${vr.status}`);
    const vj = await vr.json();
    const videos = (vj.items || []).map((it) => ({
      id: it.id,
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      description: (it.snippet.description || "").split("\n")[0].slice(0, 180),
      thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url,
      duration: isoDuration(it.contentDetails?.duration),
      url: `https://www.youtube.com/watch?v=${it.id}`,
      trusted: TRUSTED.some((t) => it.snippet.channelTitle.toLowerCase().includes(t)),
    }));
    videos.sort((a, b) => Number(b.trusted) - Number(a.trusted));
    const out = { source: "youtube", searchUrl, videos: videos.slice(0, 4) };
    cache.set(q, out);
    res.json(out);
  } catch (e) {
    console.error("[videos]", e?.message || e);
    res.json({ source: "search", searchUrl, videos: [], note: "YouTube API unavailable" });
  }
});

// ---------- Static app ----------
const dist = path.join(__dirname, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: "1h", index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "127.0.0.1", () => {
  console.log(`FINOVA server on http://127.0.0.1:${PORT}  (AI: ${openai ? "OpenAI" : GEMINI_KEY ? "Gemini" : "offline"}, YouTube API: ${YT_KEY ? "on" : "off"})`);
});
