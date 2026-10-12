/**
 * 휴대폰(세로 화면) 카드 고르기: 카드를 한 줄로 늘어놓고 좌우로 넘기는 "리본".
 * DOM(스와이프·버튼)이 target을 바꾸고, 3D 덱이 매 프레임 value를 target으로 부드럽게 따라가며 배치한다.
 */
export const pickRibbon = {
  value: 0, // 현재 스크롤 위치 (리본 칸 단위, 소수)
  target: 0, // 멈출 위치 (정수 — 카드 한 장이 정확히 가운데)
  count: 0, // 아직 남은(안 뽑힌) 카드 수
  focusedDeckPos: -1, // 가운데에 있는 카드의 덱 위치 (뽑기 대상)
  initialized: false,
};

export function scrollRibbon(delta: number) {
  pickRibbon.target = clampTarget(pickRibbon.target + delta);
}

export function setRibbonTarget(t: number) {
  pickRibbon.target = clampTarget(t);
}

function clampTarget(t: number) {
  return Math.round(Math.min(Math.max(t, 0), Math.max(0, pickRibbon.count - 1)));
}

export function resetRibbon() {
  pickRibbon.initialized = false;
}
