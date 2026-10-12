"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CARDS } from "@/lib/deck";
import { getSpread, getTableLayout } from "@/lib/spreads";
import { useReading, type Drawn } from "@/store/readingStore";
import { CARD_D, CARD_H, CARD_W, createEdgeGeometry, createFaceGeometry } from "./cardGeometry";
import { createCardBackTexture } from "./proceduralTextures";
import { loadCardTexture, PLACEHOLDER_TEXTURE } from "./cardTextures";
import { deckMatrices } from "./Deck";
import { cardFrontFragment, cardFrontVertex } from "../shaders/cardFront";
import { setHoverCursor } from "../cursor";
import { sfx } from "@/lib/sound";
import { cameraSpace, focusOffset } from "../focus";

/** 스프레드 최대 장수 (켈틱 크로스 10장) — 이만큼 미리 마운트해 두고 useFrame에서 상태를 읽는다 */
export const MAX_SLOTS = 10;

const FLIGHT_SECONDS = 0.95;
const FLIP_SECONDS = 1.25;
const ZOOM_IN_SECONDS = 0.8;
const DISSOLVE_SECONDS = 1.2;
const RETURN_SECONDS = 1.0;
const RETURN_TARGET = new THREE.Vector3(0, 0.45, 1.0);

const GOLD_TINT = new THREE.Color(1.0, 0.72, 0.3);
const CRIMSON_TINT = new THREE.Color(1.0, 0.22, 0.35);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

type Local = "hidden" | "flying" | "placed" | "revealing" | "revealed" | "returning";

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const nowSec = () => performance.now() / 1000;

/** 테이블 위 자세: 슬롯 회전 → 눕히기 → (뒤집기 각도) → (역방향이면 180° 회전) */
function tableQuat(out: THREE.Quaternion, rotY: number, flipAngle: number, reversed: boolean) {
  const q = new THREE.Quaternion();
  out.setFromAxisAngle(Y_AXIS, rotY);
  out.multiply(q.setFromAxisAngle(X_AXIS, -Math.PI / 2));
  out.multiply(q.setFromAxisAngle(Y_AXIS, flipAngle));
  if (reversed) out.multiply(q.setFromAxisAngle(Z_AXIS, Math.PI));
  return out;
}

