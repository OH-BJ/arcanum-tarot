"use client";

import gsap from "gsap";
import { useFrame } from "@react-three/fiber";

// GSAP 자체 rAF 티커 대신 R3F 렌더 루프에서 시간을 진행시켜 애니메이션과 렌더를 같은 프레임에 맞춘다
gsap.ticker.remove(gsap.updateRoot);

export default function GsapSync() {
  useFrame((state) => {
    gsap.updateRoot(state.clock.elapsedTime);
  }, -1);
  return null;
}
