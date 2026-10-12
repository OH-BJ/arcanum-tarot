"use client";

import { getSpread } from "@/lib/spreads";
import { useReading } from "@/store/readingStore";

/** 카드 고르기 단계 안내: 몇 장 남았는지 + 다음 자리 이름 */
export default function PickProgress({ visible }: { visible: boolean }) {
  const spreadId = useReading((s) => s.spreadId);
  const picked = useReading((s) => s.drawn.length);
  const spread = getSpread(spreadId);
  const total = spread.positions.length;
  const next = spread.positions[picked];

  return (
    <section
      className={`absolute inset-x-0 top-[5vh] flex flex-col items-center gap-3 px-4 text-center transition-all duration-700 ${
        visible ? "opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <p className="font-display text-xs tracking-[0.5em] text-gold/75">{spread.name}</p>
      <h2 className="font-serif-ko text-xl text-parchment sm:text-2xl">
        {next ? (
          <>
            마음이 끌리는 카드를 골라 주세요 <span className="text-gold">({picked}/{total})</span>
          </>
        ) : (
          "카드를 테이블에 놓는 중…"
        )}
      </h2>
      {next && (
        <p className="font-serif-ko text-sm text-parchment/70">
          다음 자리 · <span className="text-gold/90">{next.label}</span> — {next.meaning}
        </p>
      )}
      <div className="mt-1 flex gap-2">
        {spread.positions.map((p, i) => (
          <span
            key={p.index}
            className={`h-2 w-2 rounded-full transition-all duration-500 ${
              i < picked ? "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.9)]" : i === picked ? "animate-pulse bg-gold/60" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
