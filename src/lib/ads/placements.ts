/**
 * Advertisement placement rules for the FINOVA Android app (AdMob). Edit placements here, not in pages.
 *
 * Policy decisions encoded here:
 * - Banners only on browsing/overview screens. Never on lessons, quizzes, the simulator, AI tutor, checkout,
 *   pricing, account, or while a paper-trading order ticket is open (pages also call suppressAds()).
 * - Interstitials only at natural breaks (after a lesson is finished and the learner leaves it), with
 *   strict frequency caps, never on app launch and never during a task.
 * - No rewarded "unlock premium" ads: premium is unlocked only by a server-verified subscription.
 * - Members with an ad-free plan (server entitlement features.adFree) see no ads at all.
 */
export type BannerPlacement = { id: string; match: (path: string) => boolean };

export const BANNER_PLACEMENTS: BannerPlacement[] = [
  { id: "home_banner", match: (p) => p === "/" },
  { id: "stocks_banner", match: (p) => p === "/stocks" },
  { id: "funds_banner", match: (p) => p === "/funds" },
  { id: "discover_banner", match: (p) => p === "/discover" },
  { id: "learn_hub_banner", match: (p) => p === "/learn" || p === "/learn/videos" },
  { id: "business_banner", match: (p) => p === "/business" },
];

/** Screens where no ad may ever appear, even if a placement above would match. */
export const NO_AD_ROUTES: ((p: string) => boolean)[] = [
  (p) => p.startsWith("/checkout") || p.startsWith("/pricing") || p.startsWith("/account"),
  (p) => /^\/learn\/(?!videos$|masterclasses$)[^/]+\/[^/]+/.test(p), // individual lessons + masterclass pages
  (p) => p.startsWith("/learn/masterclasses/"),
  (p) => p.startsWith("/ai"),
  (p) => p.startsWith("/wallet"), // personal finance data
  (p) => p.startsWith("/investments"), // portfolio + order management
];

export const INTERSTITIAL_RULES = {
  /** Only these natural breaks may show a full-screen ad. */
  allowedBreaks: ["lesson_completed"] as const,
  minIntervalMs: 10 * 60e3,
  maxPerDay: 3,
  noAdsFirstMs: 3 * 60e3, // nothing in the first minutes of an app session
};
export type NaturalBreak = (typeof INTERSTITIAL_RULES.allowedBreaks)[number];

/** Content rating requested from AdMob: General audiences, no gambling/trading-signal style ads where possible. */
export const MAX_AD_CONTENT_RATING = "General" as const;

// Google's official sample ad units: always safe to use while developing. Real ids come from the build env.
const TEST = { banner: "ca-app-pub-3940256099942544/6300978111", interstitial: "ca-app-pub-3940256099942544/1033173712" };
const env = import.meta.env as Record<string, string | undefined>;
const real = { banner: env.VITE_ADMOB_BANNER_ID?.trim(), interstitial: env.VITE_ADMOB_INTERSTITIAL_ID?.trim() };
/** Test ads unless real ids are configured AND VITE_ADMOB_TESTING isn't "true". Never click your own live ads. */
export const ADS_TESTING = !real.banner || !real.interstitial || env.VITE_ADMOB_TESTING === "true";
export const AD_UNITS = ADS_TESTING ? TEST : { banner: real.banner!, interstitial: real.interstitial! };
export const TEST_DEVICE_IDS = (env.VITE_ADMOB_TEST_DEVICE_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
