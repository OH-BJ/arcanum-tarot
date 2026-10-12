import * as THREE from "three";
import { seededRandom } from "@/lib/random";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f3d98b";

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/** 카드 뒷면: 남색 바탕 + 금박 테두리, 해와 초승달, 별자리 */
export function createCardBackTexture(): THREE.CanvasTexture {
  const W = 600;
  const H = 1000;
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = seededRandom(7);

  const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H * 0.7);
  bg.addColorStop(0, "#22124a");
  bg.addColorStop(0.6, "#120a2a");
  bg.addColorStop(1, "#06030f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 별가루
  for (let i = 0; i < 260; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillStyle = `rgba(243,217,139,${0.15 + rand() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, rand() * 1.6 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 이중 금 테두리
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 7;
  roundRect(ctx, 22, 22, W - 44, H - 44, 26);
  ctx.stroke();
  ctx.lineWidth = 2;
  roundRect(ctx, 38, 38, W - 76, H - 76, 18);
  ctx.stroke();

  // 모서리 장식
  ctx.fillStyle = GOLD_LIGHT;
  for (const [x, y] of [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]) {
    star(ctx, x, y, 14);
  }

  const cx = W / 2;
  const cy = H / 2;

  // 태양 광선
  ctx.strokeStyle = GOLD;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const long = i % 2 === 0;
    ctx.lineWidth = long ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
    ctx.lineTo(cx + Math.cos(a) * (long ? 235 : 195), cy + Math.sin(a) * (long ? 235 : 195));
    ctx.stroke();
  }

  // 원환
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 250, 0, Math.PI * 2);
  ctx.stroke();

  // 초승달
  const moon = ctx.createLinearGradient(cx - 90, cy - 90, cx + 90, cy + 90);
  moon.addColorStop(0, GOLD_LIGHT);
  moon.addColorStop(1, GOLD);
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a0f3a";
  ctx.beginPath();
  ctx.arc(cx + 38, cy - 22, 82, 0, Math.PI * 2);
  ctx.fill();

  // 위아래 별과 눈금
  ctx.fillStyle = GOLD_LIGHT;
  star(ctx, cx, 150, 26);
  star(ctx, cx, H - 150, 26);
  star(ctx, cx - 70, 200, 9);
  star(ctx, cx + 70, 200, 9);
  star(ctx, cx - 70, H - 200, 9);
  star(ctx, cx + 70, H - 200, 9);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  for (const y of [cy - 300, cy + 300]) {
    ctx.beginPath();
    ctx.moveTo(cx - 180, y);
    ctx.lineTo(cx + 180, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 테이블 위 마법진 (흰 선 — 재질 색으로 금빛을 입힘) */
export function createMagicCircleTexture(): THREE.CanvasTexture {
  const S = 1024;
  const { canvas, ctx } = makeCanvas(S, S);
  const c = S / 2;
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";

  const ring = (r: number, w: number) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  ring(500, 4);
  ring(480, 1.5);
  ring(390, 3);
  ring(372, 1);
  ring(220, 2);
  ring(90, 2);

  // 눈금
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const len = i % 10 === 0 ? 22 : 10;
    ctx.lineWidth = i % 10 === 0 ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 480, c + Math.sin(a) * 480);
    ctx.lineTo(c + Math.cos(a) * (480 - len), c + Math.sin(a) * (480 - len));
    ctx.stroke();
  }

  // 황도 12궁
  const glyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  ctx.font = "54px 'Segoe UI Symbol', 'Noto Sans Symbols', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  glyphs.forEach((g, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * 430, c + Math.sin(a) * 430);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(g + "︎", 0, 0);
    ctx.restore();
  });

  // 육망성
  const tri = (offset: number) => {
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = offset + (i / 3) * Math.PI * 2;
      const x = c + Math.cos(a) * 372;
      const y = c + Math.sin(a) * 372;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  tri(-Math.PI / 2);
  tri(Math.PI / 2);

  // 안쪽 룬 점
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(c + Math.cos(a) * 155, c + Math.sin(a) * 155, i % 2 ? 3 : 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
