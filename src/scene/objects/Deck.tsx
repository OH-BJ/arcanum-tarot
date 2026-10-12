"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { CARDS } from "@/lib/deck";
import { seededRandom } from "@/lib/random";
import { SHUFFLE_SECONDS, useReading } from "@/store/readingStore";
import { createEdgeGeometry, createFaceGeometry } from "./cardGeometry";
import { createCardBackTexture } from "./proceduralTextures";
import { setHoverCursor } from "../cursor";
import { ARCH, isPortrait } from "../layout";
import { pickRibbon, resetRibbon } from "../pickRibbon";
import { sfx } from "@/lib/sound";

const N = CARDS.length;

/** 각 덱 카드의 현재 월드 변환 — 뽑힌 카드(SpreadCard)가 날아오를 출발점으로 읽어 간다 */
export const deckMatrices = Array.from({ length: N }, () => new THREE.Matrix4());

// 자세별 상수
const TABLE_STACK = new THREE.Vector3(0, 0.03, 1.0);
const READING_STACK = new THREE.Vector3(-2.7, 0.03, -1.9); // 테이블 가장자리 215° 방향 (배열·촛불과 겹치지 않는 자리)
const AIR_STACK = new THREE.Vector3(0, 1.55, 0.6);
const STACK_SCALE = 0.8;
// 휴대폰 리본 배치
const RIBBON_SPACING = 0.42;
const RIBBON_Y = 1.55;
const RIBBON_Z = 2.2;
const RIBBON_SCALE = 0.62;
const SHUFFLE_GATHER_AT = SHUFFLE_SECONDS - 0.75;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const FLAT = new THREE.Quaternion().setFromAxisAngle(X_AXIS, -Math.PI / 2); // 테이블에 눕힘

