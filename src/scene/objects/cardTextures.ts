import * as THREE from "three";

const loader = new THREE.TextureLoader();
const cache = new Map<string, Promise<THREE.Texture>>();

/** 카드 앞면 텍스처를 필요할 때만 불러오고 캐시 (78장을 한꺼번에 받지 않음) */
export function loadCardTexture(url: string): Promise<THREE.Texture> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    });
    p.catch(() => cache.delete(url)); // 실패하면 다음에 다시 시도
    cache.set(url, p);
  }
  return p;
}

/** 첫 공개 전까지 쓰는 1×1 자리표시 텍스처 */
export const PLACEHOLDER_TEXTURE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([20, 12, 40, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
})();
