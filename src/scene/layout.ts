/** 세로로 긴 화면(휴대폰)인지 — 카메라 샷과 아치 배치를 따로 쓴다 */
export const isPortrait = (aspect: number) => aspect < 0.8;

/** 카드를 펼치는 아치 배치 (가로 화면 / 세로 화면) */
export const ARCH = {
  wide: { center: [0, -0.35, 1.2] as const, radius: 2.9, from: 158, to: 22, scale: 0.6 },
  portrait: { center: [0, 0.6, 1.4] as const, radius: 1.6, from: 150, to: 30, scale: 0.46 },
};

// ── 기기 성능 판별 ──────────────────────────────────────────────

let gpu: { webgl: boolean; software: boolean } | null = null;

/** WebGL 지원 여부 + 소프트웨어 렌더링(그래픽 가속 꺼짐) 여부. 검사용 컨텍스트는 한 번만 만듦 */
export function detectGpu() {
  if (gpu) return gpu;
  gpu = { webgl: false, software: false };
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      gpu.webgl = true;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      // 그래픽 가속이 꺼지면 CPU로 그리는 소프트웨어 렌더러가 잡힘
      gpu.software = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(renderer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* 감지 실패 시 기본값 */
  }
  return gpu;
}

const QUALITY_KEY = "arcanum:quality";

export type QualityChoice = "high" | "lite";
export type QualityLevel = "high" | "lite" | "ultra";

/** 사용자가 고른 화질 (없으면 null) — 브라우저에 기억 */
export function getQualityChoice(): QualityChoice | null {
  try {
    const v = localStorage.getItem(QUALITY_KEY);
    return v === "high" || v === "lite" ? v : null;
  } catch {
    return null;
  }
}

export function setQualityChoice(choice: QualityChoice) {
  try {
    localStorage.setItem(QUALITY_KEY, choice);
  } catch {
    /* 저장 불가 환경은 무시 */
  }
}

/**
 * 실제 적용 화질
 * - high: 기본 (휴대폰 포함 모든 기기의 기본값)
 * - lite: 사용자가 "가벼운"을 고름 — 블룸·금속 재질은 유지, 해상도·조명·파티클만 줄임
 * - ultra: 그래픽 가속이 꺼진 환경을 감지했고 사용자가 따로 고르지 않음 — 후처리 없이 가장 가볍게
 */
export function qualityLevel(): QualityLevel {
  if (typeof window === "undefined") return "high";
  const choice = getQualityChoice();
  if (choice) return choice;
  return detectGpu().software ? "ultra" : "high";
}

/** 조명·파티클을 줄이는 단계인지 (가벼운·초경량) */
export function isLowPower(): boolean {
  return qualityLevel() !== "high";
}

/** 후처리 효과까지 끄고 조명 없는 재질을 쓰는 단계인지 (초경량) */
export function isUltraLite(): boolean {
  return qualityLevel() === "ultra";
}
