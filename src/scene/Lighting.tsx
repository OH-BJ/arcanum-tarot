"use client";

import { Environment, Lightformer } from "@react-three/drei";

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.12} color="#3a2a6a" />
      {/* 뒤쪽 푸른 달빛 림라이트 */}
      <directionalLight position={[-3, 5, -6]} intensity={0.6} color="#7b8cff" />
      {/* 카드 정면을 은은하게 비추는 따뜻한 빛 */}
      <pointLight position={[0, 2.4, 3]} intensity={2.2} color="#ffb070" distance={8} decay={1.8} />

      {/* 금속 반사용 환경광 (외부 HDR 없이 로컬 생성) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="ring" intensity={2} color="#ffb060" scale={3} position={[0, 4, 4]} />
        <Lightformer form="rect" intensity={1.2} color="#8c7bff" scale={[6, 1, 1]} position={[-5, 2, -2]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.8} color="#ff7a45" scale={[6, 1, 1]} position={[5, 1, 0]} rotation-y={-Math.PI / 2} />
      </Environment>
    </>
  );
}
