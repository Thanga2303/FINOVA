export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "processing";

const CSS_COLORS: Record<OrbState, string> = { idle: "0,212,255", listening: "0,230,160", thinking: "124,140,255", speaking: "0,212,255", processing: "47,107,255" };

/** Lightweight CSS version of the orb, used on small screens and as the WebGL fallback. */
export function OrbLite({ state, size = 40 }: { state: OrbState; size?: number }) {
  const c = CSS_COLORS[state];
  return (
    <span aria-hidden className={`relative inline-block rounded-full orb-lite orb-${state}`} style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.85), rgba(${c},.9) 30%, rgba(${c},.25) 65%, transparent 72%)`, boxShadow: `0 0 ${size / 2}px rgba(${c},.55)` }} />
  );
}

