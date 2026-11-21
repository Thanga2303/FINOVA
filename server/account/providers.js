// Payment providers. Secrets are read from the server environment only and never sent to the browser.
// Nothing here charges money unless live provider keys are configured in .env.
import crypto from "node:crypto";
import fs from "node:fs";

const env = (k) => process.env[k]?.trim() || "";
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------------- Test mode ----------------
export const testMode = () => env("BILLING_TEST_MODE").toLowerCase() === "true";

// ---------------- Razorpay (web) ----------------
export const razorpay = {
  configured: () => Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET") && env("RAZORPAY_PLAN_PRO") && env("RAZORPAY_PLAN_ELITE")),
  live: () => env("RAZORPAY_KEY_ID").startsWith("rzp_live_"),
  keyId: () => env("RAZORPAY_KEY_ID"), // public identifier, safe for Checkout
  planId: (plan) => (plan === "pro" ? env("RAZORPAY_PLAN_PRO") : plan === "elite" ? env("RAZORPAY_PLAN_ELITE") : ""),
  planFromProviderPlan: (pid) => (pid === env("RAZORPAY_PLAN_PRO") ? "pro" : pid === env("RAZORPAY_PLAN_ELITE") ? "elite" : null),

  async api(method, pathname, body) {
    const auth = Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
    const r = await fetch(`https://api.razorpay.com/v1${pathname}`, {
      method, headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j?.error?.description || `Razorpay error ${r.status}`), { status: 502 });
    return j;
  },

  createSubscription(plan, user) {
    return this.api("POST", "/subscriptions", {
      plan_id: this.planId(plan), total_count: 120, customer_notify: 1, quantity: 1,
      notes: { finova_user: user.id, finova_plan: plan },
    });
  },

  /** Checkout handler signature: HMAC_SHA256(payment_id + "|" + subscription_id, key_secret). */
  verifyCheckoutSignature({ paymentId, subscriptionId, signature }) {
    const expected = crypto.createHmac("sha256", env("RAZORPAY_KEY_SECRET")).update(`${paymentId}|${subscriptionId}`).digest("hex");
    return safeEqual(expected, signature);
  },

  /** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
  verifyWebhook(raw, signature) {
    const secret = env("RAZORPAY_WEBHOOK_SECRET");
    if (!secret || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    return safeEqual(expected, signature);
  },

  fetchSubscription(id) { return this.api("GET", `/subscriptions/${encodeURIComponent(id)}`); },
  cancelAtCycleEnd(id) { return this.api("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: 1 }); },
};

// ---------------- Google Play Billing (Android) ----------------
let playToken = null; // { token, exp }

function serviceAccount() {
  const file = env("GOOGLE_PLAY_SERVICE_ACCOUNT_FILE");
  if (!file || !fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

export const googlePlay = {
  configured: () => Boolean(env("GOOGLE_PLAY_PACKAGE_NAME") && env("PLAY_PRODUCT_PRO") && env("PLAY_PRODUCT_ELITE") && serviceAccount()),
  planFromProduct: (pid) => (pid === env("PLAY_PRODUCT_PRO") ? "pro" : pid === env("PLAY_PRODUCT_ELITE") ? "elite" : null),
  productFor: (plan) => (plan === "pro" ? env("PLAY_PRODUCT_PRO") : plan === "elite" ? env("PLAY_PRODUCT_ELITE") : ""),
  /** The Android app must pass this as obfuscatedAccountId so purchases are bound to the FINOVA account. */
  accountTag: (userId) => crypto.createHash("sha256").update(`finova:${userId}`).digest("hex").slice(0, 64),

  async accessToken() {
    if (playToken && playToken.exp > Date.now() + 60e3) return playToken.token;
    const sa = serviceAccount();
    if (!sa) throw Object.assign(new Error("Google Play service account not configured."), { status: 503 });
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
    const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    if (!r.ok) throw Object.assign(new Error("Could not authenticate with Google Play."), { status: 502 });
    playToken = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
    return playToken.token;
  },

  /** Verifies a subscription purchase token directly with Google (purchases.subscriptionsv2.get). */
  async verify(purchaseToken) {
    const pkg = env("GOOGLE_PLAY_PACKAGE_NAME");
    const token = await this.accessToken();
    const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error("Google Play could not verify this purchase."), { status: 400 });
    return j;
  },

  async acknowledge(productId, purchaseToken) {
    const pkg = env("GOOGLE_PLAY_PACKAGE_NAME");
    const token = await this.accessToken();
    await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(15000),
    });
  },
};

export function providerStatus() {
  return {
    testMode: testMode(),
    razorpay: { configured: razorpay.configured(), live: razorpay.configured() && razorpay.live() },
    googlePlay: { configured: googlePlay.configured() },
  };
}
