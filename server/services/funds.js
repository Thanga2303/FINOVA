// Mutual fund data service.
// - Scheme list + latest NAV: AMFI's official NAV file (portal.amfiindia.com/spages/NAVAll.txt)
// - NAV history: MFAPI (api.mfapi.in), which republishes AMFI NAV history
// - Expense ratio, minimum investment, top holdings (when reported): Yahoo Finance / Morningstar fund profile
// Returns are COMPUTED from real NAV history. Nothing is estimated or invented; missing fields are returned as null.
import { cached } from "./cache.js";
import { yget } from "./market.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36";

export const CATEGORIES = {
  equity: { label: "Equity", test: (c) => /Equity Scheme/i.test(c) },
  debt: { label: "Debt", test: (c) => /Debt Scheme|Income\/Debt/i.test(c) },
  hybrid: { label: "Hybrid", test: (c) => /Hybrid Scheme/i.test(c) },
  index: { label: "Index", test: (c) => /Index Funds/i.test(c) },
  elss: { label: "ELSS (tax saver)", test: (c) => /ELSS/i.test(c) },
  liquid: { label: "Liquid", test: (c) => /Liquid Fund/i.test(c) },
  "large-cap": { label: "Large-cap", test: (c) => /- Large Cap Fund/i.test(c) },
  "mid-cap": { label: "Mid-cap", test: (c) => /- Mid Cap Fund/i.test(c) },
  "small-cap": { label: "Small-cap", test: (c) => /- Small Cap Fund/i.test(c) },
};

// Category-typical riskometer level (educational guide only; each scheme publishes its own riskometer monthly).
export function typicalRisk(cat = "") {
  if (/Overnight/i.test(cat)) return "Low";
  if (/Liquid|Money Market|Ultra Short/i.test(cat)) return "Low to Moderate";
  if (/Gilt|Corporate Bond|Banking and PSU|Short Duration|Low Duration|Arbitrage/i.test(cat)) return "Moderate";
  if (/Credit Risk|Conservative Hybrid|Medium|Dynamic Bond|Equity Savings/i.test(cat)) return "Moderately High";
  if (/Balanced Advantage|Dynamic Asset|Multi Asset|Balanced Hybrid/i.test(cat)) return "High";
  if (/Equity|ELSS|Aggressive Hybrid|Index Funds|ETF/i.test(cat)) return "Very High";
  return null;
}

const cleanCat = (c) => c.replace(/^Open Ended Schemes\(/, "").replace(/\)$/, "").trim();

async function amfi() {
  return cached("amfi", 6 * 3600e3, async () => {
    const r = await fetch("https://portal.amfiindia.com/spages/NAVAll.txt", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`AMFI HTTP ${r.status}`);
    const lines = (await r.text()).split(/\r?\n/);
    let cat = "", house = "", openEnded = false;
    const rows = [];
    for (const raw of lines) {
      const s = raw.trim();
      if (!s) continue;
      if (/^(Open Ended Schemes|Close Ended Schemes|Interval Fund Schemes)\(/.test(s)) { openEnded = s.startsWith("Open"); cat = cleanCat(s); continue; }
      const p = s.split(";");
      if (p.length >= 8 && /^\d+$/.test(p[0])) {
        const nav = Number(p[6]);
        if (!openEnded || !Number.isFinite(nav)) continue;
        const name = p[3].trim(), plan = p[4].trim(), opt = p[5].trim();
        rows.push({ code: Number(p[0]), isin: p[1] !== "-" ? p[1] : p[2] !== "-" ? p[2] : null, name, plan, option: opt, nav, date: p[7], category: cat, amc: house });
      } else if (p.length === 1 && !/Scheme Code/.test(s)) house = s;
    }
    return { rows, fetchedAt: Date.now() };
  });
}

const isDirectGrowth = (r) => /direct/i.test(r.plan + " " + r.name) && /growth/i.test(r.option + " " + r.name) && !/idcw|dividend|bonus|segregated/i.test(r.name + " " + r.option);

export async function list({ cat = "", q = "", plan = "direct-growth", limit = 40, offset = 0 } = {}) {
  const { rows, fetchedAt } = await amfi();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const c = CATEGORIES[cat];
  const filtered = rows.filter((r) => (plan !== "direct-growth" || isDirectGrowth(r)) && (!c || c.test(r.category)) && words.every((w) => (r.name + " " + r.amc).toLowerCase().includes(w)));
  return {
    total: filtered.length,
    items: filtered.slice(offset, offset + limit).map((r) => ({ ...r, risk: typicalRisk(r.category) })),
    meta: { source: "AMFI daily NAV file", dataType: "Latest published NAV (end of day)", fetchedAt },
  };
}

function parseDate(d) { const [dd, mm, yy] = d.split("-").map(Number); return Date.UTC(yy, mm - 1, dd); }

function navAt(hist, t) {
  // hist ascending; find last point at or before t
  let lo = 0, hi = hist.length - 1, ans = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (hist[m].t <= t) { ans = m; lo = m + 1; } else hi = m - 1; }
  return ans >= 0 ? hist[ans] : null;
}

