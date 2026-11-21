import { useFrame } from "@react-three/fiber";
import Label from "./Label";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Stage from "./Stage";

export type PathLevel = { name: string; min: number };

/** A glowing 3D path through FINOVA's five levels. The traveller marks your current XP; reached levels light up. */
function Path({ levels, xp }: { levels: PathLevel[]; xp: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, -0.9, 0.6), new THREE.Vector3(-2.2, -0.2, -0.6), new THREE.Vector3(0, 0.25, 0.5),
    new THREE.Vector3(2.1, 0.75, -0.6), new THREE.Vector3(4.2, 1.35, 0.4),
  ]), []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 160, 0.045, 10, false), [curve]);
  const nodes = levels.map((_, i) => curve.getPoint(i / (levels.length - 1)));
  // progress along the path (piecewise between level thresholds)
  let prog = 0;
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i].min, b = levels[i + 1].min;
    if (xp >= b) prog = (i + 1) / (levels.length - 1);
    else if (xp >= a) { prog = (i + (xp - a) / (b - a)) / (levels.length - 1); break; }
  }
  const walker = useRef<THREE.Mesh>(null);
  const shown = useRef(0);
  const group = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    shown.current = THREE.MathUtils.lerp(shown.current, prog, Math.min(1, dt * 1.5));
    if (walker.current) {
      walker.current.position.copy(curve.getPoint(Math.min(0.999, shown.current)));
      walker.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.12);
    }
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, s.pointer.x * 0.15, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -s.pointer.y * 0.08, 0.05);
    }
  });
  return (
    <group ref={group} position={[0, 0.55, 0]} scale={0.92}>
      <mesh geometry={tube}>
        <meshStandardMaterial color="#1b3156" emissive="#00D4FF" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>
      {levels.map((l, i) => {
        const reached = xp >= l.min;
        const current = reached && (i === levels.length - 1 || xp < levels[i + 1].min);
        return (
          <group key={l.name} position={nodes[i]}>
            <mesh>
              <sphereGeometry args={[current ? 0.2 : 0.15, 32, 32]} />
              <meshStandardMaterial color={reached ? "#00E6A0" : "#334155"} emissive={reached ? "#00E6A0" : "#0b1220"} emissiveIntensity={current ? 1.4 : reached ? 0.6 : 0.1} />
            </mesh>
            {current && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.32, 0.012, 8, 64]} />
                <meshBasicMaterial color="#00E6A0" transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        );
      })}
      {levels.map((l, i) => {
        const reached = xp >= l.min;
        const current = reached && (i === levels.length - 1 || xp < levels[i + 1].min);
        const p = nodes[i];
        return (
          <Label key={`label-${l.name}`} position={[p.x, p.y + (i % 2 ? -0.5 : 0.55), p.z]} center zIndexRange={[5, 0]} distanceFactor={6}>
            <div className={`pointer-events-none whitespace-nowrap rounded-xl border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${current ? "border-emerald/60 bg-emerald/15 text-emerald" : reached ? "border-line bg-bg2/80 text-text" : "border-line bg-bg2/60 text-muted"}`}>
              {current && "You are here · "}{l.name}<span className="font-normal text-muted"> · {l.min} XP</span>
            </div>
          </Label>
        );
      })}
      <mesh ref={walker}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshBasicMaterial color="#E6FBFF" />
      </mesh>
      <pointLight position={[0, 1.5, 2]} intensity={14} color="#00D4FF" />
    </group>
  );
}

export default function LearningPath({ levels, xp }: { levels: PathLevel[]; xp: number }) {
  return (
    <Stage className="h-full w-full" label={`Learning journey from ${levels[0].name} to ${levels.at(-1)!.name}. You have ${xp} XP.`} camera={{ position: [0, 0.25, 7], fov: 46 }}
      fallback={<ol className="h-full flex items-center justify-between gap-2 px-4">{levels.map((l) => <li key={l.name} className={`text-center text-xs ${xp >= l.min ? "text-emerald" : "text-muted"}`}><div className={`mx-auto w-4 h-4 rounded-full mb-1 ${xp >= l.min ? "bg-emerald" : "bg-line"}`} />{l.name}</li>)}</ol>}>
      {() => (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 5]} intensity={1.6} />
          <Path levels={levels} xp={xp} />
        </>
      )}
    </Stage>
  );
}
