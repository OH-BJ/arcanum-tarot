"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReading } from "@/store/readingStore";
import { introTime } from "../Director";

// 테이블 가장자리 배치. 210° 근처는 읽기 단계에서 남은 덱을 놓는 자리라 비워 둠
const CANDLES = [
  { angle: 175, r: 3.1, h: 0.85 },
  { angle: 245, r: 3.0, h: 0.55 },
  { angle: 150, r: 2.95, h: 0.7 },
  { angle: 325, r: 2.9, h: 0.8 },
  { angle: 300, r: 3.05, h: 0.5 },
  { angle: 20, r: 2.95, h: 0.65 },
  { angle: 268, r: 2.9, h: 0.95 },
];

const FLAME = new THREE.Color(4.0, 1.7, 0.45);

function Candle({ index, angle, r, h }: { index: number; angle: number; r: number; h: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * r;
  const z = Math.sin(rad) * r;
  const flame = useRef<THREE.Mesh>(null!);
  const flameMat = useRef<THREE.MeshBasicMaterial>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const seed = useMemo(() => index * 13.37, [index]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const it = introTime();
    // 인트로: 촛불이 하나씩 켜짐
    const on = THREE.MathUtils.smoothstep(it, 0.4 + index * 0.28, 0.9 + index * 0.28);
    const flicker =
      0.85 + Math.sin(t * 9 + seed) * 0.06 + Math.sin(t * 23 + seed * 2) * 0.04 + Math.sin(t * 3.1 + seed) * 0.05;
    const phase = useReading.getState().phase;
    const boost = phase === "shuffling" ? 1.35 : 1;

    light.current.intensity = 3.2 * on * flicker * boost;
    flame.current.scale.set(on * (0.9 + flicker * 0.1), on * (0.8 + flicker * 0.35), on * (0.9 + flicker * 0.1));
    flame.current.position.x = Math.sin(t * 5 + seed) * 0.006;
    flameMat.current.color.copy(FLAME).multiplyScalar(flicker);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.075, 0.085, h, 24]} />
        <meshStandardMaterial color="#efe3c8" roughness={0.55} emissive="#ff8a3d" emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 6]} />
        <meshBasicMaterial color="#1a1208" />
      </mesh>
      <mesh ref={flame} position={[0, h + 0.1, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial ref={flameMat} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, h + 0.2, 0]} color="#ff9a45" distance={7} decay={1.7} intensity={0} />
    </group>
  );
}

export default function Candles() {
  return (
    <group>
      {CANDLES.map((c, i) => (
        <Candle key={i} index={i} {...c} />
      ))}
    </group>
  );
}
