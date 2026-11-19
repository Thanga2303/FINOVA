# FINOVA — Master Your Money. Build Your Future.

An AI-powered financial education platform for Indian learners. FINOVA works like an interactive financial university, taking complete beginners from “what is a share?” to portfolio construction, with business-building lessons along the way.

## What's inside

| Area | Highlights |
|---|---|
| **Stock Market Academy** | 24 lessons (Beginner → Advanced): NSE, BSE, Sensex, Nifty 50, Demat, IPOs, fundamental & technical analysis, P/E, EPS, market psychology, risk management, portfolio construction |
| **Mutual Fund Academy** | 16 lessons: fund types, SIP, NAV, expense ratio, direct vs regular, growth vs IDCW, riskometer, evaluating and comparing funds. SIP (with step-up) and lump-sum calculators with animated growth charts |
| **Trading Academy** | 14 lessons: intraday, swing, positional, candlesticks, moving averages, RSI, MACD, stop-loss, risk-reward, trading psychology, options & futures basics. Interactive candlestick chart, risk-reward/position-size calculator and a **paper-trading simulator** (₹10 lakh virtual cash, fictional assets, positions, P&L, history, equity curve) |
| **Investment Academy** | 11 lessons: compounding, inflation, asset allocation, emergency funds, goals, retirement, tax basics. 3D wealth-growth chart (React Three Fiber), inflation, emergency-fund and retirement planners |
| **Business Idea Hub** | 12 ideas across 10 categories (student, AI-powered, SaaS, e-commerce, freelancing…), each with overview, cost estimate, skills, customers, model, revenue, marketing, challenges, a step-by-step roadmap and videos. Filters and bookmarks |
| **Video Learning Center** | A video for every lesson and business idea. Uses the YouTube Data API when a key is set (prioritising trusted channels such as Zerodha Varsity, SEBI, NSE, NISM, AMFI); otherwise links to topic-specific YouTube searches. No invented video links |
| **FINOVA AI** | Chat tutor that explains concepts with ₹ examples, builds roadmaps, summarises lessons and writes practice quizzes. Uses OpenAI or Gemini on the server; falls back to an offline tutor built from FINOVA's own lessons. Refuses stock tips and personalised advice |
| **Dashboard & gamification** | XP, five levels (Beginner → Explorer → Analyst → Strategist → Finance Master), streaks, daily challenge, weekly goal, badges, quiz scores, saved videos, bookmarks, activity heatmap |
| **Everywhere** | Global search (Ctrl K), dark and light themes, cinematic page transitions, a 3D globe with floating coins, GSAP scroll animations, responsive layouts, reduced-motion and low-power fallbacks |

Every lesson includes a simple explanation, a practical example, important points, a related video, a knowledge quiz and a link to the next lesson.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · GSAP ScrollTrigger · Three.js / React Three Fiber / drei · Recharts · Node.js + Express

## Run it

```bash
npm install
cp .env.example .env      # optional: add AI and YouTube keys
npm run build
npm start                 # http://127.0.0.1:3000
```

For development with hot reload: `npm run dev` (Vite on :5173, API on :3000).

### Environment variables (`.env`, server only)

| Key | Purpose |
|---|---|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | FINOVA AI via OpenAI |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | FINOVA AI via Google Gemini (used if OpenAI is missing or fails) |
| `YOUTUBE_API_KEY` | Live video cards (title, thumbnail, channel, duration) |

Keys are read only by `server.js` and never reach the browser. Without any keys, the app still works fully, using the offline tutor and YouTube search links.

Learning progress is stored in the browser (localStorage). Supabase sign-in and cloud sync are a planned next step.

## Trust and safety

FINOVA is an **educational** platform. It shows no live market prices: the charts and simulator use clearly labelled, simulated data for fictional companies. It never executes real trades or handles money, and it never claims guaranteed returns. All calculator results are marked hypothetical. Nothing in FINOVA is investment advice; learners should research independently or consult a SEBI-registered adviser.
