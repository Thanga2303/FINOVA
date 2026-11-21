import { isAndroidApp } from "../native/platform";
import { track } from "../metrics";
import { AD_UNITS, ADS_TESTING, BANNER_PLACEMENTS, INTERSTITIAL_RULES, MAX_AD_CONTENT_RATING, NO_AD_ROUTES, TEST_DEVICE_IDS, type NaturalBreak } from "./placements";

/**
 * AdMob controller for the Android app. On the website every function here is a no-op.
 *
 * Order of operations (Google Play / AdMob policy):
 *  1. Google UMP consent: request consent info, show the consent form when required (EEA/UK/CH and
 *     US-state privacy regions), and only request ads when UMP says canRequestAds.
 *  2. Initialise the Mobile Ads SDK.
 *  3. Show ads only where placements.ts allows, never while suppressed (order ticket, lesson, quiz, checkout),
 *     and never for members whose server-verified plan is ad-free.
 */
type AdMobModule = typeof import("@capacitor-community/admob");
let mod: AdMobModule | null = null;
let ready = false;
let starting: Promise<void> | null = null;
let adFree = true; // assume ad-free until the server says otherwise, so a paying member never sees a flash of ads
let path = "/";
let bannerVisible = false;
let bannerShown = false;
let privacyOptionsRequired = false;
const suppressors = new Map<string, number>();
const sessionStart = Date.now();
const LS = "finova.ads.interstitials";

const allowedHere = () => !NO_AD_ROUTES.some((f) => f(path)) && BANNER_PLACEMENTS.some((p) => p.match(path));
const placementId = () => BANNER_PLACEMENTS.find((p) => p.match(path))?.id ?? "none";

async function start() {
  if (!isAndroidApp) return;
  if (starting) return starting;
  starting = (async () => {
    try {
      mod = await import("@capacitor-community/admob");
      const { AdMob } = mod;
      // 1) Consent first.
      let consent = await AdMob.requestConsentInfo({ testDeviceIdentifiers: TEST_DEVICE_IDS });
      if (consent.isConsentFormAvailable && consent.status === "REQUIRED") consent = await AdMob.showConsentForm();
      privacyOptionsRequired = (consent as { privacyOptionsRequirementStatus?: string }).privacyOptionsRequirementStatus === "REQUIRED";
      if (consent.canRequestAds === false) { track("ad_consent", { result: "declined_or_unavailable" }); return; }
      track("ad_consent", { result: String(consent.status).toLowerCase() });
      // 2) SDK.
      await AdMob.initialize({
        testingDevices: TEST_DEVICE_IDS,
        initializeForTesting: ADS_TESTING,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: MAX_AD_CONTENT_RATING as never,
      });
      // 3) Revenue/impression reporting (aggregated, anonymous).
      AdMob.addListener("bannerAdImpression" as never, () => track("ad_impression", { format: "banner", placement: placementId() }));
      AdMob.addListener("bannerAdPaid" as never, (d: { valueMicros: number; currencyCode: string; precision?: unknown }) => track("ad_paid", { format: "banner", valueMicros: d.valueMicros, currency: d.currencyCode, precision: String(d.precision ?? "unknown") }));
      AdMob.addListener("interstitialAdImpression" as never, () => track("ad_impression", { format: "interstitial", placement: "lesson_completed" }));
      AdMob.addListener("bannerAdSizeChanged" as never, (s: { height: number }) => document.documentElement.style.setProperty("--ad-banner-h", `${bannerVisible ? s.height : 0}px`));
      ready = true;
      sync();
    } catch (e) {
      console.warn("[ads] disabled:", (e as Error).message);
    }
  })();
  return starting;
}

/** Reconciles the banner with the current route, suppressions and entitlement. */
function sync() {
  if (!ready || !mod) return;
  const want = !adFree && suppressors.size === 0 && allowedHere();
  const { AdMob } = mod;
  if (want && !bannerVisible) {
    bannerVisible = true;
    const p = bannerShown ? AdMob.resumeBanner() : AdMob.showBanner({ adId: AD_UNITS.banner, isTesting: ADS_TESTING, adSize: "ADAPTIVE_BANNER" as never, position: "BOTTOM_CENTER" as never, margin: 64 /* above FINOVA's bottom nav */ });
    p.then(() => { bannerShown = true; }).catch(() => { bannerVisible = false; });
  } else if (!want && bannerVisible) {
    bannerVisible = false;
    document.documentElement.style.setProperty("--ad-banner-h", "0px");
    AdMob.hideBanner().catch(() => {});
  }
}

/** Called by the app shell on every route change. */
export function setAdRoute(p: string) { path = p; sync(); }

/** Called whenever the server entitlement loads/changes. Members with adFree never get ads; we also tear down the SDK views. */
export function setAdEntitlement(isAdFree: boolean, loaded: boolean) {
  if (!isAndroidApp || !loaded) return;
  adFree = isAdFree;
  if (adFree) { if (mod && bannerShown) mod.AdMob.removeBanner().catch(() => {}); bannerShown = false; bannerVisible = false; document.documentElement.style.setProperty("--ad-banner-h", "0px"); return; }
  start().then(sync);
}

/**
 * Hides all ads while a sensitive activity is on screen. Use in an effect: `useEffect(() => suppressAds("order"), [])`.
 * Returns the cleanup function. Used by the paper-order ticket, lessons, quizzes and checkout.
 */
export function suppressAds(reason: string): () => void {
  if (!isAndroidApp) return () => {};
  const key = `${reason}:${Math.random().toString(36).slice(2)}`;
  suppressors.set(key, Date.now());
  sync();
  return () => { suppressors.delete(key); sync(); };
}

/**
 * Full-screen ad at a natural break (e.g. after finishing a lesson). Silently does nothing unless every rule passes:
 * allowed break, not ad-free, nothing suppressed, frequency caps, not early in the session, consent obtained.
 */
export async function naturalBreak(kind: NaturalBreak) {
  if (!isAndroidApp || adFree || !ready || !mod || suppressors.size > 0) return;
  if (!INTERSTITIAL_RULES.allowedBreaks.includes(kind)) return;
  if (Date.now() - sessionStart < INTERSTITIAL_RULES.noAdsFirstMs) return;
  let log: number[] = [];
  try { log = JSON.parse(localStorage.getItem(LS) || "[]"); } catch { /* ignore */ }
  const today = log.filter((t) => Date.now() - t < 864e5);
  if (today.length >= INTERSTITIAL_RULES.maxPerDay || (today.length && Date.now() - Math.max(...today) < INTERSTITIAL_RULES.minIntervalMs)) return;
  try {
    await mod.AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: ADS_TESTING });
    if (suppressors.size > 0 || !allowedHereForInterstitial()) return; // the learner moved into another task meanwhile
    await mod.AdMob.showInterstitial();
    try { localStorage.setItem(LS, JSON.stringify([...today, Date.now()])); } catch { /* ignore */ }
  } catch { /* no fill / offline: never retry aggressively */ }
}
const allowedHereForInterstitial = () => !NO_AD_ROUTES.some((f) => f(path));

/** Whether to show the "Ad privacy choices" entry (required by UMP when privacy options apply). */
export const adPrivacyOptionsAvailable = () => isAndroidApp && privacyOptionsRequired;
export async function openAdPrivacyOptions() { if (mod) await mod.AdMob.showPrivacyOptionsForm(); }
