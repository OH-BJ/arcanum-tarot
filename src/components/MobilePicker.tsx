"use client";

import { useRef, useSyncExternalStore } from "react";
import { useReading } from "@/store/readingStore";
import { pickRibbon, scrollRibbon, setRibbonTarget } from "@/scene/pickRibbon";
import { isPortrait } from "@/scene/layout";

const RIBBON_PX_PER_CARD = 70; // 손가락으로 이만큼 밀면 한 장 넘어감

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const getPortrait = () => isPortrait(window.innerWidth / window.innerHeight);

/**
 * 휴대폰 카드 고르기: 좌우로 스와이프해 넘기고, 가운데 카드를 탭하거나 버튼으로 선택.
 * (세로 화면에서만 — 가로/PC는 3D 아치를 직접 클릭)
 */
export default function MobilePicker() {
  const phase = useReading((s) => s.phase);
  const pickCard = useReading((s) => s.pickCard);
  const portrait = useSyncExternalStore(subscribeResize, getPortrait, () => false);
  const drag = useRef<{ x: number; start: number; t: number; lastX: number; lastT: number; v: number } | null>(null);

  if (phase !== "picking" || !portrait) return null;

  const pickFocused = () => {
    if (pickRibbon.focusedDeckPos >= 0) pickCard(pickRibbon.focusedDeckPos);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const now = performance.now();
    drag.current = { x: e.clientX, start: pickRibbon.value, t: now, lastX: e.clientX, lastT: now, v: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT); // px/ms
    d.lastX = e.clientX;
    d.lastT = now;
    // 손가락을 따라 리본이 바로 움직이도록 (끌 때는 정수로 반올림하지 않음)
    pickRibbon.target = Math.min(Math.max(d.start - (e.clientX - d.x) / RIBBON_PX_PER_CARD, 0), Math.max(0, pickRibbon.count - 1));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const moved = Math.abs(e.clientX - d.x);
    if (moved < 8 && performance.now() - d.t < 400) {
      // 탭: 가운데면 선택, 양옆이면 한 장씩 넘김
      const third = window.innerWidth / 3;
      if (e.clientX < third) scrollRibbon(-1);
      else if (e.clientX > third * 2) scrollRibbon(1);
      else pickFocused();
      return;
    }
    // 관성: 손을 뗀 속도만큼 더 미끄러진 뒤 가장 가까운 카드에 멈춤
    setRibbonTarget(pickRibbon.target - (d.v * 260) / RIBBON_PX_PER_CARD);
  };

  return (
    <>
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-[20vh] top-[24vh] touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (drag.current = null)}
      />
      <div className="absolute inset-x-0 bottom-[5vh] flex flex-col items-center gap-3 px-6">
        <p className="font-serif-ko text-xs tracking-widest text-parchment/55">‹ 좌우로 넘기고, 가운데 카드를 탭하세요 ›</p>
        <div className="flex w-full max-w-sm items-center gap-3">
          <button
            onClick={() => scrollRibbon(-1)}
            aria-label="이전 카드"
            className="pointer-events-auto h-12 w-12 shrink-0 rounded-full border border-white/15 bg-[#0d0820]/70 text-parchment/80 backdrop-blur-md active:bg-white/10"
          >
            ‹
          </button>
          <button
            onClick={pickFocused}
            className="pointer-events-auto h-12 flex-1 rounded-full border border-gold/50 bg-gold/15 font-serif-ko text-base tracking-[0.2em] text-gold shadow-[0_0_30px_rgba(212,175,55,0.25)] backdrop-blur-md active:bg-gold/25"
          >
            ✦ 이 카드 선택
          </button>
          <button
            onClick={() => scrollRibbon(1)}
            aria-label="다음 카드"
            className="pointer-events-auto h-12 w-12 shrink-0 rounded-full border border-white/15 bg-[#0d0820]/70 text-parchment/80 backdrop-blur-md active:bg-white/10"
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
