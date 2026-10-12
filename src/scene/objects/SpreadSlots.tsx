"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getSpread, getTableLayout } from "@/lib/spreads";
import { useReading } from "@/store/readingStore";
import type { Spread } from "@/types/tarot";
import { CARD_H, CARD_W } from "./cardGeometry";
import { MAX_SLOTS } from "./SpreadCard";

const SLOT_COLOR = new THREE.Color(1.0, 0.75, 0.38);

/** 카드 자리 테두리 (점선 둥근 사각형, 흰색 — 재질 색으로 금빛) */
function createOutlineTexture() {
  const W = 256;
  const H = Math.round((W * CARD_H) / CARD_W);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 18);
  ctx.fill();
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** "1 · 현재" 같은 자리 이름표 */
function createLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "600 52px 'Gowun Batang', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 스프레드의 각 자리를 테이블 위에 빛나는 점선 테두리 + 이름표로 표시 */
export default function SpreadSlots() {
  const outlineTex = useMemo(() => createOutlineTexture(), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const outlineMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const labelMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const labelMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const currentSpread = useRef<Spread["id"] | null>(null);
  const opacity = useRef(0);

  const applySpread = (id: Spread["id"]) => {
    const spread = getSpread(id);
    const layout = getTableLayout(spread, CARD_W, CARD_H);
    for (let i = 0; i < MAX_SLOTS; i++) {
      const g = groups.current[i];
      const labelMat = labelMats.current[i];
      const labelMesh = labelMeshes.current[i];
      if (!g || !labelMat || !labelMesh) continue;
      const slot = layout[i];
      const pos = spread.positions[i];
      g.visible = !!slot;
      if (!slot) continue;
      g.position.set(slot.position[0], 0.012, slot.position[2]);
      g.rotation.set(0, slot.rotationY, 0);
      g.scale.setScalar(slot.scale);
      labelMat.map?.dispose();
      labelMat.map = createLabelTexture(`${pos.index} · ${pos.label}`);
      labelMat.needsUpdate = true;
      // 가로로 놓이는 자리(켈틱 크로스 2번)는 이름표가 겹쳐서 생략
      labelMesh.visible = !slot.rotationY;
    }
  };

  useFrame((state, dt) => {
    const s = useReading.getState();
    if (currentSpread.current !== s.spreadId) {
      currentSpread.current = s.spreadId;
      applySpread(s.spreadId);
    }
    const show = s.phase === "picking" || s.phase === "reading" ? 1 : 0;
    opacity.current += (show - opacity.current) * (1 - Math.exp(-dt * 4));
    const t = state.clock.elapsedTime;
    const nextSlot = s.phase === "picking" ? s.drawn.length : -1;

    for (let i = 0; i < MAX_SLOTS; i++) {
      const o = outlineMats.current[i];
      const l = labelMats.current[i];
      if (!o || !l) continue;
      const filled = s.drawn.some((d) => d.slot === i);
      // 다음에 채워질 자리는 맥박처럼 빛남
      const pulse = i === nextSlot ? 1.2 + Math.sin(t * 4) * 0.6 : filled ? 0.25 : 0.6;
      o.color.copy(SLOT_COLOR).multiplyScalar(pulse * opacity.current);
      l.color.copy(SLOT_COLOR).multiplyScalar((i === nextSlot ? 1.3 : 0.85) * opacity.current);
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_SLOTS }, (_, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={1.08}>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshBasicMaterial
              ref={(el) => void (outlineMats.current[i] = el)}
              map={outlineTex}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={(el) => void (labelMeshes.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CARD_H / 2 + 0.32]}>
            <planeGeometry args={[2.4, 0.45]} />
            <meshBasicMaterial
              ref={(el) => void (labelMats.current[i] = el)}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
