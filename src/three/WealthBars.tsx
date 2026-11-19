import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { inrShort, lowPower } from "../components/ui";

export type WealthPoint = { year: number; invested: number; value: number };

function Bar({ x, h, color, delay }: { x: number; h: number; color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  useFrame((state) => {
    if (!ref.current) return;
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const t = Math.min(1, Math.max(0, (state.clock.elapsedTime - t0.current - delay) / 0.8));
    const e = 1 - Math.pow(1 - t, 3);
    const cur = Math.max(0.001, h * e);
    ref.current.scale.y = cur;
    ref.current.position.y = cur / 2;
  });
  return (
    <mesh ref={ref} position={[x, 0, 0]}>
      <boxGeometry args={[0.32, 1, 0.32]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.35} emissive={color} emissiveIntensity={0.25} />
    </mesh>
  );
}

function Bars({ data }: { data: WealthPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 3.2;
  const gap = 0.9;
  const w = (data.length - 1) * gap;
  const label = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  return (
    <group position={[-w / 2, -1.6, 0]}>
      {data.map((d, i) => (
        <group key={d.year} position={[i * gap, 0, 0]}>
          <Bar x={-0.18} h={(d.invested / max) * H} color="#00D4FF" delay={i * 0.05} />
          <Bar x={0.18} h={(d.value / max) * H} color="#00E6A0" delay={i * 0.05 + 0.1} />
          {label.has(i) && (
            <Html position={[0, (d.value / max) * H + 0.35, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap text-[11px] font-semibold text-emerald bg-bg2/80 border border-line rounded-md px-1.5 py-0.5">
                Yr {d.year}: {inrShort(d.value)}
              </div>
            </Html>
          )}
        </group>
      ))}
      <mesh position={[w / 2, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 2, 3]} />
        <meshStandardMaterial color="#0d1830" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default function WealthBars({ data }: { data: WealthPoint[] }) {
  const low = lowPower();
  const z = Math.max(9, (data.length - 1) * 0.9 * 1.15 + 4);
  return (
    <Canvas dpr={low ? [1, 1.25] : [1, 2]} camera={{ position: [0, 1.4, z], fov: 45 }} gl={{ alpha: true, antialias: !low }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 5]} intensity={2.2} />
      <pointLight position={[-5, 2, 3]} intensity={20} color="#8B5CF6" />
      <Bars key={data.map((d) => Math.round(d.value)).join(",")} data={data} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!low} autoRotateSpeed={0.6} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}
