"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReading } from "@/store/readingStore";
import type { ScenePhase, Spread } from "@/types/tarot";

type Shot = { pos: [number, number, number]; look: [number, number, number] };

const SHOTS: Record<Exclude<ScenePhase, "reading">, Shot> = {
  intro: { pos: [0, 4.2, 10.5], look: [0, 0.6, 0] },
  select: { pos: [0, 3.3, 7.4], look: [0, 0.7, 0.6] },
  question: { pos: [0, 2.6, 6.2], look: [0, 0.75, -0.4] },
  shuffling: { pos: [0, 2.5, 7.6], look: [0, 1.4, 0] },
  picking: { pos: [0, 1.9, 7.6], look: [0, 1.3, 0.8] },
  gathering: { pos: [0, 3.3, 7.4], look: [0, 0.7, 0.6] },
};

/** 읽기 단계: 테이블을 내려다보는 샷 — 배열이 클수록 멀리 */
const READING_DISTANCE: Record<Spread["id"], number> = { one: 0.72, three: 0.8, love: 0.95, "celtic-cross": 1.3 };
const READING_OFFSET = new THREE.Vector3(0, 6.6, 4.4);

/** 씬 단계별 카메라 샷 사이를 부드럽게 이동 + 마우스 패럴랙스 */
export default function CameraRig() {
  const look = useRef(new THREE.Vector3(...SHOTS.intro.look));
  const pos = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const shake = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const s = useReading.getState();
    const aspect = state.size.width / state.size.height;

    if (s.phase === "reading") {
      const d = READING_DISTANCE[s.spreadId];
      // 넓은 화면에서는 오른쪽 해석 패널 자리만큼 배열을 왼쪽으로 비켜 보이게
      const shift = aspect > 1.2 ? 1.25 * d : 0;
      target.current.set(shift, 0, 0.5 * d);
      pos.current.copy(READING_OFFSET).multiplyScalar(d).add(target.current);
    } else {
      const shot = SHOTS[s.phase];
      target.current.set(...shot.look);
      pos.current.set(...shot.pos);
    }

    // 세로로 좁은 화면이면 멀리서 보이게
    const back = THREE.MathUtils.clamp(1.35 / aspect, 1, 2.3);
    pos.current.sub(target.current).multiplyScalar(back).add(target.current);
    pos.current.x += state.pointer.x * 0.4;
    pos.current.y += state.pointer.y * 0.22;

    const speed = s.phase === "intro" ? 0.9 : 2.0;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * speed);
    state.camera.position.lerp(pos.current, k);
    look.current.lerp(target.current, k);

    // 메이저 아르카나 공개 순간의 짧은 흔들림
    const age = performance.now() / 1000 - s.majorMoment.at;
    if (s.majorMoment.tick > 0 && age < 0.7) {
      const amp = 0.07 * (1 - age / 0.7);
      shake.current.set(Math.sin(age * 93) * amp, Math.cos(age * 71) * amp, 0);
    } else shake.current.set(0, 0, 0);
    state.camera.position.add(shake.current);
    state.camera.lookAt(look.current);
    state.camera.position.sub(shake.current);
  });

  return null;
}
