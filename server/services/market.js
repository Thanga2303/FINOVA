// Market data service. Source: Yahoo Finance public endpoints (delayed quotes, historical charts, fundamentals).
// Data is for education; quotes are delayed and may be incomplete. Every response carries source + timestamps.
import { cached } from "./cache.js";
import { INDICES, UNIVERSE } from "../data/universe.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36";
const SOURCE = "Yahoo Finance";
let session = null; // { cookie, crumb, at }

async function getSession(force = false) {
  if (!force && session && Date.now() - session.at < 6 * 3600e3) return session;
  const r1 = await fetch("https://fc.yahoo.com/", { headers: { "User-Agent": UA }, redirect: "manual", signal: AbortSignal.timeout(10000) }).catch(() => null);
  const cookies = r1?.headers?.getSetCookie?.() ?? [];
  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  const r2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", { headers: { "User-Agent": UA, Cookie: cookie }, signal: AbortSignal.timeout(10000) });
  const crumb = (await r2.text()).trim();
  if (!r2.ok || !crumb || crumb.includes("<")) throw new Error("Could not start a market data session");
  session = { cookie, crumb, at: Date.now() };
  return session;
}

export async function yget(url, { auth = false } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = { "User-Agent": UA, Accept: "application/json" };
    let u = url;
    if (auth) {
      const s = await getSession(attempt > 0);
      headers.Cookie = s.cookie;
      u += (u.includes("?") ? "&" : "?") + "crumb=" + encodeURIComponent(s.crumb);
    }
    const r = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
    if ((r.status === 401 || r.status === 403) && auth && attempt === 0) continue;
    if (!r.ok) throw new Error(`Market data HTTP ${r.status}`);
    return r.json();
  }
}

const n = (v) => (v && typeof v === "object" ? v.raw ?? null : v ?? null);

function marketStatus(state, time) {
  const map = { REGULAR: "Open", PRE: "Pre-open", PREPRE: "Closed", POST: "Closed", POSTPOST: "Closed", CLOSED: "Closed" };
  const ist = new Date(Date.now() + 5.5 * 3600e3);
  const day = ist.getUTCDay();
  const label = map[state] ?? (day === 0 || day === 6 ? "Closed (weekend)" : "Closed");
  return { state: state ?? "UNKNOWN", label, open: state === "REGULAR", lastTradeTime: time ? time * 1000 : null, hours: "NSE/BSE equity: 9:15 AM – 3:30 PM IST, Mon–Fri (exchange holidays excluded)" };
}

function mapQuote(q) {
  return {
    symbol: q.symbol,
    name: q.longName || q.shortName || q.symbol,
    shortName: q.shortName || q.symbol,
    exchange: q.fullExchangeName || q.exchange,
    price: q.regularMarketPrice ?? null,
    change: q.regularMarketChange ?? null,
    changePct: q.regularMarketChangePercent ?? null,
    prevClose: q.regularMarketPreviousClose ?? null,
    open: q.regularMarketOpen ?? null,
    dayHigh: q.regularMarketDayHigh ?? null,
    dayLow: q.regularMarketDayLow ?? null,
    volume: q.regularMarketVolume ?? null,
    avgVolume: q.averageDailyVolume3Month ?? null,
    marketCap: q.marketCap ?? null,
    pe: q.trailingPE ?? null,
    eps: q.epsTrailingTwelveMonths ?? null,
    high52: q.fiftyTwoWeekHigh ?? null,
    low52: q.fiftyTwoWeekLow ?? null,
    currency: q.currency,
    time: q.regularMarketTime ? q.regularMarketTime * 1000 : null,
    marketState: q.marketState,
    quoteType: q.quoteSourceName || "Delayed Quote",
  };
}

