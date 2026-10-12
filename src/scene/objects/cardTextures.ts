import * as THREE from "three";

const cache = new Map<string, Promise<THREE.Texture>>();
let renderer: THREE.WebGLRenderer | null = null;

/** 렌더러 등록 (Director가 첫 프레임에) — 텍스처를 미리 GPU에 올릴 때 사용 */
export function registerRenderer(gl: THREE.WebGLRenderer) {
  renderer = gl;
}

const canUseBitmap = typeof createImageBitmap !== "undefined";
const bitmapLoader = canUseBitmap ? new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }) : null;
const imageLoader = new THREE.TextureLoader();

/**
 * 카드 앞면 텍스처를 필요할 때만 불러오고 캐시 (78장을 한꺼번에 받지 않음).
 * 가능하면 ImageBitmap으로 디코딩해 메인 스레드 끊김을 줄이고, 불러온 즉시 GPU에 올려 둔다.
 */
export function loadCardTexture(url: string): Promise<THREE.Texture> {
  let p = cache.get(url);
  if (!p) {
    p = (
      bitmapLoader
        ? bitmapLoader.loadAsync(url).then((bitmap) => {
            const t = new THREE.Texture(bitmap as ImageBitmap);
            t.flipY = false; // 디코딩 단계에서 이미 뒤집음
            t.needsUpdate = true;
            return t;
          })
        : imageLoader.loadAsync(url)
    ).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      renderer?.initTexture(t); // 처음 그릴 때가 아니라 지금 업로드 → 공개 순간 멈칫 방지
      return t;
    });
    p.catch(() => cache.delete(url)); // 실패하면 다음에 다시 시도
    cache.set(url, p);
  }
  return p;
}

/** 곧 뽑힐 가능성이 있는 카드(호버·가운데 카드)를 미리 받아 둠 */
export function prefetchCardTexture(url: string) {
  void loadCardTexture(url).catch(() => {});
}

/** 첫 공개 전까지 쓰는 1×1 자리표시 텍스처 */
export const PLACEHOLDER_TEXTURE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([20, 12, 40, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
})();