export function returns(hist) {
  if (!hist.length) return {};
  const last = hist.at(-1);
  const out = {};
  const periods = { "1M": 1 / 12, "6M": 0.5, "1Y": 1, "3Y": 3, "5Y": 5, "10Y": 10 };
  for (const [k, yrs] of Object.entries(periods)) {
    const target = last.t - yrs * 365.25 * 864e5;
    if (hist[0].t > target + 7 * 864e5) { out[k] = null; continue; }
    const p = navAt(hist, target);
    if (!p) { out[k] = null; continue; }
    const g = last.nav / p.nav;
    out[k] = yrs < 1 ? (g - 1) * 100 : (Math.pow(g, 1 / yrs) - 1) * 100; // absolute for <1Y, CAGR for >=1Y
  }
  const years = (last.t - hist[0].t) / (365.25 * 864e5);
  out.sinceLaunch = years >= 1 ? (Math.pow(last.nav / hist[0].nav, 1 / years) - 1) * 100 : null;
  return out;
}

export async function history(code) {
  return cached(`mfh:${code}`, 6 * 3600e3, async () => {
    const r = await fetch(`https://api.mfapi.in/mf/${code}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`MFAPI HTTP ${r.status}`);
    const j = await r.json();
    if (!j?.meta?.scheme_name) throw new Error("Scheme not found");
    const hist = (j.data ?? []).map((d) => ({ t: parseDate(d.date), nav: Number(d.nav) })).filter((d) => d.nav > 0).sort((a, b) => a.t - b.t);
    return { meta: j.meta, hist };
  });
}

async function yahooFund(isin) {
  if (!isin) return null;
  return cached(`yf:${isin}`, 24 * 3600e3, async () => {
    try {
      const s = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${isin}&quotesCount=2&newsCount=0`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) }).then((r) => r.json());
      const sym = s.quotes?.find((x) => x.quoteType === "MUTUALFUND")?.symbol;
      if (!sym) return null;
      const j = await yget(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=fundProfile,topHoldings`, { auth: true });
      const r = j.quoteSummary?.result?.[0];
      const fp = r?.fundProfile ?? {}, th = r?.topHoldings ?? {};
      const er = fp.feesExpensesInvestment?.annualReportExpenseRatio?.raw;
      return {
        expenseRatio: er != null && er > 0 ? er * 100 : null,
        minInvestment: fp.initInvestment?.raw > 0 ? fp.initInvestment.raw : null,
        manager: fp.managementInfo?.managerName || null,
        aum: fp.feesExpensesInvestment?.totalNetAssets?.raw || null,
        holdings: (th.holdings ?? []).map((h) => ({ name: h.holdingName, symbol: h.symbol, weight: (h.holdingPercent?.raw ?? 0) * 100 })).filter((h) => h.name),
        sectors: (th.sectorWeightings ?? []).flatMap((o) => Object.entries(o).map(([k, v]) => ({ sector: k.replace(/_/g, " "), weight: (v?.raw ?? 0) * 100 }))).filter((x) => x.weight > 0).sort((a, b) => b.weight - a.weight),
        assetMix: th.stockPosition?.raw != null ? { stocks: th.stockPosition.raw * 100, bonds: (th.bondPosition?.raw ?? 0) * 100, cash: (th.cashPosition?.raw ?? 0) * 100 } : null,
        source: "Yahoo Finance (Morningstar data)",
      };
    } catch {
      return null;
    }
  });
}

function downsample(hist, maxPts = 600) {
  if (hist.length <= maxPts) return hist;
  const step = hist.length / maxPts;
  const out = [];
  for (let i = 0; i < maxPts; i++) out.push(hist[Math.floor(i * step)]);
  out.push(hist.at(-1));
  return out;
}

export async function detail(code) {
  const [{ meta, hist }, { rows }] = await Promise.all([history(code), amfi()]);
  const row = rows.find((r) => r.code === Number(code));
  const category = row?.category || meta.scheme_category?.replace(/^.*?- /, "") || meta.scheme_category;
  const extra = await yahooFund(row?.isin || meta.isin_growth);
  const last = hist.at(-1);
  return {
    code: Number(code),
    name: meta.scheme_name,
    amc: meta.fund_house,
    category,
    schemeType: meta.scheme_type,
    isin: row?.isin || meta.isin_growth || null,
    nav: last?.nav ?? row?.nav ?? null,
    navDate: last?.t ?? null,
    launchNav: hist[0] ?? null,
    returns: returns(hist),
    history: downsample(hist),
    risk: typicalRisk(category),
    extra,
    meta: {
      source: "AMFI NAV data via MFAPI" + (extra ? " · fund profile from Yahoo Finance (Morningstar)" : ""),
      dataType: "End-of-day NAV (historical)",
      fetchedAt: Date.now(),
    },
  };
}

export async function summaries(codes) {
  const out = await Promise.all(codes.map(async (c) => {
    try {
      const { meta, hist } = await history(c);
      const { rows } = await amfi();
      const row = rows.find((r) => r.code === c);
      return { code: c, name: meta.scheme_name, amc: meta.fund_house, category: row?.category ?? meta.scheme_category, nav: hist.at(-1)?.nav, navDate: hist.at(-1)?.t, returns: returns(hist), risk: typicalRisk(row?.category ?? meta.scheme_category) };
    } catch { return null; }
  }));
  return out.filter(Boolean);
}
