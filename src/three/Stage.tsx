import { Canvas, type CanvasProps } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { detectQuality, prefersReducedMotion, type Quality } from "../lib/motion";

export type { Quality };
export { prefersReducedMotion };

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

type StageProps = {
  children: (q: Quality) => ReactNode;
  /** Shown before the scene is in view, when WebGL is unavailable, or while it loads. */
  fallback?: ReactNode;
  className?: string;
  camera?: CanvasProps["camera"];
  label: string;
  /** Keep rendering only while the user can see it. */
  interactive?: boolean;
};

/**
 * Reusable 3D stage: mounts the WebGL canvas only when scrolled near, pauses rendering when off-screen,
 * adapts pixel ratio to device performance, honours reduced motion, and falls back gracefully without WebGL.
 * React Three Fiber disposes geometries/materials automatically when the canvas unmounts.
 */
export default function Stage({ children, fallback = null, className = "", camera, label, interactive = false }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [q, setQ] = useState<Quality>(detectQuality);
  const [ok] = useState(webglOK);
  const reduce = prefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setNear(true);
    }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const dpr: [number, number] = q === "high" ? [1, 2] : q === "medium" ? [1, 1.5] : [1, 1.25];
  return (
    <div ref={ref} className={/\b(absolute|fixed)\b/.test(className) ? className : `relative ${className}`} role="img" aria-label={label}>
      {near && ok ? (
        <Canvas
          dpr={dpr}
          camera={camera ?? { position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: q !== "low", alpha: true, powerPreference: "high-performance" }}
          frameloop={!visible ? "never" : reduce ? "demand" : "always"}
          style={{ touchAction: interactive ? "pan-y" : "auto" }}
        >
          <PerformanceMonitor onDecline={() => setQ((x) => (x === "high" ? "medium" : "low"))} />
          <AdaptiveDpr pixelated={false} />
          {children(q)}
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}