export async function quotes(symbols) {
  const list = [...new Set(symbols)].slice(0, 80);
  if (!list.length) return [];
  return cached(`q:${list.sort().join(",")}`, 60e3, async () => {
    const j = await yget(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${list.map(encodeURIComponent).join(",")}`, { auth: true });
    return (j.quoteResponse?.result ?? []).map(mapQuote);
  });
}

export async function overview() {
  return cached("overview", 60e3, async () => {
    const all = await quotes([...INDICES.map((i) => i.symbol), ...UNIVERSE]);
    const idx = INDICES.map((i) => ({ ...all.find((q) => q.symbol === i.symbol), name: i.name })).filter((q) => q.price != null);
    const stocks = all.filter((q) => !q.symbol.startsWith("^") && q.price != null && q.changePct != null);
    const by = (f, dir = -1) => [...stocks].sort((a, b) => dir * (f(a) - f(b)));
    const advancers = stocks.filter((s) => s.changePct > 0).length;
    const decliners = stocks.filter((s) => s.changePct < 0).length;
    const latest = Math.max(...all.map((q) => q.time || 0));
    return {
      indices: idx,
      gainers: by((s) => s.changePct).slice(0, 6),
      losers: by((s) => s.changePct, 1).slice(0, 6),
      mostActive: by((s) => (s.volume || 0) * (s.price || 0)).slice(0, 6),
      trending: by((s) => Math.abs(s.changePct)).slice(0, 8),
      stocks,
      breadth: { advancers, decliners, unchanged: stocks.length - advancers - decliners, universe: stocks.length },
      status: marketStatus(idx[0]?.marketState, idx[0]?.time / 1000),
      meta: { source: SOURCE, dataType: "Delayed quotes", asOf: latest || Date.now(), fetchedAt: Date.now(), universeNote: "Movers are computed within FINOVA's tracked universe of 52 large NSE-listed companies, not the whole market." },
    };
  });
}

const RANGES = {
  "1d": { range: "1d", interval: "5m" },
  "1w": { range: "5d", interval: "15m" },
  "1m": { range: "1mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
};

export async function chart(symbol, key = "1m") {
  const cfg = RANGES[key] ?? RANGES["1m"];
  return cached(`c:${symbol}:${key}`, key === "1d" ? 60e3 : 15 * 60e3, async () => {
    const j = await yget(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${cfg.range}&interval=${cfg.interval}&includePrePost=false`);
    const r = j.chart?.result?.[0];
    if (!r) throw new Error("No chart data");
    const q = r.indicators?.quote?.[0] ?? {};
    const points = (r.timestamp ?? []).map((t, i) => ({ t: t * 1000, o: q.open?.[i], h: q.high?.[i], l: q.low?.[i], c: q.close?.[i], v: q.volume?.[i] })).filter((p) => p.c != null);
    return {
      symbol, range: key, points,
      prevClose: r.meta?.chartPreviousClose ?? r.meta?.previousClose ?? null,
      meta: { source: SOURCE, dataType: key === "1d" || key === "1w" ? "Intraday (delayed)" : "Historical", asOf: points.at(-1)?.t ?? null, fetchedAt: Date.now() },
    };
  });
}

function statements(list = []) {
  return list.map((s) => ({
    endDate: s.endDate?.fmt,
    revenue: n(s.totalRevenue),
    operatingIncome: n(s.operatingIncome) || null,
    netIncome: n(s.netIncome),
    ebit: n(s.ebit) || null,
  })).filter((s) => s.revenue || s.netIncome).reverse();
}

