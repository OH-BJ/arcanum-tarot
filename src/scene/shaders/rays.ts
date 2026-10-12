// 카드 뒤에서 뿜어져 나오는 회전 광선
export const raysVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const raysFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);
  float a = atan(p.y, p.x);
  float rays = pow(abs(sin(a * 9.0 + uTime * 0.25)), 6.0) * 0.7
             + pow(abs(sin(a * 14.0 - uTime * 0.18 + 1.3)), 10.0) * 0.5;
  float falloff = smoothstep(0.5, 0.05, r);
  float core = smoothstep(0.22, 0.0, r) * 0.6;
  float v = (rays * falloff + core) * uOpacity;
  gl_FragColor = vec4(uColor * v, v);
}
`;
