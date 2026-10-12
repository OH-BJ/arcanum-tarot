"use client";

import { useReading } from "@/store/readingStore";
import SpreadSelector from "./SpreadSelector";
import PickProgress from "./PickProgress";
import ReadingPanel from "./ReadingPanel";
import MajorTitle from "./MajorTitle";
import EnterGate from "./EnterGate";
import QuestionFlight from "./QuestionFlight";
import SoundToggle from "./SoundToggle";
import { useEffect } from "react";
import Link from "next/link";

export default function Overlay() {
  const phase = useReading((s) => s.phase);
  // 입장 버튼을 누르면 암전을 걷어냄 (그 전까지는 촛불이 꺼진 어둠 + 타이틀)
  const entered = useReading((s) => s.introStartedAt !== null);
  const blackout = !entered;
  const showTitle = phase === "intro" || phase === "select";

  // Esc: 크게 보기 해제
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useReading.getState().setFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* 인트로 암전 */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-[2600ms] ease-out ${blackout ? "opacity-100" : "opacity-0"}`}
      />

      {/* 타이틀 */}
      <header
        className={`absolute inset-x-0 top-[6vh] flex flex-col items-center gap-3 px-4 text-center transition-all duration-[1400ms] ${
          showTitle ? "translate-y-0 opacity-100 delay-[1200ms]" : "-translate-y-6 opacity-0"
        }`}
      >
        <p className="font-display text-[11px] tracking-[0.6em] text-gold/70 sm:text-xs">TAROT · ARCANA</p>
        <h1 className="gold-text font-display text-4xl font-semibold tracking-[0.18em] sm:text-6xl">ARCANUM</h1>
        <p className="font-serif-ko text-sm text-parchment/70 sm:text-base">운명의 카드가 당신을 기다립니다</p>
      </header>

      <SpreadSelector visible={phase === "select"} />

      {/* 셔플 중 */}
      <p
        className={`absolute inset-x-0 top-[9vh] text-center font-serif-ko text-base tracking-[0.3em] text-parchment/85 transition-opacity duration-700 ${
          phase === "shuffling" ? "animate-pulse-soft opacity-100" : "opacity-0"
        }`}
      >
        카드를 섞고 있습니다
      </p>

      <PickProgress visible={phase === "picking"} />
      <ReadingPanel visible={phase === "reading"} />
      <MajorTitle />
      <QuestionFlight />
      <EnterGate />
      {entered && <SoundToggle />}
      {/* 카드 도감 바로가기 (배열 고르는 화면에서) */}
      <Link
        href="/cards"
        className={`absolute left-4 top-4 rounded-full border border-gold/25 bg-[#0d0820]/60 px-4 py-2 font-serif-ko text-xs tracking-widest text-parchment/75 backdrop-blur-md transition-opacity duration-700 hover:border-gold/60 hover:text-gold ${
          phase === "select" ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        ✦ 카드 도감
      </Link>
    </div>
  );
}
