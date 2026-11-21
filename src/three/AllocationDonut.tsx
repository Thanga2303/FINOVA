import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Label from "./Label";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Stage from "./Stage";

export type Slice = { name: string; value: number; color: string };

function Segment({ s, start, angle, total, active, onHover }: { s: Slice; start: number; angle: number; total: number; active: boolean; onHover: (n: string | null) => void }) {
  const ref = useRef<THREE.Group>(null);
  const mid = start + angle / 2;
  const dir = useMemo(() => new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0), [mid]);
  useFrame(() => {
    if (!ref.current) return;
    const target = active ? 0.18 : 0;
    ref.current.position.lerp(dir.clone().multiplyScalar(target), 0.15);
    ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, active ? 1.6 : 1, 0.15);
  });
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, start]} onPointerOver={(e) => { e.stopPropagation(); onHover(s.name); }} onPointerOut={() => onHover(null)}>
        <torusGeometry args={[1.25, 0.42, 24, Math.max(8, Math.round(96 * (angle / (Math.PI * 2)))), Math.max(0.001, angle - 0.025)]} />
        <meshStandardMaterial color={s.color} metalness={0.35} roughness={0.3} emissive={s.color} emissiveIntensity={active ? 0.55 : 0.18} />
      </mesh>
      {active && (
        <Label position={[Math.cos(mid) * 2.15, Math.sin(mid) * 2.15, 0.5]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-xl border border-line bg-bg2/90 px-3 py-1.5 text-xs shadow-xl">
            <div className="font-semibold">{s.name}</div>
            <div className="text-muted">₹{Math.round(s.value).toLocaleString("en-IN")} · {((s.value / total) * 100).toFixed(1)}%</div>
          </div>
        </Label>
      )}
    </group>
  );
}

function Donut({ slices, active, setActive, spin }: { slices: Slice[]; active: string | null; setActive: (n: string | null) => void; spin: boolean }) {
  const g = useRef<THREE.Group>(null);
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  useFrame((_, dt) => { if (g.current && spin && !active) g.current.rotation.z += dt * 0.15; });
  let acc = 0;
  return (
    <group rotation={[-0.75, 0, 0]}>
      <group ref={g}>
        {slices.map((s) => {
          const angle = (s.value / total) * Math.PI * 2;
          const seg = <Segment key={s.name} s={s} start={acc} angle={angle} total={total} active={active === s.name} onHover={setActive} />;
          acc += angle;
          return seg;
        })}
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.5]}>
        <cylinderGeometry args={[2.1, 2.1, 0.02, 64]} />
        <meshStandardMaterial color="#0b1730" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** Interactive 3D asset-allocation donut. Drag to rotate; hover or use the legend to highlight a slice. */
export default function AllocationDonut({ slices, active, setActive, fallback }: { slices: Slice[]; active: string | null; setActive: (n: string | null) => void; fallback: React.ReactNode }) {
  const [interacting, setInteracting] = useState(false);
  return (
    <Stage className="h-full w-full" label={`3D allocation chart: ${slices.map((s) => s.name).join(", ")}`} camera={{ position: [0, 0, 6.2], fov: 42 }} fallback={fallback} interactive>
      {(q) => (
        <>
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 5, 6]} intensity={2.4} />
          <pointLight position={[-4, -3, 3]} intensity={22} color="#00D4FF" />
          <Donut slices={slices} active={active} setActive={setActive} spin={!interacting && q !== "low"} />
          <OrbitControls enableZoom={false} enablePan={false} onStart={() => setInteracting(true)} onEnd={() => setInteracting(false)} minPolarAngle={Math.PI / 4} maxPolarAngle={(3 * Math.PI) / 4} />
        </>
      )}
    </Stage>
  );
}
