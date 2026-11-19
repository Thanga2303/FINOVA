import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { lowPower } from "../components/ui";

const CYAN = new THREE.Color("#00D4FF");
const EMERALD = new THREE.Color("#00E6A0");
const VIOLET = new THREE.Color("#8B5CF6");
const GOLD = new THREE.Color("#F5C451");

function fibonacciSphere(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = phi * i;
    pts.push(new THREE.Vector3(Math.cos(t) * rad * r, y * r, Math.sin(t) * rad * r));
  }
  return pts;
}

function arc(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(r * 1.45);
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(48);
}

function Globe({ low }: { low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const R = 1.6;
  const { positions, colors, arcs } = useMemo(() => {
    const pts = fibonacciSphere(low ? 900 : 2200, R);
    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions.set([p.x, p.y, p.z], i * 3);
      const c = CYAN.clone().lerp(EMERALD, (p.y / R + 1) / 2);
      colors.set([c.r, c.g, c.b], i * 3);
    });
    const hubs = [0, 140, 333, 512, 700, 820].map((i) => pts[Math.min(i, pts.length - 1)]);
    const curves = hubs.flatMap((h, i) => [arc(h, hubs[(i + 2) % hubs.length], R), arc(h, hubs[(i + 3) % hubs.length], R)]);
    const arcs = curves.map((pts, i) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: i % 2 ? VIOLET : EMERALD, transparent: true, opacity: 0.55 });
      return new THREE.Line(geo, mat);
    });
    return { positions, colors, arcs };
  }, [low]);

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.12;
    const { x, y } = state.pointer;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.25 + 0.2, 0.05);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, x * 0.15, 0.05);
  });

  return (
    <group ref={group} rotation={[0.2, 0, 0.1]}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshBasicMaterial color="#06142a" transparent opacity={0.85} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.022} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>
      {arcs.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[R * 1.35, 0.004, 8, 160]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, 0.4, 0]}>
        <torusGeometry args={[R * 1.55, 0.003, 8, 160]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Coin({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.9 * speed;
  });
  return (
    <Float speed={1.5 * speed} rotationIntensity={0.6} floatIntensity={1.2}>
      <group ref={ref} position={position} scale={scale} rotation={[Math.PI / 2.4, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.06, 48]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 48]} />
          <meshStandardMaterial color="#fff1c1" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) a.set([(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6 - 2], i * 3);
    return a;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.015;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color={CYAN} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function HeroScene() {
  const low = lowPower();
  return (
    <Canvas
      dpr={low ? [1, 1.25] : [1, 2]}
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance" }}
      frameloop={window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "demand" : "always"}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 3, 4]} intensity={40} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={20} color="#00D4FF" />
      <Globe low={low} />
      <Coin position={[2.3, 1.1, 0.6]} scale={0.9} />
      <Coin position={[-2.4, -0.9, 0.4]} scale={0.75} speed={0.8} />
      {!low && <Coin position={[1.9, -1.5, 1]} scale={0.6} speed={1.2} />}
      {!low && <Coin position={[-1.8, 1.5, -0.5]} scale={0.55} speed={0.7} />}
      <Particles count={low ? 250 : 700} />
    </Canvas>
  );
}
