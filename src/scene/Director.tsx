"use client";

import { useFrame } from "@react-three/fiber";
import { useReading } from "@/store/readingStore";
import { registerRenderer } from "./objects/cardTextures";

const INTRO_SECONDS = 3.2;

/** 씬 로딩이 끝난 첫 프레임을 인트로 시작점으로 기록하고, 인트로가 끝나면 스프레드 선택으로 넘긴다 */
export default function Director() {
  useFrame((state) => {
    const s = useReading.getState();
    const t = state.clock.elapsedTime;
    if (s.readyAt === null) {
      registerRenderer(state.gl);
      s.setReadyAt(t);
      return;
    }
    if (s.phase === "intro" && introTime() > INTRO_SECONDS) s.setPhase("select");
  });
  return null;
}

/** 입장 버튼을 누른 뒤 경과 시간 (입장 전이면 0) */
export function introTime(): number {
  const start = useReading.getState().introStartedAt;
  return start === null ? 0 : performance.now() / 1000 - start;
}
