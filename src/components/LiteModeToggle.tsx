"use client";

import { useState } from "react";
import { detectGpu, isLiteForced, setLiteForced } from "@/scene/layout";

/**
 * 오른쪽 위 "가벼운 모드" 버튼 + 그래픽 가속이 꺼진 환경 안내.
 * 품질은 3D 시작 시 정해지므로 바꾸면 새로고침해서 적용한다. (입장 후에만 그려져 초기값을 바로 읽어도 됨)
 */
export default function LiteModeToggle() {
  const [forced] = useState(() => isLiteForced());
  const [software] = useState(() => detectGpu().software);
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      <button
        onClick={() => {
          setLiteForced(!forced);
          location.reload();
        }}
        title={forced ? "원래 화질로 되돌립니다 (새로고침)" : "화면 효과를 줄여 버벅임을 줄입니다 (새로고침)"}
        className={`pointer-events-auto absolute right-4 top-16 rounded-full border px-4 py-2 font-serif-ko text-xs tracking-widest backdrop-blur-md transition sm:top-4 sm:right-36 ${
          forced
            ? "border-gold/60 bg-gold/15 text-gold"
            : "border-gold/25 bg-[#0d0820]/60 text-parchment/75 hover:border-gold/60 hover:text-gold"
        }`}
      >
        {forced ? "가벼운 모드 켜짐" : "가벼운 모드"}
      </button>

      {software && !dismissed && (
        <div className="pointer-events-auto absolute inset-x-4 top-28 mx-auto max-w-md rounded-xl border border-gold/30 bg-[#0d0820]/90 px-4 py-3 text-center backdrop-blur-md sm:top-16">
          <p className="font-serif-ko text-sm leading-6 text-parchment/85">
            이 브라우저는 그래픽 가속이 꺼져 있어 화면이 느릴 수 있어요.
            <br />
            <span className="text-gold/90">가장 가벼운 모드로 실행 중이에요.</span>
          </p>
          <button onClick={() => setDismissed(true)} className="mt-1 font-serif-ko text-xs text-parchment/50 hover:text-parchment/80">
            확인
          </button>
        </div>
      )}
    </>
  );
}
