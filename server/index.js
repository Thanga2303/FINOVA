// FINOVA API: separate services for market data, mutual funds, news, educational videos and AI.
// Auth, portfolio, watchlists, paper trading and wallet records live client-side for now (localStorage),
// with a Supabase/PostgreSQL schema (supabase/schema.sql, Row Level Security) ready for cloud sync.
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as market from "./services/market.js";
import * as funds from "./services/funds.js";
import { chat, aiProvider } from "./services/ai.js";
import { videos, youtubeEnabled } from "./services/videos.js";
import { POPULAR_FUNDS, INDEX_FUNDS, UNIVERSE } from "./data/universe.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] }));
app.use(express.json({ limit: "96kb" }));

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (e) {
    console.error(`[api] ${req.path}:`, e?.message || e);
    res.status(502).json({ error: "Data source unavailable right now. Please try again shortly.", detail: String(e?.message || e) });
  }
};
const SYM = /^[\^A-Z0-9&.\-]{1,24}$/i;

app.get("/api/health", (_req, res) => res.json({ ok: true, ai: aiProvider(), youtube: youtubeEnabled(), time: Date.now() }));

// ---- Market data service ----
app.get("/api/market/overview", wrap(() => market.overview()));
app.get("/api/market/quotes", wrap((req) => {
  const syms = String(req.query.symbols || "").split(",").map((s) => s.trim()).filter((s) => SYM.test(s));
  return market.quotes(syms).then((items) => ({ items, meta: { source: "Yahoo Finance", dataType: "Delayed quotes", fetchedAt: Date.now() } }));
}));
app.get("/api/market/chart/:symbol", wrap((req) => {
  if (!SYM.test(req.params.symbol)) throw new Error("Bad symbol");
  return market.chart(req.params.symbol, String(req.query.range || "1m"));
}));
app.get("/api/market/stock/:symbol", wrap((req) => {
  if (!SYM.test(req.params.symbol)) throw new Error("Bad symbol");
  return market.stock(req.params.symbol);
}));
app.get("/api/market/search", wrap((req) => market.search(String(req.query.q || "").slice(0, 60))));
app.get("/api/market/universe", (_req, res) => res.json({ symbols: UNIVERSE }));
app.get("/api/news", wrap((req) => market.news(String(req.query.q || "India stock market Sensex Nifty").slice(0, 80), Math.min(20, Number(req.query.count) || 10))));

// ---- Mutual fund data service ----
app.get("/api/funds", wrap((req) => funds.list({
  cat: String(req.query.cat || ""), q: String(req.query.q || "").slice(0, 60),
  plan: String(req.query.plan || "direct-growth"), limit: Math.min(100, Number(req.query.limit) || 40), offset: Math.max(0, Number(req.query.offset) || 0),
})));
app.get("/api/funds/categories", (_req, res) => res.json(Object.entries(funds.CATEGORIES).map(([id, c]) => ({ id, label: c.label }))));
app.get("/api/funds/popular", wrap(async () => ({ items: await funds.summaries(POPULAR_FUNDS), meta: { source: "AMFI NAV data via MFAPI", dataType: "Returns computed from end-of-day NAV history", fetchedAt: Date.now(), note: "FINOVA editorial list of widely held funds (Direct-Growth). Not a recommendation." } })));
app.get("/api/funds/index", wrap(async () => ({ items: await funds.summaries(INDEX_FUNDS), meta: { source: "AMFI NAV data via MFAPI", fetchedAt: Date.now() } })));
app.get("/api/funds/summary", wrap(async (req) => {
  const codes = String(req.query.codes || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 20);
  return { items: await funds.summaries(codes), meta: { source: "AMFI NAV data via MFAPI", fetchedAt: Date.now() } };
}));
app.get("/api/funds/:code", wrap((req) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code) || code <= 0) throw new Error("Bad scheme code");
  return funds.detail(code);
}));

// ---- Educational videos ----
app.get("/api/videos", wrap((req) => {
  const q = String(req.query.q || "").slice(0, 160).trim();
  if (!q) throw new Error("Missing q");
  return videos(q);
}));

// ---- AI assistance ----
app.post("/api/chat", async (req, res) => {
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = raw.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages.at(-1).role !== "user") return res.status(400).json({ error: "Please enter a question." });
  const mode = ["learning", "research", "planner"].includes(req.body?.mode) ? req.body.mode : "learning";
  const context = typeof req.body?.context === "string" ? req.body.context : "";
  const out = await chat({ messages, mode, context });
  if (out) return res.json(out);
  res.status(503).json({ offline: true, error: aiProvider() === "offline" ? "No AI key configured." : "The AI service is unavailable right now." });
});

// ---- Static app ----
const dist = path.join(root, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: 0, etag: true, index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "127.0.0.1", () => {
  console.log(`FINOVA server on http://127.0.0.1:${PORT}  (AI: ${aiProvider()}, YouTube API: ${youtubeEnabled() ? "on" : "off"})`);
});
