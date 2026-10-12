"use client";

import { CARDS } from "@/lib/deck";
import { useReading } from "@/store/readingStore";

/** 메이저 아르카나가 공개되는 순간 화면 위쪽에 크게 떠오르는 카드 이름 */
export default function MajorTitle() {
  const moment = useReading((s) => s.majorMoment);
  const drawn = useReading((s) => s.drawn);
  const d = drawn.find((x) => x.slot === moment.slot);
  if (!moment.tick || !d) return null;
  const card = CARDS[d.cardIndex];

  return (
    <div
      key={moment.tick}
      className="animate-major-title absolute inset-x-0 top-[3vh] flex flex-col items-center gap-1 px-4 text-center opacity-0"
    >
      <p className="font-display text-sm tracking-[0.8em] text-gold/90">{card.roman}</p>
      <h2
        className={`font-display text-4xl font-semibold tracking-[0.2em] sm:text-6xl ${
          d.reversed ? "text-rose-200 drop-shadow-[0_0_24px_rgba(255,80,110,0.7)]" : "gold-text"
        }`}
      >
        {card.nameEn.toUpperCase()}
      </h2>
      <p className="font-serif-ko text-lg tracking-[0.4em] text-parchment/90">
        {card.nameKo}
        {d.reversed && <span className="ml-2 text-sm tracking-normal text-rose-300">역방향</span>}
      </p>
    </div>
  );
}
