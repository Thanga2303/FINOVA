import { useEffect, useRef, useState } from "react";

export type Meta = { source: string; dataType?: string; asOf?: number | null; fetchedAt: number; note?: string; universeNote?: string };
export type Quote = {
  symbol: string; name: string; shortName: string; exchange?: string; price: number | null; change: number | null; changePct: number | null;
  prevClose: number | null; open: number | null; dayHigh: number | null; dayLow: number | null; volume: number | null; avgVolume: number | null;
  marketCap: number | null; pe: number | null; eps: number | null; high52: number | null; low52: number | null; currency?: string; time: number | null;
  marketState?: string; quoteType?: string;
};
export type Overview = {
  indices: (Quote & { name: string })[]; gainers: Quote[]; losers: Quote[]; mostActive: Quote[]; trending: Quote[]; stocks: Quote[];
  breadth: { advancers: number; decliners: number; unchanged: number; universe: number };
  status: { state: string; label: string; open: boolean; lastTradeTime: number | null; hours: string };
  meta: Meta;
};
export type ChartPt = { t: number; o?: number; h?: number; l?: number; c: number; v?: number };
export type Chart = { symbol: string; range: string; points: ChartPt[]; prevClose: number | null; meta: Meta };
export type Statement = { endDate?: string; revenue: number | null; operatingIncome: number | null; netIncome: number | null; ebit: number | null };
export type StockDetail = {
  symbol: string; name: string; exchange?: string; currency: string; financialCurrency: string;
  profile: { summary: string | null; sector: string | null; industry: string | null; website: string | null; logo: string | null; employees: number | null; city: string | null; officers: { name: string; title: string }[] };
  stats: Record<string, number | string | null>;
  annual: Statement[]; quarterly: Statement[]; yearly: { year: number; revenue: number | null; earnings: number | null }[];
  quarterlyEps: { quarter: string; actual: number | null; estimate: number | null; reported: string | null }[];
  nextEarnings: string | null; dividends: { date: number; amount: number }[]; meta: Meta;
};
export type FundRow = { code: number; isin: string | null; name: string; plan: string; option: string; nav: number; date: string; category: string; amc: string; risk: string | null };
export type Returns = Partial<Record<"1M" | "6M" | "1Y" | "3Y" | "5Y" | "10Y" | "sinceLaunch", number | null>>;
export type FundSummary = { code: number; name: string; amc: string; category: string; nav: number; navDate: number; returns: Returns; risk: string | null };
export type FundDetail = {
  code: number; name: string; amc: string; category: string; schemeType: string; isin: string | null; nav: number | null; navDate: number | null;
  launchNav: { t: number; nav: number } | null; returns: Returns; history: { t: number; nav: number }[]; risk: string | null;
  extra: null | { expenseRatio: number | null; minInvestment: number | null; manager: string | null; aum: number | null; holdings: { name: string; symbol?: string; weight: number }[]; sectors: { sector: string; weight: number }[]; assetMix: { stocks: number; bonds: number; cash: number } | null; source: string };
  meta: Meta;
};
export type NewsItem = { id: string; title: string; publisher: string; link: string; time: number; thumbnail: string | null; tickers: string[] };

const mem = new Map<string, { at: number; data: unknown }>();

export async function getJSON<T>(url: string, maxAgeMs = 30e3): Promise<T> {
  const hit = mem.get(url);
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.data as T;
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `Request failed (${r.status})`);
  mem.set(url, { at: Date.now(), data: j });
  return j as T;
}

/** Fetch with loading/error state and optional polling (only while the tab is visible). */
export function useApi<T>(url: string | null, { poll = 0, maxAge = 30e3 }: { poll?: number; maxAge?: number } = {}) {
  const [data, setData] = useState<T | null>(() => (url && mem.get(url) ? (mem.get(url)!.data as T) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url && !mem.get(url)));
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    if (!url) { setData(null); setLoading(false); return; }
    const cachedHit = mem.get(url);
    setData(cachedHit ? (cachedHit.data as T) : null);
    const load = (age: number) =>
      getJSON<T>(url, age)
        .then((d) => { if (alive.current) { setData(d); setError(null); } })
        .catch((e) => alive.current && setError(String(e.message || e)))
        .finally(() => alive.current && setLoading(false));
    setLoading(!cachedHit);
    load(maxAge);
    let id: ReturnType<typeof setInterval> | undefined;
    if (poll) id = setInterval(() => { if (!document.hidden) load(poll - 1000); }, poll);
    return () => { alive.current = false; if (id) clearInterval(id); };
  }, [url, poll, maxAge]);
  return { data, error, loading };
}

export const fmtTime = (t?: number | null) =>
  t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "—";
export const fmtDate = (t?: number | null) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");

export const cleanSym = (s: string) => s.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
