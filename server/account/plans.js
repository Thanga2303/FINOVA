// Configurable membership plans. Prices in paise (INR minor units). Edit here to change plans;
// the pricing page, checkout and every entitlement check read from this one definition.
export const PLANS = {
  free: {
    id: "free", name: "Free", tier: 0, priceMonthly: 0, currency: "INR",
    tagline: "Start learning and practising.",
    highlights: ["Basic paper trading", "Basic charts", "Beginner academy lessons", "Basic portfolio analytics", "FINOVA AI: 10 questions a day", "Basic trading journal (20 entries)", "Includes promotional cards"],
    features: { paperTrading: true, basicCharts: true, advancedIndicators: false, academyLevels: ["Beginner"], masterclasses: false, portfolioAnalytics: "basic", tradingAnalytics: "basic", performanceReports: false, journal: "basic", journalLimit: 20, aiDailyLimit: 10, adFree: false },
  },
  pro: {
    id: "pro", name: "FINOVA Pro", tier: 1, priceMonthly: 14900, currency: "INR",
    tagline: "For serious learners and paper traders.",
    highlights: ["Everything in Free", "Advanced paper-trading analytics", "Advanced chart indicators (RSI, patterns)", "Full standard academy (all 65 lessons)", "Advanced portfolio analytics", "Full trading journal", "FINOVA AI: 100 questions a day", "Ad-free"],
    features: { paperTrading: true, basicCharts: true, advancedIndicators: true, academyLevels: ["Beginner", "Intermediate", "Advanced"], masterclasses: false, portfolioAnalytics: "advanced", tradingAnalytics: "advanced", performanceReports: false, journal: "full", journalLimit: Infinity, aiDailyLimit: 100, adFree: true },
  },
  elite: {
    id: "elite", name: "FINOVA Elite", tier: 2, priceMonthly: 29900, currency: "INR",
    tagline: "Deep analysis and premium learning.",
    highlights: ["Everything in Pro", "Premium masterclasses", "Detailed trading performance reports", "Advanced portfolio insights", "FINOVA AI: 400 questions a day", "Ad-free"],
    features: { paperTrading: true, basicCharts: true, advancedIndicators: true, academyLevels: ["Beginner", "Intermediate", "Advanced"], masterclasses: true, portfolioAnalytics: "insights", tradingAnalytics: "report", performanceReports: true, journal: "full", journalLimit: Infinity, aiDailyLimit: 400, adFree: true },
  },
};

export const PAID = ["pro", "elite"];
export const planById = (id) => PLANS[id] ?? PLANS.free;
export const GRACE_DAYS = 3; // keep access briefly if a renewal payment is late

/** Public plan list (Infinity is not valid JSON, so limits are serialised as null = unlimited). */
export function publicPlans() {
  return Object.values(PLANS).map((p) => ({ ...p, features: { ...p.features, journalLimit: Number.isFinite(p.features.journalLimit) ? p.features.journalLimit : null } }));
}
