/** 세로로 긴 화면(휴대폰)인지 — 카메라 샷과 아치 배치를 따로 쓴다 */
export const isPortrait = (aspect: number) => aspect < 0.8;

/** 카드를 펼치는 아치 배치 (가로 화면 / 세로 화면) */
export const ARCH = {
  wide: { center: [0, -0.35, 1.2] as const, radius: 2.9, from: 158, to: 22, scale: 0.6 },
  portrait: { center: [0, 0.6, 1.4] as const, radius: 1.6, from: 150, to: 30, scale: 0.46 },
};

/** 터치 기기·좁은 화면은 저사양 모드로 시작 (해상도·파티클·안티에일리어싱을 낮춤) */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}
