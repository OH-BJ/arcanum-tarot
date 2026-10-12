"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReading } from "@/store/readingStore";

const COUNT = 600;
const LIFETIME = 2.6;

const vertex = /* glsl */ `
attribute float aSeed;
uniform float uAge;
uniform float uSize;
varying float vAlpha;
varying float vSeed;
void main() {
  vSeed = aSeed;
  float life = clamp(uAge / ${LIFETIME.toFixed(1)}, 0.0, 1.0);
  vAlpha = (1.0 - life) * (1.0 - life) * step(0.0001, uAge);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (0.5 + aSeed) * (1.0 - life * 0.6) / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vSeed;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float glow = smoothstep(0.5, 0.0, d);
  float sparkle = smoothstep(0.06, 0.0, abs(p.x)) + smoothstep(0.06, 0.0, abs(p.y));
  vec3 col = mix(uColor, vec3(1.0), smoothstep(0.7, 1.0, vSeed));
  float a = (glow * glow + sparkle * glow * 0.6) * vAlpha;
  gl_FragColor = vec4(col * 3.0 * a, a);
}
`;

/** 카드가 뒤집히는 순간 터지는 금빛 입자 */
export default function ParticleBurst() {
  const points = useRef<THREE.Points>(null!);
  const age = useRef(-1);

  const { geometry, velocities } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3),
    );
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seeds[i] = Math.random();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return { geometry: g, velocities: new Float32Array(COUNT * 3) };
  }, []);

  const uniforms = useMemo(
    () => ({
      uAge: { value: -1 },
      uSize: { value: 70 },
      uColor: { value: new THREE.Color(1, 0.72, 0.3) },
    }),
    [],
  );

  const lastTick = useRef(useReading.getState().burst.tick);

  const emit = (reversed: boolean, big: boolean) => {
    const power = big ? 1.8 : 1;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      // 카드 테두리 근처에서 사방으로 퍼져나감
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s2 = Math.sqrt(1 - u * u);
      const speed = (1.2 + Math.random() * 3.2) * power;
      velocities[i * 3] = s2 * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = s2 * Math.sin(theta) * speed * 1.1 + 0.4;
      velocities[i * 3 + 2] = u * speed * 0.6;
      pos[i * 3] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    geometry.attributes.position.needsUpdate = true;
    uniforms.uColor.value.set(reversed ? "#ff4f6d" : "#ffc35a");
    uniforms.uSize.value = big ? 100 : 60;
    age.current = 0;
  };

  useFrame((_, dt) => {
    const { burst } = useReading.getState();
    if (burst.tick !== lastTick.current) {
      lastTick.current = burst.tick;
      points.current.position.set(...burst.pos);
      emit(burst.reversed, burst.big);
    }
    if (age.current < 0) return;
    age.current += dt;
    uniforms.uAge.value = age.current;

    const pos = geometry.attributes.position.array as Float32Array;
    const drag = Math.exp(-dt * 1.6);
    for (let i = 0; i < COUNT; i++) {
      velocities[i * 3] *= drag;
      velocities[i * 3 + 1] = velocities[i * 3 + 1] * drag + dt * 0.25; // 살짝 떠오름
      velocities[i * 3 + 2] *= drag;
      pos[i * 3] += velocities[i * 3] * dt;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;
    if (age.current > LIFETIME) age.current = -1;
    uniforms.uAge.value = age.current;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
