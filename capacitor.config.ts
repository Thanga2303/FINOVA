import type { CapacitorConfig } from "@capacitor/cli";

/**
 * FINOVA Android app (Capacitor). See docs/ANDROID_MONETIZATION.md.
 *
 * The app loads the deployed FINOVA site (FINOVA_APP_URL, HTTPS) so the Android app shares the website's
 * server-side accounts, sessions and entitlement checks. Without FINOVA_APP_URL the bundled `dist/` is used,
 * which is only useful for UI checks (API calls need the server).
 *
 * appId must equal the package name you create in Google Play Console (GOOGLE_PLAY_PACKAGE_NAME on the server).
 * It can't be changed after the first upload to Play.
 */
const appUrl = process.env.FINOVA_APP_URL?.trim();

const config: CapacitorConfig = {
  appId: process.env.FINOVA_ANDROID_APP_ID?.trim() || "app.finova.android",
  appName: "FINOVA",
  webDir: "dist",
  backgroundColor: "#05070D",
  android: { allowMixedContent: false },
  server: appUrl ? { url: appUrl, cleartext: false, androidScheme: "https" } : { androidScheme: "https" },
  plugins: {},
};

export default config;
