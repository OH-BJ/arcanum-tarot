"use client";

import { Sparkles, Stars } from "@react-three/drei";

export default function Starfield() {
  return (
    <group>
      <Stars radius={40} depth={30} count={2500} factor={3} saturation={0.4} fade speed={0.4} />
      {/* 공중에 떠다니는 금빛 먼지 */}
      <Sparkles count={140} scale={[8, 4, 6]} position={[0, 1.8, 0]} size={2.2} speed={0.25} color="#f3d98b" opacity={0.8} />
      <Sparkles count={50} scale={[4, 2.5, 3]} position={[0, 1.5, 0.5]} size={4} speed={0.35} color="#b79cff" opacity={0.6} />
    </group>
  );
}
