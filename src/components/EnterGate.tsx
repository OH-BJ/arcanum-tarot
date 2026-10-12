"use client";

import { useReading } from "@/store/readingStore";
import { sfx, unlockAudio } from "@/lib/sound";

const CANDLE_COUNT = 7;

/** 첫 화면: 로딩 → "운명의 문 열기" 버튼. 이 클릭으로 오디오가 풀리고 인트로(촛불 점등)가 시작된다 */
export default function EnterGate() {
  const ready = useReading((s) => s.readyAt !== null);
  const entered = useReading((s) => s.introStartedAt !== null);
  const enter = useReading((s) => s.enter);

  const open = () => {
    if (entered) return;
    unlockAudio();
    enter();
    sfx.ambientStart();
    sfx.introCandles(CANDLE_COUNT);
  };

  return (
    <div
      className={`absolute inset-x-0 bottom-[16vh] flex flex-col items-center gap-4 px-4 text-center transition-opacity duration-700 ${
        entered ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {ready ? (
        <>
          <button
            onClick={open}
            disabled={entered}
            tabIndex={entered ? -1 : 0}
            // 사라진 뒤에도 투명한 버튼이 아래 입력칸 클릭을 가로채지 않도록 버튼 자체의 포인터 이벤트를 끔
            className={`${entered ? "pointer-events-none" : "pointer-events-auto"} rounded-full border border-gold/50 bg-gold/5 px-10 py-4 font-serif-ko text-lg tracking-[0.3em] text-gold shadow-[0_0_40px_rgba(212,175,55,0.15)] transition hover:bg-gold/15 hover:shadow-[0_0_60px_rgba(212,175,55,0.4)]`}
          >
            ✦ 운명의 문 열기 ✦
          </button>
          <p className="font-serif-ko text-xs tracking-widest text-parchment/45">소리와 함께 감상하면 더 좋아요</p>
          <p className="font-serif-ko text-[11px] tracking-wider text-parchment/35">
            화면이 버벅이면 들어간 뒤 오른쪽 위에서 &lsquo;가벼운&rsquo; 화질을 골라 주세요
          </p>
        </>
      ) : (
        <p className="animate-pulse-soft font-serif-ko text-sm tracking-[0.4em] text-parchment/60">별빛을 모으는 중…</p>
      )}
    </div>
  );
}
