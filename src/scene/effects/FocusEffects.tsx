"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CARDS } from "@/lib/deck";
import { useReading } from "@/store/readingStore";
import { cameraSpace, FOCUS_DISTANCE, focusOffset } from "../focus";
import { raysFragment, raysVertex } from "../shaders/rays";

const GOLD = new THREE.Color(1.0, 0.75, 0.35);
const CRIMSON = new THREE.Color(1.0, 0.3, 0.45);
const MAJOR_SECONDS = 1.6;

/**
 * 크게 보기 연출 묶음
 * - 배경 암전: 카메라 앞 카드 뒤에 반투명 검은 막
 * - 후광: 카드 뒤에서 회전하는 광선
 * - 메이저 아르카나: 더 깊은 암전 + 금빛 충격파 2겹
 */
export default function FocusEffects() {
  const backdrop = useRef<THREE.Mesh>(null!);
  const backdropMat = useRef<THREE.MeshBasicMaterial>(null!);
  const rays = useRef<THREE.Mesh>(null!);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const tmp = useMemo(() => ({ offset: new THREE.Vector3(), pos: new THREE.Vector3(), color: new THREE.Color() }), []);
  const rayUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: GOLD.clone() } }),
    [],
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useReading.getState();
    const cam = state.camera;
    const aspect = state.size.width / state.size.height;
    const now = performance.now() / 1000;
    const k = 1 - Math.exp(-dt * 4);

    const zooming = s.drawn.find((d) => d.state === "revealing" && !s.revealingAll);
    const focused = s.drawn.find((d) => d.slot === s.focusSlot && d.state === "revealed");
    const subject = zooming ?? focused;
    const majorAge = now - s.majorMoment.at;
    const inMajor = s.majorMoment.tick > 0 && majorAge < MAJOR_SECONDS;
    const subjectIsMajor = !!subject && CARDS[subject.cardIndex].arcana === "major";

    // 배경 암전
    // 마법진·촛불은 HDR로 밝아서(블룸) 막이 꽤 진해야 눈에 띄게 어두워짐
    let dim = subject ? 0.86 : 0;
    if (zooming && subjectIsMajor) dim = 0.93; // 메이저는 공개 직전부터 더 어둡게
    if (inMajor) dim = 0.96;
    backdropMat.current.opacity += (dim - backdropMat.current.opacity) * k;
    backdrop.current.visible = backdropMat.current.opacity > 0.005;
    cameraSpace(cam, tmp.offset.set(0, 0, -(FOCUS_DISTANCE + 0.9)), backdrop.current.position);
    backdrop.current.quaternion.copy(cam.quaternion);

    // 후광: 카드 뒤
    focusOffset(aspect, tmp.offset);
    tmp.offset.z -= 0.5;
    cameraSpace(cam, tmp.offset, rays.current.position);
    rays.current.quaternion.copy(cam.quaternion);
    const rayTarget = subject ? (inMajor ? 1.6 : 1) : 0;
    rayUniforms.uOpacity.value += (rayTarget - rayUniforms.uOpacity.value) * k;
    rayUniforms.uTime.value = state.clock.elapsedTime;
    if (subject) rayUniforms.uColor.value.lerp(tmp.color.copy(subject.reversed ? CRIMSON : GOLD).multiplyScalar(2), k);
    rays.current.scale.setScalar(inMajor ? 1 + Math.sin(majorAge * 3) * 0.12 + 0.25 : 1);
    rays.current.visible = rayUniforms.uOpacity.value > 0.005;

    // 메이저 충격파
    focusOffset(aspect, tmp.offset);
    tmp.offset.z -= 0.05;
    cameraSpace(cam, tmp.offset, tmp.pos);
    rings.current.forEach((ring, i) => {
      const mat = ringMats.current[i];
      if (!ring || !mat) return;
      const age = majorAge - i * 0.18;
      const active = s.majorMoment.tick > 0 && age >= 0 && age < 1.3;
      ring.visible = active;
      if (!active) return;
      const p = age / 1.3;
      ring.position.copy(tmp.pos);
      ring.quaternion.copy(cam.quaternion);
      ring.scale.setScalar(0.6 + p * 6);
      mat.opacity = Math.pow(1 - p, 2) * (i === 0 ? 1 : 0.6);
      const major = s.drawn.find((d) => d.slot === s.majorMoment.slot);
      mat.color.copy(major?.reversed ? CRIMSON : GOLD).multiplyScalar(1.6);
    });
  });

  return (
    <group>
      <mesh ref={backdrop} visible={false} renderOrder={1}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial ref={backdropMat} color="#000000" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={rays} visible={false} renderOrder={2}>
        <planeGeometry args={[7, 7]} />
        <shaderMaterial
          vertexShader={raysVertex}
          fragmentShader={raysFragment}
          uniforms={rayUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} ref={(el) => void (rings.current[i] = el)} visible={false} renderOrder={3}>
          <ringGeometry args={[0.965, 1, 128]} />
          <meshBasicMaterial
            ref={(el) => void (ringMats.current[i] = el)}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
