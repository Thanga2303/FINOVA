import { account, refreshAccount, type PlanId } from "../account";
import { isAndroidApp } from "./platform";

/**
 * Google Play Billing for the FINOVA Android app (cordova-plugin-purchase, loaded natively by Capacitor as
 * window.CdvPurchase; it does not exist on the website).
 *
 * Rules this module follows:
 * - The app never decides entitlement. Every purchase token goes to OUR server, which verifies it with Google
 *   (purchases.subscriptionsv2), binds it to the signed-in FINOVA account and acknowledges it. The UI then
 *   re-reads /api/auth/me. A purchase is only "finished" after the server accepts it.
 * - The purchase carries the server-issued account tag as Google Play's obfuscatedAccountId, so a token can't
 *   be replayed on another FINOVA account.
 * - No card or payment details ever touch FINOVA: Google Play handles payment.
 * - Nothing is simulated. If the plugin, products or server configuration are missing, the methods report
 *   that clearly instead of pretending.
 */

// Minimal typings for the parts of CdvPurchase we use (full types: node_modules/cordova-plugin-purchase/www/store.d.ts).
type Offer = { id: string; productId: string; pricingPhases: { price: string; billingPeriod?: string }[]; order: (d?: unknown) => Promise<{ message: string; code?: number } | undefined> };
type Product = { id: string; title: string; description: string; offers: Offer[]; owned: boolean; pricing?: { price: string } };
type Transaction = { transactionId: string; purchaseId?: string; products: { id: string }[]; finish: () => Promise<void>; verify: () => Promise<void>; platform: string; state: string };
type ValidatorBody = { id: string; transaction?: { type?: string; purchaseToken?: string } };
type ValidatorCb = (r: { ok: true; data: { id: string; latest_receipt: boolean; transaction: unknown } } | { ok: false; code?: number; message: string; status?: number }) => void;
type Store = {
  register: (p: { id: string; type: string; platform: string }[]) => void;
  initialize: (p: string[]) => Promise<{ message: string }[]>;
  when: () => { approved: (cb: (t: Transaction) => void) => any; verified: (cb: (r: { finish: () => Promise<void> }) => void) => any; finished: (cb: (t: Transaction) => void) => any };
  error: (cb: (e: { code: number; message: string }) => void) => void;
  get: (id: string, platform?: string) => Product | undefined;
  update: () => Promise<void>;
  restorePurchases: () => Promise<{ message: string } | undefined>;
  manageSubscriptions: (platform?: string) => Promise<{ message: string } | undefined>;
  localReceipts: { platform: string; transactions: (Transaction & { purchaseToken?: string; nativePurchase?: { purchaseToken?: string } })[] }[];
  validator: unknown;
  applicationUsername?: string | (() => string | undefined);
  obfuscator?: unknown;
};
type Cdv = { store: Store; ProductType: { PAID_SUBSCRIPTION: string }; Platform: { GOOGLE_PLAY: string }; ErrorCode: { PAYMENT_CANCELLED: number } };

const cdv = () => (window as unknown as { CdvPurchase?: Cdv }).CdvPurchase;

export type PlayStatus = "unavailable" | "not_configured" | "signed_out" | "loading" | "ready" | "error";
export type PlayProduct = { plan: PlanId; productId: string; title: string; price: string | null; owned: boolean };

let init: Promise<PlayStatus> | null = null;
let products: { pro: string | null; elite: string | null } = { pro: null, elite: null };
let lastError: string | null = null;
const tokenOf = (t: { purchaseToken?: string; nativePurchase?: { purchaseToken?: string }; purchaseId?: string }) => t.purchaseToken ?? t.nativePurchase?.purchaseToken ?? t.purchaseId ?? "";

