# FINOVA — Master Your Money. Build Your Future.

An Indian fintech learning platform that combines investment discovery, paper trading, a personal finance wallet, an AI financial tutor and planner, and a full financial-education university.

## What's inside

| Area | Highlights |
|---|---|
| **Stocks** | Market dashboard with NIFTY 50, SENSEX and NIFTY BANK, market status, breadth, top gainers/losers, most active and trending stocks, a sortable table of 52 large NSE companies, stock search and market news. Each stock page has 1D/1W/1M/1Y/5Y line and candlestick charts, market cap, P/E, EPS, ROE, 52-week range, company overview, annual statements, quarterly results, dividend history, news, a **Learn** drawer and related videos |
| **Mutual Funds** | Every open-ended Direct-Growth scheme from AMFI with category filters (equity, debt, hybrid, index, ELSS, liquid, large/mid/small-cap) and search. Fund pages show real NAV history, returns computed from it (1M → 10Y, CAGR), expense ratio, minimum investment, top holdings and sector split where reported, a riskometer, Learn drawer and videos. Compare up to 3 funds with a growth-of-₹10,000 chart. Fund watchlist, SIP and lump-sum calculators |
| **Investments** | Portfolio dashboard combining paper-trading and manually tracked holdings: current value, invested amount, P&L, returns, today's P&L, holdings tables, asset allocation, value history over the past year, order history and multiple watchlists |
| **Paper orders** | Buy/sell or invest/redeem tickets with market, limit, one-time and SIP orders, estimated charges, an order summary and a confirmation screen. Uses delayed prices and latest NAVs; no real transactions |
| **Discover** | Popular and trending stocks, top funds by 3-year CAGR, index funds, market and business news, official IPO links and education, all with sources and timestamps |
| **Smart Wallet** | Income (recurring or one-off), expenses by category, monthly budgets, savings goals with required monthly contribution and estimated completion date, loans and planned SIPs, an income → expenses → emergency → investment budget → portfolio flow, charts, an educational financial health score (out of 100) and optional reminders |
| **FINOVA AI** | Three modes. **Learning:** concepts, roadmaps, quizzes. **Research:** summarises real company and fund data and news with sources. **Planner:** a 9-part monthly plan from your income, expenses, debts, goals and risk preference. Calculators (SIP, lump sum, goals) run on exact formulas with growth charts. Wallet data is used only with your consent |
| **Learn** | 65 lessons across four academies, each with explanation, example, key points, video and quiz; calculators, a 3D wealth chart, a candlestick practice chart and a fictional-market simulator; video library; XP, levels, streaks, badges and daily challenges |
| **Business** | 12 business playbooks across 10 categories with cost estimates, models, marketing, challenges, roadmaps and videos |

## Data sources

| Data | Source | Label shown in app |
|---|---|---|
| Stock & index quotes, charts, fundamentals, statements, dividends, news | Yahoo Finance public endpoints | Delayed quotes · Historical · Fundamentals (latest reported) |
| Mutual fund list and latest NAV | AMFI daily NAV file | End-of-day NAV |
| Mutual fund NAV history | MFAPI (republishes AMFI data) | Historical (end-of-day NAV) |
| Fund expense ratio, holdings, minimum investment (when reported) | Yahoo Finance (Morningstar data) | Shown with source |
| Educational videos | YouTube Data API (optional key) or YouTube search links | — |

Nothing is invented: missing fields show "Not reported by data source". Movers are computed within FINOVA's tracked universe of 52 large NSE companies. The fund riskometer shown is the typical level for the category; each scheme's official riskometer is in its factsheet. Free data is delayed and intended for education.

## Architecture

```
server.js                 entry (loads .env, starts API)
server/index.js           Express routes
server/services/market.js market data service (quotes, charts, fundamentals, search, news)
server/services/funds.js  mutual fund data service (AMFI list, NAV history, computed returns, profiles)
server/services/ai.js     AI assistance (OpenAI or Gemini, server-side keys only)
server/services/videos.js educational video service
src/lib/paper.ts          paper-trading engine
src/lib/wallet.ts         wallet calculations, planner input, health score
src/lib/finance.ts        exact financial formulas and the planner
src/lib/aiTools.ts        AI calculators, planner and research tools
supabase/schema.sql       PostgreSQL schema with Row Level Security
```

Watchlists, portfolio, paper orders, wallet records, preferences and learning progress are stored in the browser today. `supabase/schema.sql` defines matching tables (profiles, income, expenses, budgets, goals, investments, orders, watchlists, learning progress, AI conversations, planning preferences) with owner-only RLS policies, ready for adding Supabase Auth and sync.