export default function Deck() {
  const faces = useRef<THREE.InstancedMesh>(null!);
  const edges = useRef<THREE.InstancedMesh>(null!);
  const hovered = useRef(-1);

  const faceGeo = useMemo(() => createFaceGeometry(), []);
  const edgeGeo = useMemo(() => createEdgeGeometry(), []);
  const backTex = useMemo(() => createCardBackTexture(), []);
  const faceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: backTex,
        emissiveMap: backTex,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.28,
        metalness: 0.35,
        roughness: 0.45,
        side: THREE.DoubleSide, // 덱 카드는 양면 모두 뒷면 무늬 (앞면은 뽑힌 카드에서만)
      }),
    [backTex],
  );
  const edgeMats = useMemo(
    () => [
      new THREE.MeshBasicMaterial({ visible: false }),
      new THREE.MeshStandardMaterial({ color: "#d4af37", metalness: 1, roughness: 0.3, emissive: "#ffb347", emissiveIntensity: 0.25 }),
    ],
    [],
  );

  // 카드별 난수와 현재 상태
  const sim = useMemo(() => {
    const rand = seededRandom(1234);
    return Array.from({ length: N }, () => ({
      pos: TABLE_STACK.clone(),
      quat: FLAT.clone(),
      scale: STACK_SCALE,
      theta: rand() * Math.PI * 2,
      omega: 1.6 + rand() * 1.8,
      radius: 1.3 + rand() * 1.5,
      height: rand(),
      phi: rand() * Math.PI * 2,
      jitter: (rand() - 0.5) * 0.08,
    }));
  }, []);

  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      scale: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      rank: new Int16Array(N),
    }),
    [],
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useReading.getState();
    const t = performance.now() / 1000 - s.phaseStartedAt;
    const picked = new Set(s.drawn.map((d) => d.deckPos));
    const portrait = isPortrait(state.size.width / state.size.height);

    // 휴대폰 리본: 남은 카드만 한 줄로, 스크롤 위치를 부드럽게 따라감
    const ribbonRank = tmp.rank;
    if (s.phase === "picking" && portrait) {
      let r = 0;
      for (let i = 0; i < N; i++) ribbonRank[i] = picked.has(i) ? -1 : r++;
      pickRibbon.count = r;
      if (!pickRibbon.initialized) {
        pickRibbon.initialized = true;
        pickRibbon.value = pickRibbon.target = Math.floor(r / 2);
      }
      pickRibbon.target = Math.min(pickRibbon.target, Math.max(0, r - 1));
      pickRibbon.value += (pickRibbon.target - pickRibbon.value) * (1 - Math.exp(-dt * 9));
      const focusRank = Math.round(pickRibbon.value);
      const focused = ribbonRank.indexOf(focusRank);
      if (focused !== pickRibbon.focusedDeckPos && focused >= 0) sfx.hover();
      pickRibbon.focusedDeckPos = focused;
    } else if (s.phase !== "picking") {
      resetRibbon();
    }
    const { pos, quat, q2, euler } = tmp;

    for (let i = 0; i < N; i++) {
      const c = sim[i];
      let targetScale = STACK_SCALE;
      let speed = 4;

      switch (s.phase) {
        case "shuffling": {
          const tv = t - i * 0.006;
          if (tv < 0) {
            stackPose(TABLE_STACK, i, c.jitter, pos, quat);
          } else if (t < SHUFFLE_GATHER_AT) {
            // 회오리: 카드마다 다른 반지름·속도·높이로 공전하며 뒤척임
            const a = c.theta + tv * c.omega;
            const r = c.radius * Math.min(1, tv * 1.6);
            pos.set(Math.cos(a) * r, 1.45 + (c.height - 0.5) * 1.9 + Math.sin(tv * 1.7 + c.phi) * 0.25, Math.sin(a) * r * 0.85);
            euler.set(Math.sin(tv * 2.3 + c.phi) * 0.8, -a + Math.PI / 2, Math.cos(tv * 1.9 + c.phi) * 0.4);
            quat.setFromEuler(euler);
          } else {
            pos.copy(AIR_STACK).z += i * 0.004;
            quat.identity();
          }
          targetScale = 0.68;
          speed = t < SHUFFLE_GATHER_AT ? 5 : 7;
          break;
        }
        case "picking": {
          if (t < i * 0.008) {
            pos.copy(AIR_STACK).z += i * 0.004;
            quat.identity();
          } else if (portrait) {
            // 휴대폰: 큼직한 카드가 한 줄로 — 가운데 카드가 떠오르고, 멀어질수록 뒤로 휘어짐
            const d = ribbonRank[i] - pickRibbon.value;
            const near = Math.max(0, 1 - Math.abs(d));
            pos.set(d * RIBBON_SPACING, RIBBON_Y + near * 0.35, RIBBON_Z - d * d * 0.04 - Math.abs(d) * 0.02);
            euler.set(0, -d * 0.12, -d * 0.06);
            quat.setFromEuler(euler);
            targetScale = RIBBON_SCALE + near * 0.1;
          } else {
            // 손에 쥔 부채처럼 펼친 아치
            const arch = ARCH.wide;
            const a = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(arch.from, arch.to, i / (N - 1)));
            const lift = hovered.current === i && !picked.has(i) ? 0.3 : 0;
            pos.set(
              arch.center[0] + Math.cos(a) * (arch.radius + lift),
              arch.center[1] + Math.sin(a) * (arch.radius + lift),
              arch.center[2] + i * 0.004 + lift * 0.3,
            );
            quat.setFromAxisAngle(Z_AXIS, a - Math.PI / 2);
            targetScale = hovered.current === i ? arch.scale * 1.08 : arch.scale;
          }
          speed = 7;
          break;
        }
        case "reading":
          stackPose(READING_STACK, i, c.jitter, pos, quat);
          q2.setFromAxisAngle(Y_AXIS, 0.35);
          quat.premultiply(q2);
          targetScale = 0.7;
          speed = 3;
          break;
        default: // intro, select, gathering
          stackPose(TABLE_STACK, i, c.jitter, pos, quat);
          speed = s.phase === "gathering" ? 5 : 4;
      }

      const hidden = picked.has(i) && (s.phase === "picking" || s.phase === "reading");
      if (hidden) {
        // 뽑힌 카드는 SpreadCard가 대신 그림 — 덱에서는 즉시 숨김
        c.scale = 0;
      } else {
        const k = 1 - Math.exp(-dt * speed);
        c.pos.lerp(pos, k);
        c.quat.slerp(quat, k);
        c.scale += (targetScale - c.scale) * k;
      }

      tmp.scale.setScalar(Math.max(c.scale, 1e-4));
      tmp.matrix.compose(c.pos, c.quat, tmp.scale);
      // 출발점 기록은 보이는 동안만 (크기 0 행렬은 분해할 수 없음)
      if (!hidden) deckMatrices[i].copy(tmp.matrix);
      faces.current.setMatrixAt(i, tmp.matrix);
      edges.current.setMatrixAt(i, tmp.matrix);
    }
    faces.current.instanceMatrix.needsUpdate = true;
    edges.current.instanceMatrix.needsUpdate = true;
    // 카드가 계속 움직이므로 레이캐스트용 경계구를 매 프레임 다시 계산하게 함
    faces.current.boundingSphere = null;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (useReading.getState().phase !== "picking" || e.instanceId === undefined) return;
    e.stopPropagation();
    if (hovered.current !== e.instanceId) sfx.hover();
    hovered.current = e.instanceId;
    setHoverCursor("deck", true);
  };
  const onOut = () => {
    hovered.current = -1;
    setHoverCursor("deck", false);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return;
    e.stopPropagation();
    useReading.getState().pickCard(e.instanceId);
    hovered.current = -1;
  };

  return (
    <group>
      <instancedMesh
        ref={faces}
        args={[faceGeo, faceMat, N]}
        frustumCulled={false}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      />
      <instancedMesh ref={edges} args={[edgeGeo, undefined, N]} material={edgeMats} frustumCulled={false} />
    </group>
  );
}

/** 테이블 위에 반듯하게 쌓인 자세 */
function stackPose(base: THREE.Vector3, i: number, jitter: number, pos: THREE.Vector3, quat: THREE.Quaternion) {
  pos.set(base.x, base.y + i * 0.0045, base.z);
  quat.setFromAxisAngle(Y_AXIS, jitter).multiply(FLAT);
}
