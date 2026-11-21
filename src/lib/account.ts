import { useSyncExternalStore } from "react";
import { clientHeaders } from "./native/platform";

/**
 * Account & membership state. Entitlements come ONLY from the server (/api/auth/me), which reads the
 * verified subscription record. Nothing here is persisted in the browser, so it cannot be tampered with
 * to unlock features; server-side endpoints re-check the plan on every gated request anyway.
 */
export type Features = {
  paperTrading: boolean; basicCharts: boolean; advancedIndicators: boolean; academyLevels: string[]; masterclasses: boolean;
  portfolioAnalytics: "basic" | "advanced" | "insights"; tradingAnalytics: "basic" | "advanced" | "report"; performanceReports: boolean;
  journal: "basic" | "full"; journalLimit: number | null; aiDailyLimit: number; adFree: boolean;
};
export type PlanId = "free" | "pro" | "elite";
export type Status = {
  user: { id: string; email: string; name: string; createdAt: number } | null;
  plan: { id: PlanId; name: string; tier: number };
  features: Features;
  subscription: null | { plan: PlanId; status: string; provider: string; test: boolean; currentPeriodEnd: number; cancelAtPeriodEnd: boolean; scheduledPlan: PlanId | null; startedAt: number };
  ai: { used: number; limit: number };
  providers: { testMode: boolean; razorpay: { configured: boolean; live: boolean }; googlePlay: { configured: boolean } };
};
export type Plan = { id: PlanId; name: string; tier: number; priceMonthly: number; currency: string; tagline: string; highlights: string[]; features: Features };

const FREE_FEATURES: Features = { paperTrading: true, basicCharts: true, advancedIndicators: false, academyLevels: ["Beginner"], masterclasses: false, portfolioAnalytics: "basic", tradingAnalytics: "basic", performanceReports: false, journal: "basic", journalLimit: 20, aiDailyLimit: 10, adFree: false };

type State = { loaded: boolean; status: Status | null };
let state: State = { loaded: false, status: null };
const subs = new Set<() => void>();
const emit = (s: Partial<State>) => { state = { ...state, ...s }; subs.forEach((f) => f()); };

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...clientHeaders(), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((j as { error?: string }).error || `Request failed (${r.status})`), { status: r.status, data: j });
  return j as T;
}

export async function refreshAccount() {
  try { emit({ loaded: true, status: await call<Status>("/api/auth/me") }); } catch { emit({ loaded: true }); }
}

export function useAccount() {
  const s = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
  const features = s.status?.features ?? FREE_FEATURES;
  return { ...s, features, plan: s.status?.plan ?? { id: "free" as PlanId, name: "Free", tier: 0 }, user: s.status?.user ?? null };
}

const set = (st: Status) => { emit({ status: st, loaded: true }); return st; };

export const account = {
  register: (email: string, password: string, name: string) => call<Status>("/api/auth/register", { email, password, name }).then(set),
  login: (email: string, password: string) => call<Status>("/api/auth/login", { email, password }).then(set),
  logout: () => call("/api/auth/logout", {}).then(refreshAccount),
  plans: () => call<{ plans: Plan[]; providers: Status["providers"] }>("/api/billing/plans"),
  checkout: (plan: PlanId, provider: "razorpay" | "test" | "google_play") => call<{ provider: string; checkoutId?: string; keyId?: string; subscriptionId?: string; amount?: number; name?: string; description?: string; prefill?: { email: string; name: string } }>("/api/billing/checkout", { plan, provider }),
  verifyTest: (checkoutId: string) => call<Status>("/api/billing/verify/test", { checkoutId }).then(set),
  verifyRazorpay: (payload: Record<string, string>) => call<Status>("/api/billing/verify/razorpay", payload).then(set),
  change: (plan: PlanId) => call<{ action: "checkout" | "scheduled"; plan?: PlanId } & Partial<Status>>("/api/billing/change", { plan }).then((r) => { if (r.action === "scheduled") refreshAccount(); return r; }),
  cancel: () => call<Status>("/api/billing/cancel", {}).then(set),
  resume: () => call<Status>("/api/billing/resume", {}).then(set),
  history: () => call<{ events: { id: string; type: string; detail: Record<string, unknown>; at: number }[]; invoices: { id: string; plan: string; amount: number; currency: string; provider: string; status: string; test: boolean; at: number; periodEnd?: number }[] }>("/api/billing/history"),
  playConfig: () => call<{ configured: boolean; products: { pro: string | null; elite: string | null }; accountTag: string }>("/api/billing/play/config"),
  verifyPlay: (purchaseToken: string) => call<Status>("/api/billing/verify/google-play", { purchaseToken }).then(set),
  restorePlay: (purchaseTokens: string[]) => call<{ results: { ok: boolean; plan?: PlanId; state?: string; error?: string }[] } & Status>("/api/billing/restore/google-play", { purchaseTokens }).then((r) => { set(r); return r; }),
  aiTicket: () => call<{ ticket: string; used: number; limit: number }>("/api/ai/ticket", {}),
};

export const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const planLabel = (id: string) => (id === "pro" ? "FINOVA Pro" : id === "elite" ? "FINOVA Elite" : "Free");

/** Loads Razorpay Checkout on demand (only when a real payment is being made). */
export function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.head.appendChild(s);
  });
}
