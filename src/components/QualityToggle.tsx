"use client";

import { useState } from "react";
import { qualityLevel, setQualityChoice, type QualityChoice } from "@/scene/layout";

const OPTIONS: { id: QualityChoice; label: string; hint: string }[] = [
  { id: "high", label: "기본", hint: "원래 화질" },
  { id: "lite", label: "가벼운", hint: "버벅일 때 — 해상도·조명·입자를 줄임" },
];

/**
 * 오른쪽 위 화질 선택 [기본 | 가벼운] + 그래픽 가속이 꺼진 환경 안내.
 * 화질은 3D 시작 시 정해지므로 바꾸면 새로고침해서 적용. (입장 후에만 그려져 초기값을 바로 읽어도 됨)
 */
export default function QualityToggle() {
  const [level] = useState(() => qualityLevel());
  const [dismissed, setDismissed] = useState(false);
  const current: QualityChoice = level === "high" ? "high" : "lite";

  const choose = (id: QualityChoice) => {
    if (id === current && level !== "ultra") return;
    setQualityChoice(id);
    location.reload();
  };

  return (
    <>
      <div
        role="radiogroup"
        aria-label="화질"
        className="pointer-events-auto absolute right-[8.5rem] top-4 flex rounded-full border border-gold/25 bg-[#0d0820]/60 p-0.5 font-serif-ko text-xs backdrop-blur-md"
      >
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={current === o.id}
            title={o.hint}
            onClick={() => choose(o.id)}
            className={`rounded-full px-3 py-1.5 tracking-widest transition ${
              current === o.id ? "bg-gold/20 text-gold" : "text-parchment/60 hover:text-parchment"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {level === "ultra" && !dismissed && (
        <div className="pointer-events-auto absolute inset-x-4 top-28 mx-auto max-w-md rounded-xl border border-gold/30 bg-[#0d0820]/90 px-4 py-3 text-center backdrop-blur-md sm:top-16">
          <p className="font-serif-ko text-sm leading-6 text-parchment/85">
            이 브라우저는 그래픽 가속이 꺼져 있어 화면이 느릴 수 있어요.
            <br />
            <span className="text-gold/90">가장 가벼운 모드로 실행 중이에요.</span> 오른쪽 위에서 &lsquo;기본&rsquo;을 고르면 원래 화질로 볼 수 있어요.
          </p>
          <button onClick={() => setDismissed(true)} className="mt-1 font-serif-ko text-xs text-parchment/50 hover:text-parchment/80">
            확인
          </button>
        </div>
      )}
    </>
  );
}
