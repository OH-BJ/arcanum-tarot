"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { QUESTION_SECONDS, useReading } from "@/store/readingStore";
import { introTime } from "../Director";
import { ballScreen } from "../ballScreen";
import { crystalFragment, crystalVertex } from "../shaders/crystal";

export const BALL_POSITION = new THREE.Vector3(0, 0.6, -0.9);
const BALL_RADIUS = 0.42;


/** 테이블 뒤편의 수정구슬. 질문을 받으면 안쪽 성운이 소용돌이치며 빛난다 */
export default function CrystalBall() {
  const group = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const energy = useRef(0);
  const shown = useRef(1);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0 }, uFlash: { value: 0 } }), []);
  const mat = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useReading.getState();
    const t = performance.now() / 1000 - s.phaseStartedAt;
    const u = mat.current.uniforms as typeof uniforms;

    // 단계별 목표 에너지와 표시 여부
    let target = 0.25;
    let visible = 1;
    let flash = 0;
    switch (s.phase) {
      case "intro":
        target = 0.25 * THREE.MathUtils.smoothstep(introTime(), 1.2, 3.2);
        break;
      case "question": {
        // 글자가 하나씩 흡수될수록 차오르다가 마지막에 번쩍
        const p = t / QUESTION_SECONDS;
        target = 0.3 + THREE.MathUtils.smoothstep(p, 0.15, 0.85) * 0.9;
        flash = Math.max(0, 1 - Math.abs(p - 0.88) * 9);
        break;
      }
      case "shuffling":
        target = 0.85;
        break;
      case "picking":
      case "reading":
        target = 0;
        visible = 0; // 배열 공간을 위해 테이블 속으로 사라짐
        break;
    }
    const k = 1 - Math.exp(-dt * 3);
    energy.current += (target - energy.current) * k;
    shown.current += (visible - shown.current) * (1 - Math.exp(-dt * 4));
    u.uEnergy.value = energy.current;
    u.uFlash.value = flash;
    u.uTime.value = state.clock.elapsedTime;

    const sc = Math.max(shown.current, 0.0001);
    group.current.scale.setScalar(sc);
    group.current.position.y = -0.6 * (1 - shown.current);
    group.current.visible = shown.current > 0.01;
    light.current.intensity = (energy.current * 3 + flash * 6) * shown.current;

    // 화면 좌표 기록
    tmp.copy(BALL_POSITION).project(state.camera);
    ballScreen.x = (tmp.x * 0.5 + 0.5) * state.size.width;
    ballScreen.y = (-tmp.y * 0.5 + 0.5) * state.size.height;
    ballScreen.ready = true;
  });

  return (
    <group ref={group}>
      <group position={BALL_POSITION}>
        <mesh renderOrder={5}>
          <sphereGeometry args={[BALL_RADIUS, 64, 48]} />
          <shaderMaterial
            ref={mat}
            vertexShader={crystalVertex}
            fragmentShader={crystalFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
        <pointLight ref={light} color="#9b7bff" distance={4} decay={1.6} intensity={0} />
        {/* 금빛 받침 */}
        <mesh position={[0, -BALL_RADIUS + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.045, 16, 64]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.28} emissive="#ff9c3a" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, -BALL_RADIUS - 0.08, 0]}>
          <cylinderGeometry args={[0.3, 0.36, 0.16, 48]} />
          <meshStandardMaterial color="#1c1030" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, -BALL_RADIUS - 0.005, 0]}>
          <torusGeometry args={[0.31, 0.012, 8, 64]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