## Run it

```bash
npm install
cp .env.example .env      # optional: AI and YouTube keys
npm run build
npm start                 # http://127.0.0.1:3000
```

Development with hot reload: `npm run dev` (Vite on :5173, API on :3000).

### Environment variables (server only)

| Key | Purpose |
|---|---|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | FINOVA AI via OpenAI |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | FINOVA AI via Google Gemini (used if OpenAI is missing or fails) |
| `YOUTUBE_API_KEY` | Live video cards (title, thumbnail, channel, duration) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Reserved for cloud accounts (public anon key; data protected by RLS) |

Keys are read only by the server and never reach the browser. Without AI keys, FINOVA AI still runs its calculators, planner, research summaries and lesson library offline.

## Memberships & billing

| Plan | Price | Highlights |
|---|---|---|
| Free | ₹0 | Paper trading, basic charts, Beginner lessons, basic analytics, 10 AI questions/day, basic journal (20 entries), promotional cards |
| FINOVA Pro | ₹149/month | Advanced indicators, all 65 lessons, advanced portfolio & trading analytics, full journal, 100 AI questions/day, ad-free |
| FINOVA Elite | ₹299/month | Masterclasses, detailed performance reports with CSV, portfolio insights, 400 AI questions/day, ad-free |

Plans are defined once in `server/account/plans.js`.

**How it is secured**

- Accounts: email + password (scrypt), opaque session tokens in HttpOnly SameSite cookies, rate-limited sign-in, cross-site request blocking.
- The plan is never read from the browser. `/api/auth/me` returns entitlements computed from the server's subscription record, and every gated endpoint (AI quota tickets, portfolio insights, trading reports, masterclasses) re-checks the plan on the server.
- **Razorpay (web):** the server creates the subscription, verifies the Checkout signature (HMAC with the key secret) **and** re-fetches the subscription from Razorpay's API before activating. Renewals, failures and cancellations arrive via webhooks verified with the webhook secret, de-duplicated by event id. Upgrades cancel the previous subscription to avoid double billing.
- **Google Play (Android):** the app passes the purchase token; the server verifies it with Google (`purchases.subscriptionsv2.get`), checks the obfuscated account id matches the FINOVA user, and acknowledges it. Real-time developer notifications are re-verified with Google, never trusted as-is.
- **Test mode:** `BILLING_TEST_MODE=true` enables a clearly labelled “activate without payment” checkout for development. Keep it `false` in production.
- Lifecycle: cancellations take effect at period end, downgrades are scheduled for renewal, late renewals get a 3-day grace period, history and invoices are recorded.

Account data is stored by the server in `data/finova-db.json` (git-ignored). `supabase/schema.sql` includes matching `subscriptions`, `billing_events`, `invoices` and `ai_usage` tables (read-own RLS, server-only writes) for moving to Supabase.

**Android app (Google Play Billing + AdMob):** a Capacitor shell in `android/` loads the FINOVA site. Memberships are bought with Google Play Billing and verified by the server (account-bound tokens, restore, renewals/cancellations/refunds via RTDN). AdMob ads respect UMP consent, never appear during paper orders, lessons, quizzes or checkout, and are removed for Pro/Elite. Revenue and conversion analytics are at `/admin/metrics`. Nothing is live until the Play Console and AdMob setup in [docs/ANDROID_MONETIZATION.md](docs/ANDROID_MONETIZATION.md) is done.

**Going live:** create ₹149 and ₹299 monthly Plans in Razorpay, set `RAZORPAY_*` keys and the webhook secret (webhook URL `/api/billing/webhook/razorpay`), test end to end with Razorpay test keys, then switch to live keys and set `BILLING_TEST_MODE=false`. For international customers, a merchant-of-record provider (e.g. Paddle) can be added as another provider later.

## Trust and safety

- **Education, not advice.** FINOVA isn't a SEBI-registered adviser or broker. No buy/sell recommendations, price predictions or guaranteed returns.
- **No real money.** Orders are paper trades. Real investing needs a SEBI-registered broker or distributor with KYC, account security, consent and transaction safeguards.
- **Wallet is a tracker,** not a bank or payment wallet. FINOVA never asks for banking passwords, UPI PINs, OTPs or card details, and never moves money automatically.
- **Labelled data:** delayed, historical, end-of-day, simulated and hypothetical figures are always marked.
