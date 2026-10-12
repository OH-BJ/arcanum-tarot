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

const LITE_KEY = "arcanum:lite";

/** 사용자가 "가벼운 모드"를 켰는지 (브라우저에 기억) */
export function isLiteForced(): boolean {
  try {
    return localStorage.getItem(LITE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLiteForced(on: boolean) {
  try {
    localStorage.setItem(LITE_KEY, on ? "1" : "0");
  } catch {
    /* 저장 불가 환경은 무시 */
  }
}

/** 초경량 모드: 그래픽 가속 꺼짐 또는 사용자가 가벼운 모드를 켬 → 화면 효과 끄고 해상도도 더 낮춤 */
export function isUltraLite(): boolean {
  if (typeof window === "undefined") return false;
  return isLiteForced() || detectGpu().software;
}

/** 터치 기기·좁은 화면·초경량 모드는 저사양 설정으로 시작 (해상도·파티클·조명·재질을 낮춤) */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 || isUltraLite();
}
