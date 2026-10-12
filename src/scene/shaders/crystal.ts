// 수정구슬: 가장자리 프레넬 광택 + 안쪽에서 소용돌이치는 성운 (질문을 담을수록 uEnergy↑)
import { noiseGLSL } from "./noise";

export const crystalVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vLocal;

void main() {
  vLocal = normalize(position);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const crystalFragment = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uFlash;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vLocal;

${noiseGLSL}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);
  float facing = max(dot(N, V), 0.0);
  float fres = pow(1.0 - facing, 2.5);

  // 굴절된 듯 안쪽을 들여다보는 좌표를 회전시켜 소용돌이를 만듦
  vec3 q = vLocal * 0.65 - V * 0.35;
  float ang = uTime * (0.35 + uEnergy * 1.2) + length(q.xz) * (3.0 + uEnergy * 4.0);
  float c = cos(ang), s = sin(ang);
  q.xz = mat2(c, -s, s, c) * q.xz;
  float n = fbm(q.xz * 2.6 + q.y * 1.8 + uTime * 0.12);
  float swirl = smoothstep(0.32, 0.85, n);

  vec3 deep = vec3(0.04, 0.02, 0.10);
  vec3 violet = vec3(0.48, 0.28, 1.0);
  vec3 gold = vec3(1.0, 0.74, 0.35);
  vec3 col = deep + violet * swirl * (0.35 + uEnergy * 1.9) + gold * pow(swirl, 3.0) * uEnergy * 2.6;

  // 중심부의 빛과 가장자리 광택, 반사 하이라이트
  float core = pow(facing, 7.0) * (0.15 + uEnergy * 1.6);
  col += gold * core;
  col += vec3(0.72, 0.68, 1.0) * fres * (0.55 + uEnergy * 0.8);
  vec3 L = normalize(vec3(-0.4, 0.85, 0.45));
  col += pow(max(dot(reflect(-V, N), L), 0.0), 60.0) * 1.2;
  col += vec3(1.0, 0.9, 0.7) * uFlash * 3.0;

  float alpha = clamp(0.22 + fres * 0.7 + swirl * 0.35 * (0.4 + uEnergy) + core + uFlash, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
