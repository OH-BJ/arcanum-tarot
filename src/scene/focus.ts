import * as THREE from "three";

/** 크게 보기: 카메라 앞 거리 */
export const FOCUS_DISTANCE = 3.9;

/**
 * 카메라 좌표계 기준 크게 보기 위치.
 * 넓은 화면은 오른쪽 해석 패널을 피해 왼쪽으로, 좁은 화면은 아래 패널을 피해 위로.
 */
export function focusOffset(aspect: number, out: THREE.Vector3): THREE.Vector3 {
  if (aspect > 1.2) return out.set(-0.85, 0.05, -FOCUS_DISTANCE);
  // 휴대폰: 아래쪽 해석 패널(화면 절반)을 피해 위쪽 절반에 작게
  if (aspect < 0.8) return out.set(0, 1.1, -6.2);
  return out.set(0, 0.55, -FOCUS_DISTANCE - 0.6);
}

/** 배경 암전 막의 거리 — 항상 크게 보는 카드보다 뒤에 */
export function backdropDistance(aspect: number): number {
  return (aspect < 0.8 ? 6.2 : FOCUS_DISTANCE + 0.6) + 0.9;
}

/** 카메라 좌표계 오프셋 → 월드 좌표 */
export function cameraSpace(camera: THREE.Camera, offset: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  return out.copy(offset).applyQuaternion(camera.quaternion).add(camera.position);
}
