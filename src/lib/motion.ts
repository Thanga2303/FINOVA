/** Device/motion helpers shared by CSS effects and 3D scenes (no three.js imports here, so pages stay light). */
export type Quality = "high" | "medium" | "low";

export const prefersReducedMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "low";
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (prefersReducedMotion() || w < 640 || cores <= 2 || mem <= 2) return "low";
  if (w < 1024 || cores <= 4 || mem <= 4) return "medium";
  return "high";
}
