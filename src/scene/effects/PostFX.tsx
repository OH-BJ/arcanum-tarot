"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import { useMemo } from "react";

export default function PostFX({ quality }: { quality: "high" | "low" }) {
  const caOffset = useMemo(() => new Vector2(0.0006, 0.0008), []);
  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 0}>
      <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.75} />
      <ChromaticAberration offset={caOffset} radialModulation={false} modulationOffset={0} />
      <Vignette offset={0.25} darkness={0.85} />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
