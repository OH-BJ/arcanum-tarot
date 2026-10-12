"use client";

import { Suspense, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import CameraRig from "./CameraRig";
import Director from "./Director";
import { qualityLevel } from "./layout";
import GsapSync from "./GsapSync";
import Lighting from "./Lighting";
import Table from "./environment/Table";
import Candles from "./environment/Candles";
import Starfield from "./environment/Starfield";
import Deck from "./objects/Deck";
import SpreadCard, { MAX_SLOTS } from "./objects/SpreadCard";
import SpreadSlots from "./objects/SpreadSlots";
import CrystalBall from "./objects/CrystalBall";
import ParticleBurst from "./effects/ParticleBurst";
import PostFX from "./effects/PostFX";
import FocusEffects from "./effects/FocusEffects";
import { useReading } from "@/store/readingStore";

export default function Experience() {
  // 휴대폰 등 저사양 기기는 처음부터 가볍게 시작 (이 컴포넌트는 브라우저에서만 렌더링됨)
  // 품질은 시작할 때 한 번만 정함 — 도중에 바꾸면 후처리 파이프라인을 다시 만들며 크게 멈칫함
  const [level] = useState(() => qualityLevel());
  const quality = level === "high" ? "high" : "low";
  const effects = level !== "ultra"; // 초경량은 화면 후처리 효과 없이
  const [dpr, setDpr] = useState(() =>
    level === "ultra" ? 0.75 : level === "lite" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
  );

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 4.2, 10.5], fov: 42, near: 0.1, far: 100 }}
      // 후처리가 있으면 톤매핑은 후처리에서, 없으면(초경량) 렌더러가 직접
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: effects ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping }}
      // 빈 곳을 누르면 크게 보기 해제
      onPointerMissed={() => useReading.getState().setFocus(null)}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#05030c");
      }}
    >
      <fog attach="fog" args={["#05030c", 7, 22]} />
      {/* 프레임이 계속 떨어지면 해상도만 한 번 낮춤 (flipflops 이후엔 고정) */}
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => setDpr((d) => Math.min(d, 1))}
        onFallback={() => setDpr((d) => Math.min(d, 1))}
      />
      <GsapSync />
      <CameraRig />
      <Lighting />
      <Suspense fallback={null}>
        <Table />
        <Candles />
        <Starfield />
        <CrystalBall />
        <Deck />
        <SpreadSlots />
        {Array.from({ length: MAX_SLOTS }, (_, i) => (
          <SpreadCard key={i} slot={i} />
        ))}
        <FocusEffects />
        <ParticleBurst />
        {/* Suspense 안 마지막 — 모든 에셋이 준비된 뒤에야 첫 프레임이 기록됨 */}
        <Director />
        {/* 숨겨진 카드·효과까지 셰이더를 미리 컴파일 → 첫 카드 뽑기/공개 때 멈칫하지 않게 */}
        <Preload all />
      </Suspense>
      {effects && <PostFX quality={quality} />}
    </Canvas>
  );
}