export async function stock(symbol) {
  return cached(`s:${symbol}`, 6 * 3600e3, async () => {
    const mods = "price,summaryDetail,defaultKeyStatistics,assetProfile,financialData,incomeStatementHistory,incomeStatementHistoryQuarterly,earnings,calendarEvents";
    const j = await yget(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${mods}`, { auth: true });
    const r = j.quoteSummary?.result?.[0];
    if (!r) throw new Error("Company not found");
    const p = r.assetProfile ?? {}, sd = r.summaryDetail ?? {}, ks = r.defaultKeyStatistics ?? {}, fd = r.financialData ?? {}, pr = r.price ?? {};
    let divs = [];
    try {
      const c = await yget(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5y&interval=1mo&events=div`);
      divs = Object.values(c.chart?.result?.[0]?.events?.dividends ?? {}).map((d) => ({ date: d.date * 1000, amount: d.amount })).sort((a, b) => b.date - a.date);
    } catch { /* optional */ }
    const website = p.website || null;
    let domain = null;
    try { domain = website ? new URL(website).hostname.replace(/^www\./, "") : null; } catch { /* ignore */ }
    return {
      symbol,
      name: pr.longName || pr.shortName || symbol,
      exchange: pr.exchangeName,
      currency: pr.currency || "INR",
      financialCurrency: r.earnings?.financialCurrency || fd.financialCurrency || "INR",
      profile: {
        summary: p.longBusinessSummary || null, sector: p.sectorDisp || p.sector || null, industry: p.industryDisp || p.industry || null,
        website, logo: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
        employees: p.fullTimeEmployees ?? null, city: p.city ?? null,
        officers: (p.companyOfficers ?? []).slice(0, 3).map((o) => ({ name: o.name, title: o.title })),
      },
      stats: {
        marketCap: n(sd.marketCap) ?? n(pr.marketCap), pe: n(sd.trailingPE), forwardPE: n(sd.forwardPE), eps: n(ks.trailingEps),
        pb: n(ks.priceToBook), bookValue: n(ks.bookValue), beta: n(sd.beta), high52: n(sd.fiftyTwoWeekHigh), low52: n(sd.fiftyTwoWeekLow),
        dividendRate: n(sd.dividendRate), dividendYield: n(sd.dividendYield), exDividendDate: sd.exDividendDate?.fmt ?? null, payoutRatio: n(sd.payoutRatio),
        roe: n(fd.returnOnEquity), profitMargin: n(fd.profitMargins), debtToEquity: n(fd.debtToEquity), revenueGrowth: n(fd.revenueGrowth),
      },
      annual: statements(r.incomeStatementHistory?.incomeStatementHistory),
      quarterly: statements(r.incomeStatementHistoryQuarterly?.incomeStatementHistory),
      yearly: (r.earnings?.financialsChart?.yearly ?? []).map((y) => ({ year: y.date, revenue: n(y.revenue), earnings: n(y.earnings) })),
      quarterlyEps: (r.earnings?.earningsChart?.quarterly ?? []).map((q) => ({ quarter: q.calendarQuarter || q.date, actual: n(q.actual), estimate: n(q.estimate), reported: q.reportedDate?.fmt ?? null })),
      nextEarnings: r.calendarEvents?.earnings?.earningsDate?.[0]?.fmt ?? null,
      dividends: divs,
      meta: { source: SOURCE, dataType: "Fundamentals (latest reported)", fetchedAt: Date.now() },
    };
  });
}

export async function search(q) {
  const term = q.trim();
  if (!term) return [];
  return cached(`search:${term.toLowerCase()}`, 3600e3, async () => {
    const j = await yget(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=12&newsCount=0&lang=en-IN&region=IN`);
    return (j.quotes ?? [])
      .filter((x) => (x.exchange === "NSI" || x.exchange === "BSE") && (x.quoteType === "EQUITY" || x.quoteType === "INDEX"))
      .map((x) => ({ symbol: x.symbol, name: x.longname || x.shortname, exchange: x.exchDisp, type: x.typeDisp, sector: x.sectorDisp ?? null }));
  });
}

export async function news(q = "India stock market Sensex Nifty", count = 10) {
  return cached(`news:${q}:${count}`, 15 * 60e3, async () => {
    const j = await yget(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=0&newsCount=${count}&lang=en-IN&region=IN`);
    return {
      items: (j.news ?? []).map((x) => ({
        id: x.uuid, title: x.title, publisher: x.publisher, link: x.link, time: x.providerPublishTime * 1000,
        thumbnail: x.thumbnail?.resolutions?.find((r) => r.width <= 400)?.url ?? x.thumbnail?.resolutions?.[0]?.url ?? null,
        tickers: x.relatedTickers ?? [],
      })),
      meta: { source: `${SOURCE} news search`, fetchedAt: Date.now() },
    };
  });
}
