// 카드 앞면: 빛으로 타오르며 드러나는 디졸브 + 시선/마우스 각도에 반응하는 홀로그램 포일
import { noiseGLSL } from "./noise";

export const cardFrontVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const cardFrontFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uReveal;   // 0 = 숨김, 1 = 완전히 드러남
uniform float uFoil;     // 포일 강도
uniform vec2 uMouse;     // -1..1
uniform vec3 uTint;      // 정방향(금) / 역방향(진홍) 기운

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vViewDir;

${noiseGLSL}

void main() {
  vec3 tex = texture2D(uMap, vUv).rgb;

  // 촛불 아래 있는 듯한 따뜻한 톤 + 가장자리 비네팅
  vec2 c = vUv - 0.5;
  float vig = smoothstep(0.85, 0.25, length(c * vec2(1.1, 0.8)));
  vec3 color = tex * vec3(1.02, 0.94, 0.84) * mix(0.72, 1.0, vig);

  // 홀로그램 포일: 시선 각도 + 위치 + 마우스에 따라 무지갯빛이 흐름
  float facing = dot(normalize(vNormalW), normalize(vViewDir));
  float phase = facing * 2.5 + vUv.y * 1.8 + vUv.x * 0.6 + uMouse.x * 0.8 + uMouse.y * 0.5 + uTime * 0.05;
  vec3 iridescent = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + phase));
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  float foilMask = smoothstep(0.55, 0.95, lum);
  // 대각선으로 지나가는 광택 띠
  float sweep = smoothstep(0.12, 0.0, abs(vUv.x + vUv.y * 0.6 - 0.8 - uMouse.x * 0.6));
  color += iridescent * foilMask * 0.22 * uFoil;
  color += vec3(1.0, 0.9, 0.7) * sweep * 0.18 * uFoil;

  // 디졸브: 노이즈 경계를 따라 금빛 불꽃이 번지며 그림이 드러남
  float n = fbm(vUv * vec2(3.0, 5.0) + 3.7);
  float threshold = uReveal * 1.35 - 0.2;
  float diff = threshold - n;
  vec3 hidden = vec3(0.025, 0.015, 0.06) + uTint * 0.05 * fbm(vUv * 12.0 + uTime * 0.2);
  float shown = smoothstep(0.0, 0.02, diff);
  float edge = smoothstep(0.09, 0.0, abs(diff)) * step(0.001, uReveal) * step(uReveal, 0.999);
  color = mix(hidden, color, shown);
  color += uTint * edge * 6.0;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