/** Sets up the store once per app session. Safe to call repeatedly. */
export function initPlayBilling(): Promise<PlayStatus> {
  if (!isAndroidApp) return Promise.resolve("unavailable");
  if (!cdv()) return Promise.resolve("unavailable");
  if (init) return init;
  init = (async (): Promise<PlayStatus> => {
    let cfg;
    try { cfg = await account.playConfig(); } catch (e) { init = null; return (e as { status?: number }).status === 401 ? "signed_out" : "error"; }
    if (!cfg.configured || (!cfg.products.pro && !cfg.products.elite)) { init = null; return "not_configured"; }
    products = cfg.products;
    const { store, ProductType, Platform } = cdv()!;
    store.applicationUsername = () => cfg.accountTag; // already a server-side hash of the FINOVA user id
    store.obfuscator = "disabled"; // send the server tag as-is so the server can match obfuscatedExternalAccountId
    store.register(Object.values(products).filter(Boolean).map((id) => ({ id: id!, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY })));

    // Server-side verification for every approved transaction.
    store.validator = (body: ValidatorBody, cb: ValidatorCb) => {
      const token = body.transaction?.purchaseToken;
      if (!token) return cb({ ok: false, code: 6778003, message: "No purchase token" });
      account.verifyPlay(token)
        .then(() => cb({ ok: true, data: { id: body.id, latest_receipt: true, transaction: body.transaction } }))
        .catch((e: Error & { status?: number }) => cb({ ok: false, code: e.status && e.status < 500 ? 6778003 : 6778001, status: e.status, message: e.message }));
    };
    store.when()
      .approved((t) => { t.verify(); })
      .verified((r: { finish: () => Promise<void> }) => { r.finish(); refreshAccount(); });
    store.error((e) => { lastError = e.message; });
    const errs = await store.initialize([Platform.GOOGLE_PLAY]);
    if (errs.length) lastError = errs.map((x) => x.message).join("; ");
    return "ready";
  })();
  return init;
}

export const playError = () => lastError;

export function playProducts(): PlayProduct[] {
  const c = cdv();
  if (!c) return [];
  return (["pro", "elite"] as const).flatMap((plan) => {
    const id = products[plan];
    const p = id ? c.store.get(id, c.Platform.GOOGLE_PLAY) : undefined;
    return id && p ? [{ plan, productId: id, title: p.title, price: p.offers[0]?.pricingPhases[0]?.price ?? p.pricing?.price ?? null, owned: p.owned }] : [];
  });
}

/**
 * Starts a Google Play purchase. Resolves when Google Play's sheet closes; the plan only changes after the
 * server verifies the token (watch useAccount()). Upgrades/downgrades between Pro and Elite replace the existing
 * Play subscription instead of creating a second one.
 */
export async function buyWithPlay(plan: PlanId): Promise<{ ok: boolean; cancelled?: boolean; message?: string }> {
  const status = await initPlayBilling();
  if (status !== "ready") return { ok: false, message: statusMessage(status) };
  const c = cdv()!;
  const id = products[plan as "pro" | "elite"];
  const product = id ? c.store.get(id, c.Platform.GOOGLE_PLAY) : undefined;
  const offer = product?.offers[0];
  if (!offer) return { ok: false, message: "This plan isn't available on Google Play yet. Please try again later." };
  const existing = currentPlayToken();
  const err = await offer.order(existing ? { googlePlay: { oldPurchaseToken: existing, replacementMode: 1 /* WITH_TIME_PRORATION */ } } : undefined);
  if (err) return err.code === c.ErrorCode.PAYMENT_CANCELLED ? { ok: false, cancelled: true } : { ok: false, message: err.message };
  return { ok: true };
}

function currentPlayToken(): string | null {
  const c = cdv();
  const owned = c?.store.localReceipts.flatMap((r) => r.transactions).find((t) => t.products.some((p) => Object.values(products).includes(p.id)) && t.state !== "finished_expired");
  return owned ? tokenOf(owned) || null : null;
}

/** Restore: asks Google Play for this Google account's subscriptions and lets the server verify each one. */
export async function restorePlayPurchases(): Promise<{ restored: number; message: string }> {
  const status = await initPlayBilling();
  if (status !== "ready") return { restored: 0, message: statusMessage(status) };
  const c = cdv()!;
  const err = await c.store.restorePurchases();
  if (err) return { restored: 0, message: err.message };
  const tokens = [...new Set(c.store.localReceipts.flatMap((r) => r.transactions).map(tokenOf).filter(Boolean))];
  if (!tokens.length) return { restored: 0, message: "No FINOVA subscriptions were found for the Google account on this device." };
  const r = await account.restorePlay(tokens);
  const n = r.results.filter((x) => x.ok).length;
  return { restored: n, message: n ? `Restored ${n} subscription${n > 1 ? "s" : ""}.` : r.results.find((x) => x.error)?.error ?? "Nothing to restore." };
}

/** Opens Google Play's subscription centre (cancel, change payment method, resubscribe). */
export async function managePlaySubscriptions() {
  const c = cdv();
  if (c) await c.store.manageSubscriptions(c.Platform.GOOGLE_PLAY);
}

export function statusMessage(s: PlayStatus): string {
  switch (s) {
    case "unavailable": return "Google Play Billing is only available in the FINOVA Android app.";
    case "not_configured": return "Google Play memberships aren't switched on yet. The FINOVA team still needs to finish the Play Console setup.";
    case "signed_out": return "Sign in to your FINOVA account first.";
    case "error": return "Couldn't reach FINOVA. Check your connection and try again.";
    default: return "";
  }
}
