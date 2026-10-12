"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { createMagicCircleTexture } from "../objects/proceduralTextures";
import { useReading } from "@/store/readingStore";
import { introTime } from "../Director";

const CIRCLE_COLOR = new THREE.Color(1.0, 0.7, 0.3);

export default function Table() {
  const circleTex = useMemo(() => createMagicCircleTexture(), []);
  const outer = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const innerMat = useRef<THREE.MeshBasicMaterial>(null!);
  const energy = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    outer.current.rotation.z = t * 0.03;
    inner.current.rotation.z = -t * 0.06;

    const phase = useReading.getState().phase;
    // 셔플·고르기·읽기 중에는 마법진이 더 강하게 빛남
    const target = phase === "shuffling" || phase === "picking" ? 0.6 : phase === "reading" ? 0.35 : 0;
    energy.current += (target - energy.current) * (1 - Math.exp(-dt * 3));

    // 인트로: 1.5초 뒤부터 서서히 떠오름
    const intro = THREE.MathUtils.smoothstep(introTime(), 1.5, 4);
    const pulse = 0.85 + Math.sin(t * 1.3) * 0.15;
    const brightness = intro * pulse * (0.9 + energy.current * 1.6);
    mat.current.color.copy(CIRCLE_COLOR).multiplyScalar(brightness);
    innerMat.current.color.copy(CIRCLE_COLOR).multiplyScalar(brightness * 0.6);
  });

  return (
    <group>
      {/* 테이블 */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.5, 0.2, 96]} />
        <meshStandardMaterial color="#160b28" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.4, 0.025, 12, 128]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} emissive="#ff9c3a" emissiveIntensity={0.15} />
      </mesh>

      {/* 마법진 (2겹으로 반대 방향 회전) */}
      <mesh ref={outer} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial
          ref={mat}
          map={circleTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={inner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={0.45}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial
          ref={innerMat}
          map={circleTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#05030a" roughness={1} />
      </mesh>
    </group>
  );
}
