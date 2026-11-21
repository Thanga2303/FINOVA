import { platform } from "./native/platform";

/**
 * Anonymous product analytics for revenue and conversion reporting. Only whitelisted event names and small,
 * non-personal properties are sent; the server aggregates them into daily counters (no user ids, no IPs stored).
 * Purchases themselves are counted on the server from verified payments, never from these client events.
 */
export type MetricEvent =
  | "pricing_view" | "checkout_view" | "checkout_start" | "paywall_view" | "upgrade_click"
  | "ad_consent" | "ad_impression" | "ad_paid";

let queue: { e: MetricEvent; p: Record<string, string | number>; t: number }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function track(e: MetricEvent, p: Record<string, string | number> = {}) {
  queue.push({ e, p: { ...p, platform }, t: Date.now() });
  if (queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 5000);
}

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 50);
  fetch("/api/metrics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }), keepalive: true, credentials: "same-origin" }).catch(() => {});
}
if (typeof window !== "undefined") window.addEventListener("pagehide", flush);
