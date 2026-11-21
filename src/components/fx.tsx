import { animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "../lib/motion";

/** Glass card that tilts in 3D towards the pointer (CSS transforms only, no WebGL). Disabled for touch and reduced motion. */
export function TiltCard({ children, className = "", max = 8, glow = true }: { children: ReactNode; className?: string; max?: number; glow?: boolean }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glowBg = useTransform([gx, gy], ([x, y]) => `radial-gradient(420px circle at ${x} ${y}, color-mix(in srgb, var(--cyan) 14%, transparent), transparent 45%)`);
  const enabled = typeof window !== "undefined" && !prefersReducedMotion() && window.matchMedia?.("(hover: hover)").matches;
  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        className={`relative h-full glass rounded-3xl overflow-hidden ${className}`}
        style={enabled ? { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" } : undefined}
        onPointerMove={(e) => {
          if (!enabled) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}
        whileHover={enabled ? { y: -4 } : undefined}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {glow && enabled && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 hover-glow"
            style={{ background: glowBg }} />
        )}
        <div style={enabled ? { transform: "translateZ(24px)" } : undefined} className="relative h-full">{children}</div>
      </motion.div>
    </div>
  );
}

/** Animated number counter for financial values. Shows the final value immediately when motion is reduced. */
export function CountUp({ value, format, duration = 1.2 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const prev = useRef(prefersReducedMotion() ? value : 0);
  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(value)) { setShown(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    prev.current = value;
    return () => c.stop();
  }, [value, duration]);
  return <span className="tabular-nums">{format(shown)}</span>;
}

/** Subtle animated grid + glow background (pure CSS) for "stage" sections. */
export function GridBackdrop({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 grid-backdrop ${className}`} />;
}
