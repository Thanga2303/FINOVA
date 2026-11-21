import { Capacitor } from "@capacitor/core";

/**
 * Where FINOVA is running. On the website this is always "web" and none of the native code paths run.
 * The Android app is a Capacitor shell that loads the FINOVA site, so the same pages and the same
 * server-side session/entitlement checks are used everywhere.
 */
export const platform = Capacitor.getPlatform() as "web" | "android" | "ios";
export const isAndroidApp = platform === "android" && Capacitor.isNativePlatform();

/** Header the server uses to keep Android purchases inside Google Play Billing. */
export const clientHeaders = (): Record<string, string> => (isAndroidApp ? { "X-Finova-Client": "android" } : {});
