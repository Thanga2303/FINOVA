import { useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import Label from "./Label";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Stage, { type Quality } from "./Stage";

const CYAN = new THREE.Color("#00D4FF");
const BLUE = new THREE.Color("#2F6BFF");
const EMERALD = new THREE.Color("#00E6A0");
const GOLD = new THREE.Color("#F5C451");
const R = 1.6;

export type HeroTicker = { symbol: string; changePct: number | null };

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

/** Fresnel rim-glow shell: a small custom shader that brightens the globe's edges. */
const rimMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: CYAN.clone() }, uPow: { value: 2.6 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPow; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), uPow); gl_FragColor = vec4(uColor, f*0.9); }`,
  });

function Globe({ q, tickers }: { q: Quality; tickers: HeroTicker[] }) {
  const group = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const { positions, colors, curves, lines } = useMemo(() => {
    const pts = fibonacciSphere(q === "high" ? 2600 : q === "medium" ? 1500 : 800, R);
    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions.set([p.x, p.y, p.z], i * 3);
      const c = CYAN.clone().lerp(EMERALD, (p.y / R + 1) / 2).lerp(BLUE, Math.max(0, -p.z / R) * 0.4);
      colors.set([c.r, c.g, c.b], i * 3);
    });
    const hubs = [3, 160, 333, 512, 690, 780, 120, 420].map((i) => pts[Math.min(i, pts.length - 1)]);
    const curves = hubs.flatMap((h, i) => [hubs[(i + 2) % hubs.length], hubs[(i + 3) % hubs.length]].map((b) => {
      const mid = h.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.5);
      return new THREE.QuadraticBezierCurve3(h, mid, b);
    }));
    const lines = curves.map((c, i) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(56)), new THREE.LineBasicMaterial({ color: i % 3 === 0 ? BLUE : i % 2 ? EMERALD : CYAN, transparent: true, opacity: 0.45 })));
    return { positions, colors, curves, lines };
  }, [q]);
  const rim = useMemo(rimMaterial, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.1;
    // Mouse parallax + scroll-linked camera dolly (cinematic but subtle)
    const { x, y } = state.pointer;
    const scroll = Math.min(1, window.scrollY / 800);
    camTarget.set(x * 0.5, y * 0.3 + scroll * 0.6, 7.2 + scroll * 2.2);
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(0, scroll * 0.4, 0);
    // Data pulses travelling along the network arcs
    if (pulses.current) {
      const t = state.clock.elapsedTime;
      curves.forEach((c, i) => {
        const p = c.getPoint(((t * 0.18 + i * 0.137) % 1));
        dummy.position.copy(p);
        dummy.scale.setScalar(0.028);
        dummy.updateMatrix();
        pulses.current!.setMatrixAt(i, dummy.matrix);
      });
      pulses.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group} rotation={[0.25, 0, 0.12]}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshStandardMaterial color="#061226" roughness={0.4} metalness={0.3} transparent opacity={0.92} />
      </mesh>
      <mesh scale={1.14} material={rim}>
        <sphereGeometry args={[R, 48, 48]} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} vertexColors transparent opacity={0.95} sizeAttenuation />
      </points>
      {lines.map((l, i) => <primitive key={i} object={l} />)}
      <instancedMesh ref={pulses} args={[undefined, undefined, curves.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#E6FBFF" />
      </instancedMesh>
      <mesh rotation={[Math.PI / 2.25, 0, 0]}>
        <torusGeometry args={[R * 1.38, 0.004, 8, 180]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 1.75, 0.5, 0]}>
        <torusGeometry args={[R * 1.6, 0.003, 8, 180]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.35} />
      </mesh>
      {q !== "low" && <TickerRing tickers={tickers} />}
    </group>
  );
}

/** Real (delayed) market movers orbiting the globe as labels. Values come from FINOVA's market service. */
function TickerRing({ tickers }: { tickers: HeroTicker[] }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.y -= dt * 0.16; });
  const list = tickers.slice(0, 6);
  return (
    <group ref={ring} rotation={[0.18, 0, -0.08]}>
      {list.map((t, i) => {
        const a = (i / list.length) * Math.PI * 2;
        const up = (t.changePct ?? 0) >= 0;
        return (
          <Label key={t.symbol} position={[Math.cos(a) * R * 1.55, Math.sin(a * 2) * 0.35, Math.sin(a) * R * 1.55]} center zIndexRange={[5, 0]} distanceFactor={4.2} occlude={false}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-line bg-bg2/80 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md shadow-lg">
              <span className="text-text">{t.symbol}</span>{" "}
              <span className={up ? "text-emerald" : "text-rose"}>{t.changePct == null ? "—" : `${up ? "▲" : "▼"}${Math.abs(t.changePct).toFixed(2)}%`}</span>
            </div>
          </Label>
        );
      })}
    </group>
  );
}

function Coin({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.9 * speed; });
  return (
    <Float speed={1.4 * speed} rotationIntensity={0.5} floatIntensity={1.1}>
      <group ref={ref} position={position} scale={scale} rotation={[Math.PI / 2.4, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.06, 48]} />
          <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.22} />
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
    for (let i = 0; i < count; i++) a.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8 - 2], i * 3);
    return a;
  }, [count]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.012; });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.022} color={CYAN} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function HeroScene({ tickers = [] }: { tickers?: HeroTicker[] }) {
  return (
    <Stage className="absolute inset-0" label="Rotating 3D globe with FINOVA's market network and today's biggest movers" camera={{ position: [0, 0, 7.2], fov: 45 }}
      fallback={<div className="absolute inset-0 grid place-items-center"><div className="w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,.25),transparent_65%)]" /></div>}>
      {(q) => (
        <>
          <fog attach="fog" args={["#080d19", 7, 14]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[4, 3, 4]} intensity={45} color="#ffffff" />
          <pointLight position={[-4, -2, 2]} intensity={25} color="#00D4FF" />
          <pointLight position={[0, -3, -3]} intensity={18} color="#00E6A0" />
          <Globe q={q} tickers={tickers} />
          <Coin position={[2.4, 1.2, 0.6]} scale={0.85} />
          <Coin position={[-2.5, -1.0, 0.4]} scale={0.7} speed={0.8} />
          {q === "high" && <Coin position={[2.0, -1.6, 1]} scale={0.55} speed={1.2} />}
          <Particles count={q === "high" ? 900 : q === "medium" ? 450 : 200} />
        </>
      )}
    </Stage>
  );
}
