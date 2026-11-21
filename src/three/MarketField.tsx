import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Label from "./Label";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Stage from "./Stage";

export type FieldStock = { symbol: string; label: string; changePct: number };

const UP = new THREE.Color("#00E6A0");
const DOWN = new THREE.Color("#E11D48");
const FLAT = new THREE.Color("#64708a");

/**
 * Real-data 3D market field: one bar per tracked stock, height = today's % change (up above the floor, down below),
 * colour = direction, glow = size of move. Bars are sorted from biggest loser to biggest gainer.
 */
function Bars({ stocks, onPick }: { stocks: FieldStock[]; onPick: (s: string) => void }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const [hover, setHover] = useState<number | null>(null);
  const sorted = useMemo(() => [...stocks].sort((a, b) => a.changePct - b.changePct), [stocks]);
  const cols = 13;
  const rows = Math.ceil(sorted.length / cols);
  const maxAbs = Math.max(1, ...sorted.map((s) => Math.abs(s.changePct)));
  const layout = useMemo(() => sorted.map((s, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const h = Math.max(0.04, (Math.abs(s.changePct) / maxAbs) * 2.2);
    const y = s.changePct >= 0 ? h / 2 : -h / 2;
    return { x: (c - (cols - 1) / 2) * 0.52, z: (r - (rows - 1) / 2) * 0.62, h, y };
  }), [sorted, maxAbs, rows]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const grow = useRef(0);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    grow.current = Math.min(1, grow.current + dt * 0.9);
    const e = 1 - Math.pow(1 - grow.current, 3);
    layout.forEach((p, i) => {
      const lift = hover === i ? 1.12 : 1;
      dummy.position.set(p.x, p.y * e, p.z);
      dummy.scale.set(0.34, p.h * e * lift, 0.34);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      const s = sorted[i];
      const col = Math.abs(s.changePct) < 0.05 ? FLAT : s.changePct > 0 ? UP : DOWN;
      mesh.current!.setColorAt(i, col.clone().multiplyScalar(hover === i ? 1.5 : 0.75 + 0.5 * (Math.abs(s.changePct) / maxAbs)));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  const hp = hover != null ? layout[hover] : null;
  const hs = hover != null ? sorted[hover] : null;
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, sorted.length]}
        onPointerMove={(e) => { e.stopPropagation(); if (e.instanceId != null) setHover(e.instanceId); }}
        onPointerOut={() => setHover(null)}
        onClick={(e) => { if (e.instanceId != null) onPick(sorted[e.instanceId].symbol); }}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.25} roughness={0.35} toneMapped={false} />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cols * 0.52 + 1.2, rows * 0.62 + 1.2]} />
        <meshStandardMaterial color="#0d1a33" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[8, 16, "#1e3a5f", "#13243f"]} position={[0, 0.001, 0]} />
      {hp && hs && (
        <Label position={[hp.x, hs.changePct >= 0 ? hp.h + 0.35 : 0.35, hp.z]} center zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-xl border border-line bg-bg2/95 px-3 py-1.5 text-xs shadow-xl">
            <div className="font-semibold">{hs.label}</div>
            <div className={hs.changePct >= 0 ? "text-emerald" : "text-rose"}>{hs.changePct >= 0 ? "+" : ""}{hs.changePct.toFixed(2)}% today</div>
            <div className="text-[10px] text-muted">Click to open</div>
          </div>
        </Label>
      )}
    </group>
  );
}

export default function MarketField({ stocks, onPick, fallback }: { stocks: FieldStock[]; onPick: (s: string) => void; fallback: React.ReactNode }) {
  return (
    <Stage className="h-full w-full" label="3D market field: one bar per tracked stock, height shows today's percentage change" camera={{ position: [0, 3.6, 6.4], fov: 45 }} fallback={fallback} interactive>
      {(q) => (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 8, 5]} intensity={2.2} />
          <pointLight position={[-5, 2, 3]} intensity={20} color="#00D4FF" />
          <Bars stocks={stocks} onPick={onPick} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={q === "high"} autoRotateSpeed={0.35} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.05} />
        </>
      )}
    </Stage>
  );
}
