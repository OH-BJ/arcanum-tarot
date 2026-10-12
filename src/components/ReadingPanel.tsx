"use client";

import { CARDS, cardLabel } from "@/lib/deck";
import { summarizeReading } from "@/lib/interpret";
import { getSpread } from "@/lib/spreads";
import { useReading } from "@/store/readingStore";


const btn =
  "rounded-xl border py-2.5 font-serif-ko text-sm tracking-widest transition disabled:cursor-not-allowed disabled:opacity-30";

/** 읽기 단계: 선택한 자리의 카드 해석 + 이전/다음 + 전체 목록 + 전체 흐름 요약 */
export default function ReadingPanel({ visible }: { visible: boolean }) {
  const spreadId = useReading((s) => s.spreadId);
  const question = useReading((s) => s.question);
  const drawn = useReading((s) => s.drawn);
  const activeSlot = useReading((s) => s.activeSlot);
  const focusSlot = useReading((s) => s.focusSlot);
  const setActiveSlot = useReading((s) => s.setActiveSlot);
  const setFocus = useReading((s) => s.setFocus);
  const revealAll = useReading((s) => s.revealAll);
  const newReading = useReading((s) => s.newReading);

  const spread = getSpread(spreadId);
  const active = drawn.find((d) => d.slot === activeSlot);
  const activeCard = active ? CARDS[active.cardIndex] : null;
  const activePos = activeSlot !== null ? spread.positions[activeSlot] : null;
  const unrevealed = drawn.filter((d) => d.state === "placed").length;
  const revealed = drawn.filter((d) => d.state === "revealed").sort((a, b) => a.slot - b.slot);
  const allRevealed = drawn.length > 0 && revealed.length === drawn.length;
  const zooming = drawn.some((d) => d.state === "revealing");
  const summary = allRevealed
    ? summarizeReading(
        spread,
        revealed.map((d) => ({ card: CARDS[d.cardIndex], reversed: d.reversed, slot: d.slot })),
      )
    : [];

  // 공개된 카드 사이 이동
  const idx = revealed.findIndex((d) => d.slot === activeSlot);
  const go = (delta: number) => {
    const next = revealed[idx + delta];
    if (next) setActiveSlot(next.slot);
  };

  return (
    <>
      {/* 상단 안내 */}
      <p
        className={`absolute inset-x-0 top-[5vh] px-4 text-center font-serif-ko text-base tracking-widest text-parchment/85 transition-opacity duration-700 ${
          visible && unrevealed > 0 && focusSlot === null && !zooming ? "animate-pulse-soft opacity-100" : "opacity-0"
        }`}
      >
        ✦ 카드를 눌러 하나씩 뒤집어 보세요 ✦
      </p>

      {/* 해석 패널 */}
      <section
        className={`absolute inset-x-3 bottom-3 max-h-[46vh] overflow-y-auto rounded-2xl border border-gold/25 bg-[#0d0820]/80 p-5 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur-md transition-all duration-700 md:inset-x-auto md:bottom-auto md:right-[4vw] md:top-1/2 md:max-h-[88vh] md:w-[400px] md:-translate-y-1/2 md:p-6 ${
          visible ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <p className="font-display text-xs tracking-[0.45em] text-gold/75">{spread.name}</p>
        {question.trim() && (
          <p className="mt-2 font-serif-ko text-[15px] italic leading-6 text-parchment/90">“{question.trim()}”</p>
        )}

        {activeCard && activePos && active ? (
          <div key={`${activeSlot}-${active.state}`} className="animate-fade-up mt-3">
            <p className="font-serif-ko text-sm text-parchment/70">
              <span className="text-gold">
                {activePos.index} · {activePos.label}
              </span>{" "}
              — {activePos.meaning}
            </p>
            {active.state === "revealed" ? (
              <>
                <p className="mt-4 font-display text-[11px] tracking-[0.45em] text-gold/80">{cardLabel(activeCard)}</p>
                <h2 className="gold-text font-display text-[26px] font-semibold leading-tight tracking-wide">{activeCard.nameEn}</h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-serif-ko text-lg text-parchment">{activeCard.nameKo}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-serif-ko text-xs ${
                      active.reversed ? "border-rose-400/50 text-rose-300" : "border-gold/50 text-gold"
                    }`}
                  >
                    {active.reversed ? "역방향" : "정방향"}
                  </span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {activeCard.keywords.map((k) => (
                    <li key={k} className="rounded-md bg-white/5 px-2 py-1 font-serif-ko text-xs text-parchment/85">
                      {k}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-serif-ko text-[15px] leading-7 text-parchment/90">
                  {active.reversed ? activeCard.reversed : activeCard.upright}
                </p>

                <div className="mt-4 grid grid-cols-[auto_1fr_auto] gap-2">
                  <button onClick={() => go(-1)} disabled={idx <= 0} className={`${btn} border-white/15 px-3 text-parchment/80 hover:bg-white/10`}>
                    ◀
                  </button>
                  <button
                    onClick={() => setFocus(focusSlot === activeSlot ? null : activeSlot)}
                    className={`${btn} border-gold/40 bg-gold/10 text-gold hover:bg-gold/20`}
                  >
                    {focusSlot === activeSlot ? "테이블에 내려놓기" : "크게 보기"}
                  </button>
                  <button
                    onClick={() => go(1)}
                    disabled={idx < 0 || idx >= revealed.length - 1}
                    className={`${btn} border-white/15 px-3 text-parchment/80 hover:bg-white/10`}
                  >
                    ▶
                  </button>
                </div>
              </>
            ) : (
              <p className="animate-pulse-soft mt-6 font-serif-ko text-sm text-parchment/70">카드가 모습을 드러내는 중…</p>
            )}
          </div>
        ) : (
          <p className="mt-3 font-serif-ko text-sm leading-6 text-parchment/70">
            테이블 위의 카드를 눌러 뒤집으면, 그 자리의 의미와 카드의 메시지가 여기에 나타납니다.
          </p>
        )}

        {summary.length > 0 && (
          <div className="animate-fade-up mt-5 rounded-xl border border-gold/20 bg-gold/[0.04] p-4">
            <p className="font-serif-ko text-sm font-bold tracking-widest text-gold">전체 흐름</p>
            <ul className="mt-2 space-y-2">
              {summary.map((line) => (
                <li key={line} className="font-serif-ko text-[14px] leading-6 text-parchment/85">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* 전체 자리 목록 */}
        <ol className="space-y-1">
          {spread.positions.map((p, i) => {
            const d = drawn.find((x) => x.slot === i);
            const card = d?.state === "revealed" ? CARDS[d.cardIndex] : null;
            return (
              <li key={p.index}>
                <button
                  disabled={!card}
                  onClick={() => setActiveSlot(i)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-serif-ko text-sm transition ${
                    i === activeSlot ? "bg-gold/10" : card ? "hover:bg-white/5" : ""
                  }`}
                >
                  <span className="text-parchment/60">
                    {p.index} · {p.label}
                  </span>
                  <span className={card ? (d?.reversed ? "text-rose-300" : "text-gold") : "text-parchment/30"}>
                    {card ? `${card.nameKo}${d?.reversed ? " (역)" : ""}` : "?"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex gap-2">
          {unrevealed > 0 && (
            <button onClick={revealAll} className={`${btn} flex-1 border-gold/40 bg-gold/10 text-gold hover:bg-gold/20`}>
              모두 뒤집기
            </button>
          )}
          <button onClick={newReading} className={`${btn} flex-1 border-white/15 bg-white/5 text-parchment/85 hover:bg-white/10`}>
            새로운 리딩
          </button>
        </div>
      </section>
    </>
  );
}
