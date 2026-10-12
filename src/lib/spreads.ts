import spreadsData from "../../data/spreads.json";
import type { Spread } from "@/types/tarot";

export const SPREADS = spreadsData as Spread[];

export function getSpread(id: Spread["id"]): Spread {
  const spread = SPREADS.find((s) => s.id === id);
  if (!spread) throw new Error(`알 수 없는 스프레드: ${id}`);
  return spread;
}

export interface TableSlot {
  position: [number, number, number]; // 테이블 위 월드 좌표 (y = 테이블 표면)
  rotationY: number; // 테이블 평면 안에서의 회전 (켈틱 크로스 2번 등)
  scale: number; // 카드 크기 배율
}

const GAP = 0.22;
/** 배열 전체가 들어갈 테이블 위 정사각형 영역 (테이블 반지름 3.4) */
const FIT = 5.4;
const SURFACE_Y = 0.03;

/**
 * 스프레드의 "카드 칸" 좌표를 테이블 위 3D 좌표로 변환.
 * 배열 전체가 테이블 안에 들어오도록 자동으로 가운데 정렬 + 축소한다.
 * 스프레드 y+ 방향 = 테이블 안쪽(-z, 화면 위쪽).
 */
export function getTableLayout(spread: Spread, cardW: number, cardH: number): TableSlot[] {
  const unitX = cardW + GAP;
  const unitZ = cardH + GAP;
  const pts = spread.positions.map((p) => ({ x: p.x * unitX, z: -p.y * unitZ, rot: ((p.rotate ?? 0) * Math.PI) / 180 }));

  const minX = Math.min(...pts.map((p) => p.x)) - cardW / 2;
  const maxX = Math.max(...pts.map((p) => p.x)) + cardW / 2;
  const minZ = Math.min(...pts.map((p) => p.z)) - cardH / 2;
  const maxZ = Math.max(...pts.map((p) => p.z)) + cardH / 2;
  const scale = Math.min(1, FIT / (maxX - minX), FIT / (maxZ - minZ));
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return pts.map((p) => ({
    position: [(p.x - cx) * scale, SURFACE_Y, (p.z - cz) * scale],
    rotationY: p.rot,
    scale,
  }));
}
