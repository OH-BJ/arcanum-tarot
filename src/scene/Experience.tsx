"use client";

import { Suspense, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import CameraRig from "./CameraRig";
import Director from "./Director";
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
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 4.2, 10.5], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      // 빈 곳을 누르면 크게 보기 해제
      onPointerMissed={() => useReading.getState().setFocus(null)}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#05030c");
      }}
    >
      <fog attach="fog" args={["#05030c", 7, 22]} />
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
        onDecline={() => {
          setDpr(1);
          setQuality("low");
        }}
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
      </Suspense>
      <PostFX quality={quality} />
    </Canvas>
  );
}
