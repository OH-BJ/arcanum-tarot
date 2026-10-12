"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import { useMemo } from "react";

export default function PostFX({ quality }: { quality: "high" | "low" }) {
  const caOffset = useMemo(() => new Vector2(0.0006, 0.0008), []);

  // 저사양: 블룸 단계를 줄이고 색수차·노이즈는 생략 (화면 전체를 도는 패스가 휴대폰 GPU에 부담)
  if (quality === "low") {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur levels={5} intensity={1.0} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.7} />
        <Vignette offset={0.25} darkness={0.85} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.75} />
      <ChromaticAberration offset={caOffset} radialModulation={false} modulationOffset={0} />
      <Vignette offset={0.25} darkness={0.85} />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
