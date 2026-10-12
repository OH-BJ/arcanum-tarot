"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { CARD_D, createEdgeGeometry, createFaceGeometry } from "../objects/cardGeometry";
import { createCardBackTexture } from "../objects/proceduralTextures";
import { loadCardTexture, PLACEHOLDER_TEXTURE } from "../objects/cardTextures";
import { cardFrontFragment, cardFrontVertex } from "../shaders/cardFront";
import PostFX from "../effects/PostFX";

/** DOM(버튼·드래그)에서 바꾸고 3D 씬이 매 프레임 읽는 조작 상태 */
export interface ViewerControl {
  dragX: number; // 드래그로 더해진 회전(라디안)
  dragY: number;
  dragging: boolean;
  flipped: boolean; // 뒷면 보기
  reversed: boolean; // 역방향으로 보기
}

function ViewerCard({ image, control }: { image: string; control: React.RefObject<ViewerControl> }) {
  const group = useRef<THREE.Group>(null!);
  const frontMat = useRef<THREE.ShaderMaterial>(null!);
  const faceGeo = useMemo(() => createFaceGeometry(), []);
  const edgeGeo = useMemo(() => createEdgeGeometry(), []);
  const backTex = useMemo(() => createCardBackTexture(), []);
  const edgeMats = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ visible: false }),
      new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 1, roughness: 0.22, emissive: "#ffb347", emissiveIntensity: 0.35 }),
    ],
    [],
  );
  const uniforms = useMemo(
    () => ({
      uMap: { value: PLACEHOLDER_TEXTURE as THREE.Texture },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uFoil: { value: 1.5 },
      uMouse: { value: new THREE.Vector2() },
      uTint: { value: new THREE.Color(1.0, 0.72, 0.3) },
    }),
    [],
  );
  const state = useRef({ loaded: false, loadStarted: false, loadedAt: 0, rotY: 0, rotX: 0, rotZ: 0 });

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = state.current;
    const c = control.current;
    const u = frontMat.current.uniforms as typeof uniforms;
    const now = performance.now() / 1000;

    if (!st.loadStarted) {
      st.loadStarted = true;
      void loadCardTexture(image).then((t) => {
        u.uMap.value = t;
        st.loaded = true;
        st.loadedAt = performance.now() / 1000;
      });
    }
    // 처음 열릴 때 금빛 디졸브로 드러남
    u.uReveal.value = st.loaded ? Math.min(1, (now - st.loadedAt) / 1.4) : 0;
    u.uTime.value = s.clock.elapsedTime;
    u.uMouse.value.lerp(s.pointer, 1 - Math.exp(-dt * 4));

    // 목표 회전: 드래그 + 뒷면/역방향 + 가만히 있을 때 은은한 흔들림
    const idle = c.dragging ? 0 : 1;
    const targetY = c.dragX + (c.flipped ? Math.PI : 0) + Math.sin(s.clock.elapsedTime * 0.6) * 0.12 * idle + s.pointer.x * 0.15 * idle;
    const targetX = THREE.MathUtils.clamp(c.dragY, -0.6, 0.6) - s.pointer.y * 0.1 * idle;
    const targetZ = c.reversed ? Math.PI : 0;
    const k = 1 - Math.exp(-dt * (c.dragging ? 14 : 5));
    st.rotY += (targetY - st.rotY) * k;
    st.rotX += (targetX - st.rotX) * k;
    st.rotZ += (targetZ - st.rotZ) * (1 - Math.exp(-dt * 5));
    group.current.rotation.set(st.rotX, st.rotY, st.rotZ);
    group.current.position.y = Math.sin(s.clock.elapsedTime * 0.9) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={faceGeo} position={[0, 0, CARD_D / 2 + 0.0006]}>
        <shaderMaterial ref={frontMat} vertexShader={cardFrontVertex} fragmentShader={cardFrontFragment} uniforms={uniforms} />
      </mesh>
      <mesh geometry={faceGeo} position={[0, 0, -CARD_D / 2 - 0.0006]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={backTex} emissiveMap={backTex} emissive="#ffffff" emissiveIntensity={0.3} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh geometry={edgeGeo} material={edgeMats} />
    </group>
  );
}

/** 도감 상세: 드래그로 돌려 보는 3D 카드 한 장 */
export default function CardViewer({ image, control }: { image: string; control: React.RefObject<ViewerControl> }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.3], fov: 36 }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
      onCreated={({ scene }) => {
        scene.background = null;
      }}
    >
      <ambientLight intensity={0.35} color="#6a5aa0" />
      <pointLight position={[1.5, 2, 3]} intensity={6} color="#ffcf9a" distance={10} />
      <pointLight position={[-2, -1, 2]} intensity={3} color="#8c7bff" distance={10} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="ring" intensity={2} color="#ffb060" scale={3} position={[0, 3, 4]} />
        <Lightformer form="rect" intensity={1.2} color="#8c7bff" scale={[6, 1, 1]} position={[-5, 1, 0]} rotation-y={Math.PI / 2} />
      </Environment>
      <Sparkles count={60} scale={[4, 4, 2]} size={2.5} speed={0.3} color="#f3d98b" opacity={0.7} />
      <ViewerCard image={image} control={control} />
      <PostFX quality="high" />
    </Canvas>
  );
}
