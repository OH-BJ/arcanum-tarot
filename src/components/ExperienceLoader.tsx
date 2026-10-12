"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { detectGpu } from "@/scene/layout";

// three.js는 브라우저 전용 — 서버 프리렌더 제외
const Experience = dynamic(() => import("@/scene/Experience"), { ssr: false });

const detectWebGL = () => detectGpu().webgl; // 결과는 layout.ts에서 캐시

const subscribe = () => () => {};

export default function ExperienceLoader() {
  // 서버에서는 true로 가정, 브라우저에서 실제 지원 여부 확인
  const webgl = useSyncExternalStore(subscribe, detectWebGL, () => true);

  if (!webgl) {
    return (
      <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-night px-6 text-center">
        <p className="gold-text font-display text-3xl tracking-[0.2em]">ARCANUM</p>
        <p className="font-serif-ko text-parchment/80">이 브라우저에서는 3D 화면을 지원하지 않아요.</p>
        <p className="font-serif-ko text-sm text-parchment/55">최신 Chrome·Safari·Edge에서 다시 열어 주세요. 카드 도감은 지금도 볼 수 있어요.</p>
        <Link href="/cards" className="mt-2 rounded-full border border-gold/50 px-6 py-2 font-serif-ko text-gold hover:bg-gold/10">
          카드 도감 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <Experience />
    </div>
  );
}
