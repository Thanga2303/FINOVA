import { Html } from "@react-three/drei";
import { useEffect, useState, type ComponentProps } from "react";

/**
 * drei's <Html>, mounted one frame after the canvas is ready.
 * Works around a drei 10 issue where an Html that mounts before the canvas event target is connected
 * gets its internal React root recreated without its content (the first label in a scene renders empty).
 */
export default function Label(props: ComponentProps<typeof Html>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready ? <Html {...props} /> : null;
}
