import * as THREE from "three";

export const CARD_W = 1.2;
export const CARD_H = 2.0;
export const CARD_R = 0.07;
export const CARD_D = 0.014;

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** 둥근 모서리 카드 면 (UV를 0..1로 정규화) */
export function createFaceGeometry() {
  const g = new THREE.ShapeGeometry(roundedRectShape(CARD_W, CARD_H, CARD_R), 10);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / CARD_W + 0.5, pos.getY(i) / CARD_H + 0.5);
  }
  return g;
}

/** 카드 두께(옆면). 그룹 0 = 앞뒤 캡(숨김), 그룹 1 = 옆면 */
export function createEdgeGeometry() {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(CARD_W, CARD_H, CARD_R), {
    depth: CARD_D,
    bevelEnabled: false,
    curveSegments: 10,
  });
  g.translate(0, 0, -CARD_D / 2);
  return g;
}
