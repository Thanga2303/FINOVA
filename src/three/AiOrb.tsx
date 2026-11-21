import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Stage from "./Stage";

import { OrbLite, type OrbState } from "../components/OrbLite";
export type { OrbState };

/** Per-state tuning: surface wobble, speed, glow colour. */
const STATES: Record<OrbState, { amp: number; speed: number; color: string; glow: number }> = {
  idle: { amp: 0.05, speed: 0.6, color: "#00D4FF", glow: 0.8 },
  listening: { amp: 0.09, speed: 1.2, color: "#00E6A0", glow: 1.2 },
  thinking: { amp: 0.07, speed: 2.2, color: "#7C8CFF", glow: 1.0 },
  speaking: { amp: 0.12, speed: 1.6, color: "#00D4FF", glow: 1.4 },
  processing: { amp: 0.08, speed: 2.8, color: "#2F6BFF", glow: 1.1 },
};

const vertex = `
uniform float uTime; uniform float uAmp; varying vec3 vN; varying vec3 vV; varying float vD;
void main(){
  vec3 p = position;
  float d = sin(p.x*3.1+uTime)*sin(p.y*3.7+uTime*1.3)*sin(p.z*2.9+uTime*0.8);
  p += normal * d * uAmp;
  vD = d;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const fragment = `
uniform vec3 uColor; uniform float uGlow; varying vec3 vN; varying vec3 vV; varying float vD;
void main(){
  float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
  vec3 core = mix(vec3(0.02,0.06,0.14), uColor, 0.35 + vD*0.4);
  vec3 col = core + uColor * fres * uGlow * 1.6;
  gl_FragColor = vec4(col, 0.72 + fres*0.28);
}`;

function Orb({ state, level }: { state: OrbState; level: React.MutableRefObject<number> }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment, transparent: true,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.05 }, uColor: { value: new THREE.Color("#00D4FF") }, uGlow: { value: 1 } },
  }), []);
  const body = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Group>(null);
  const parts = useRef<THREE.Points>(null);
  const target = useMemo(() => new THREE.Color(), []);
  const partPos = useMemo(() => {
    const n = 220, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 * 3, r = 1.45 + (i % 7) * 0.035;
      a.set([Math.cos(t) * r, Math.sin(t * 1.5) * 0.25, Math.sin(t) * r], i * 3);
    }
    return a;
  }, []);

  useFrame((s, dt) => {
    const cfg = STATES[state];
    const t = s.clock.elapsedTime;
    const u = mat.uniforms;
    u.uTime.value += dt * cfg.speed;
    const speak = state === "speaking" ? level.current : 0;
    u.uAmp.value = THREE.MathUtils.lerp(u.uAmp.value, cfg.amp + speak * 0.12, 0.08);
    u.uGlow.value = THREE.MathUtils.lerp(u.uGlow.value, cfg.glow + speak * 0.8, 0.08);
    target.set(cfg.color);
    (u.uColor.value as THREE.Color).lerp(target, 0.06);
    level.current *= 0.9; // decay speech pulse
    if (body.current) {
      body.current.position.y = Math.sin(t * 0.8) * 0.08; // idle float
      body.current.rotation.y += dt * 0.2;
      const pulse = 1 + speak * 0.08;
      body.current.scale.setScalar(THREE.MathUtils.lerp(body.current.scale.x, pulse, 0.2));
    }
    // Listening: expanding glow rings
    if (rings.current) {
      rings.current.visible = state === "listening";
      rings.current.children.forEach((r, i) => {
        const k = ((t * 0.7 + i / 3) % 1);
        r.scale.setScalar(1.1 + k * 0.9);
        ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.6;
      });
    }
    // Processing: circular energy waves on the horizontal plane
    if (waves.current) {
      waves.current.visible = state === "processing";
      waves.current.children.forEach((r, i) => {
        const k = ((t * 1.1 + i / 4) % 1);
        r.scale.setScalar(0.9 + k * 1.3);
        ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7;
      });
    }
    // Thinking: rotating particle pattern
    if (parts.current) {
      parts.current.visible = state === "thinking" || state === "processing";
      parts.current.rotation.y += dt * (state === "thinking" ? 1.4 : 0.6);
      parts.current.rotation.x = Math.sin(t * 0.5) * 0.4;
    }
  });

  return (
    <group>
      <mesh ref={body} material={mat}>
        <icosahedronGeometry args={[1, 32]} />
      </mesh>
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}><ringGeometry args={[1.02, 1.06, 96]} /><meshBasicMaterial color="#00E6A0" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        ))}
      </group>
      <group ref={waves} rotation={[Math.PI / 2.3, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}><torusGeometry args={[1.05, 0.012, 8, 96]} /><meshBasicMaterial color="#2F6BFF" transparent opacity={0.6} depthWrite={false} /></mesh>
        ))}
      </group>
      <points ref={parts}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[partPos, 3]} /></bufferGeometry>
        <pointsMaterial size={0.035} color="#9FB2FF" transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  );
}

export default function AiOrb({ state, level, size = 260 }: { state: OrbState; level: React.MutableRefObject<number>; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="mx-auto">
      <Stage className="w-full h-full" label={`FINOVA AI is ${state}`} camera={{ position: [0, 0, 4.2], fov: 45 }} fallback={<div className="w-full h-full grid place-items-center"><OrbLite state={state} size={size * 0.5} /></div>}>
        {() => <Orb state={state} level={level} />}
      </Stage>
    </div>
  );
}
