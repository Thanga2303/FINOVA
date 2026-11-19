// FINOVA's tracked universe: 52 large NSE-listed companies (Yahoo Finance symbols). Verified against live quotes.
export const UNIVERSE = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "BHARTIARTL", "ITC", "SBIN", "LT", "HINDUNILVR",
  "KOTAKBANK", "AXISBANK", "BAJFINANCE", "MARUTI", "SUNPHARMA", "HCLTECH", "M&M", "TITAN", "ULTRACEMCO", "NTPC",
  "ASIANPAINT", "POWERGRID", "TATASTEEL", "ONGC", "WIPRO", "NESTLEIND", "ADANIENT", "ADANIPORTS", "JSWSTEEL", "COALINDIA",
  "BAJAJFINSV", "TECHM", "GRASIM", "HINDALCO", "DRREDDY", "CIPLA", "BRITANNIA", "EICHERMOT", "HEROMOTOCO", "APOLLOHOSP",
  "TATACONSUM", "BPCL", "SBILIFE", "HDFCLIFE", "INDUSINDBK", "SHRIRAMFIN", "TRENT", "BEL", "BAJAJ-AUTO", "ETERNAL",
  "TMPV", "JIOFIN",
].map((s) => `${s}.NS`);

export const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
  { symbol: "^NSEBANK", name: "NIFTY BANK" },
];

// Popular funds (Direct Plan - Growth), resolved from AMFI's NAV file. Editorial list for discovery, not a recommendation.
export const POPULAR_FUNDS = [
  122639, 118955, 119598, 120586, 118825, 118632, 118989, 118778, 125497, 125354, 120828, 119835,
  135781, 120503, 119242, 120716, 119063, 149039, 147622, 119800, 119091, 120197, 118968, 120377,
  118987, 120692, 119533,
];
export const INDEX_FUNDS = [120716, 119063, 149039, 147622];