export default function SpreadCard({ slot }: { slot: number }) {
  const group = useRef<THREE.Group>(null!);
  const frontMat = useRef<THREE.ShaderMaterial>(null!);
  const backMat = useRef<THREE.MeshStandardMaterial>(null!);
  const hovered = useRef(false);

  const faceGeo = useMemo(() => createFaceGeometry(), []);
  const edgeGeo = useMemo(() => createEdgeGeometry(), []);
  const backTex = useMemo(() => createCardBackTexture(), []);
  const edgeMats = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ visible: false }),
      new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 1, roughness: 0.25, emissive: "#ffb347", emissiveIntensity: 0.3 }),
    ],
    [],
  );
  const uniforms = useMemo(
    () => ({
      uMap: { value: PLACEHOLDER_TEXTURE as THREE.Texture },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uFoil: { value: 1 },
      uMouse: { value: new THREE.Vector2() },
      uTint: { value: GOLD_TINT.clone() },
    }),
    [],
  );

  // 애니메이션 상태 (React state가 아닌 ref — 매 프레임 갱신)
  const anim = useRef({
    local: "hidden" as Local,
    t0: 0,
    dissolveAt: -1,
    textureReady: false,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    startScale: 1,
    targetPos: new THREE.Vector3(),
    rotY: 0,
    targetScale: 1,
    reversed: false,
    zoom: false,
  });
  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      s: new THREE.Vector3(),
      euler: new THREE.Euler(),
    }),
    [],
  );

  const u = () => frontMat.current.uniforms as typeof uniforms;

  const begin = (local: Local) => {
    const a = anim.current;
    a.local = local;
    a.t0 = nowSec();
    a.startPos.copy(group.current.position);
    a.startQuat.copy(group.current.quaternion);
    a.startScale = group.current.scale.x;
  };

  const startFlight = (d: Drawn) => {
    const a = anim.current;
    const s = useReading.getState();
    const layout = getTableLayout(getSpread(s.spreadId), CARD_W, CARD_H)[d.slot];

    // 덱 아치에서 이 카드가 있던 자리에서 출발
    deckMatrices[d.deckPos].decompose(group.current.position, group.current.quaternion, tmp.s);
    group.current.scale.setScalar(tmp.s.x || 0.6);
    begin("flying");
    a.targetPos.set(...layout.position).y += 0.004 * d.slot;
    a.rotY = layout.rotationY;
    a.targetScale = layout.scale;
    a.reversed = d.reversed;
    a.textureReady = false;
    a.dissolveAt = -1;

    u().uReveal.value = 0;
    u().uTint.value.copy(d.reversed ? CRIMSON_TINT : GOLD_TINT);
    u().uMap.value = PLACEHOLDER_TEXTURE;
    // 날아가는 동안 앞면 이미지를 미리 받아 둠
    const card = d.cardIndex;
    void loadCardTexture(CARDS[card].image).then((t) => {
      const cur = useReading.getState().drawn.find((x) => x.slot === slot);
      if (cur?.cardIndex !== card) return;
      u().uMap.value = t;
      anim.current.textureReady = true;
    });
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useReading.getState();
    const d = s.drawn.find((x) => x.slot === slot);
    const a = anim.current;
    const g = group.current;
    const now = nowSec();
    u().uTime.value = state.clock.elapsedTime;
    u().uMouse.value.copy(state.pointer);

    if (!d) {
      g.visible = false;
      a.local = "hidden";
      return;
    }
    g.visible = true;

    // 스토어 상태 변화 감지 → 해당 연출 시작
    if (d.state === "flying" && a.local === "hidden") startFlight(d);
    if (d.state === "revealing" && a.local === "placed") {
      begin("revealing");
      a.zoom = !s.revealingAll;
      sfx.flip();
    }
    if (d.state === "returning" && a.local !== "returning") begin("returning");

    const t = now - a.t0;
    switch (a.local) {
      case "flying": {
        const p = clamp01(t / FLIGHT_SECONDS);
        const e = easeInOut(p);
        // 위로 솟았다가 자리에 내려앉는 곡선 경로
        tmp.mid.addVectors(a.startPos, a.targetPos).multiplyScalar(0.5).y += 1.4;
        bezier(g.position, a.startPos, tmp.mid, a.targetPos, e);
        tableQuat(tmp.q, a.rotY, Math.PI, a.reversed);
        g.quaternion.slerpQuaternions(a.startQuat, tmp.q, e);
        g.scale.setScalar(THREE.MathUtils.lerp(a.startScale, a.targetScale, e));
        if (p >= 1) {
          a.local = "placed";
          s.markPlaced(slot);
        }
        break;
      }
      case "placed": {
        const lift = hovered.current && s.phase === "reading" ? 0.12 : 0;
        g.position.y += (a.targetPos.y + lift - g.position.y) * 0.15;
        break;
      }
      case "revealing": {
        // zoom: 카메라 앞으로 떠올라 그 자리에서 뒤집힘 / 제자리: 테이블 위에서 뒤집힘(모두 뒤집기)
        const flipStart = a.zoom ? ZOOM_IN_SECONDS : 0;
        const p = clamp01((t - flipStart) / FLIP_SECONDS);
        const e = easeInOut(p);
        const flipAngle = Math.PI * (1 - e);
        if (a.zoom) {
          const z = easeInOut(clamp01(t / ZOOM_IN_SECONDS));
          cameraSpace(state.camera, focusOffset(state.size.width / state.size.height, tmp.v), tmp.v);
          tmp.q.copy(state.camera.quaternion);
          tmp.euler.set(0, flipAngle, a.reversed ? Math.PI : 0);
          tmp.q.multiply(tmp.q2.setFromEuler(tmp.euler));
          tmp.v.y += Math.sin(p * Math.PI) * 0.12;
          g.position.lerpVectors(a.startPos, tmp.v, z);
          g.quaternion.slerpQuaternions(a.startQuat, tmp.q, z);
          g.scale.setScalar(THREE.MathUtils.lerp(a.startScale, 1, z));
        } else {
          g.position.copy(a.targetPos).y += Math.sin(p * Math.PI) * 1.0 * a.targetScale;
          tableQuat(g.quaternion, a.rotY, flipAngle, a.reversed);
        }
        if (p > 0.55 && a.dissolveAt < 0 && a.textureReady) {
          a.dissolveAt = now;
          // 한 장씩 뒤집은 메이저 아르카나는 특별 연출
          const major = a.zoom && CARDS[d.cardIndex].arcana === "major";
          s.fireBurst([g.position.x, g.position.y, g.position.z], a.reversed, major);
          if (major) s.triggerMajor(slot);
          if (major) sfx.major(a.reversed);
          else sfx.reveal(a.reversed);
        }
        if (a.dissolveAt >= 0) u().uReveal.value = easeOut(clamp01((now - a.dissolveAt) / DISSOLVE_SECONDS));
        if (a.zoom) u().uFoil.value = 1.7;
        if (p >= 1 && a.dissolveAt >= 0 && now - a.dissolveAt >= DISSOLVE_SECONDS) {
          a.local = "revealed";
          s.markRevealed(slot);
        }
        break;
      }
      case "revealed": {
        const k = 1 - Math.exp(-dt * 6);
        if (s.focusSlot === slot) {
          // 크게 보기: 카메라 앞에 떠서 마우스 쪽으로 살짝 기울어짐 (홀로그램 포일이 반짝임)
          cameraSpace(state.camera, focusOffset(state.size.width / state.size.height, tmp.v), tmp.v);
          tmp.q.copy(state.camera.quaternion);
          tmp.euler.set(-state.pointer.y * 0.28, state.pointer.x * 0.4, a.reversed ? Math.PI : 0);
          tmp.q.multiply(tmp.q2.setFromEuler(tmp.euler));
          tmp.v.y += Math.sin(state.clock.elapsedTime * 1.4) * 0.03;
          g.position.lerp(tmp.v, k);
          g.quaternion.slerp(tmp.q, k);
          g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1, k));
        } else {
          tmp.v.copy(a.targetPos).y += hovered.current ? 0.12 : 0;
          tableQuat(tmp.q, a.rotY, 0, a.reversed);
          g.position.lerp(tmp.v, k);
          g.quaternion.slerp(tmp.q, k);
          g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, a.targetScale, k));
        }
        u().uFoil.value += ((s.focusSlot === slot ? 1.7 : 0.8) - u().uFoil.value) * k;
        break;
      }
      case "returning": {
        const p = clamp01(t / RETURN_SECONDS);
        const e = easeInOut(p);
        tmp.mid.addVectors(a.startPos, RETURN_TARGET).multiplyScalar(0.5).y += 1.0;
        bezier(g.position, a.startPos, tmp.mid, RETURN_TARGET, e);
        tableQuat(tmp.q, 0, Math.PI, false);
        g.quaternion.slerpQuaternions(a.startQuat, tmp.q, e);
        g.scale.setScalar(THREE.MathUtils.lerp(a.startScale, 0.8, e));
        u().uReveal.value = Math.max(0, u().uReveal.value - 0.05);
        if (p >= 1) g.visible = false;
        break;
      }
    }

    // 호버 시 금테 발광
    const glow = hovered.current && s.phase === "reading" ? 1.3 : 0.18;
    const edge = edgeMats[1] as THREE.MeshStandardMaterial;
    edge.emissiveIntensity += (glow - edge.emissiveIntensity) * 0.15;
    backMat.current.emissiveIntensity += (glow * 0.8 - backMat.current.emissiveIntensity) * 0.15;
  });

  return (
    <group
      ref={group}
      visible={false}
      onPointerOver={(e) => {
        if (useReading.getState().phase !== "reading") return;
        e.stopPropagation();
        hovered.current = true;
        setHoverCursor(`card-${slot}`, true);
      }}
      onPointerOut={() => {
        hovered.current = false;
        setHoverCursor(`card-${slot}`, false);
      }}
      onClick={(e) => {
        if (!group.current.visible) return;
        e.stopPropagation();
        useReading.getState().requestReveal(slot);
      }}
    >
      <mesh geometry={faceGeo} position={[0, 0, CARD_D / 2 + 0.0006]}>
        <shaderMaterial ref={frontMat} vertexShader={cardFrontVertex} fragmentShader={cardFrontFragment} uniforms={uniforms} />
      </mesh>
      <mesh geometry={faceGeo} position={[0, 0, -CARD_D / 2 - 0.0006]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial
          ref={backMat}
          map={backTex}
          emissiveMap={backTex}
          emissive="#ffffff"
          emissiveIntensity={0.3}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <mesh geometry={edgeGeo} material={edgeMats} />
    </group>
  );
}

function bezier(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) {
  const it = 1 - t;
  out.set(
    it * it * a.x + 2 * it * t * b.x + t * t * c.x,
    it * it * a.y + 2 * it * t * b.y + t * t * c.y,
    it * it * a.z + 2 * it * t * b.z + t * t * c.z,
  );
  return out;
}
