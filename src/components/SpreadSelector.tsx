"use client";

import { useRef } from "react";
import { SPREADS } from "@/lib/spreads";
import { useReading } from "@/store/readingStore";
import type { Spread } from "@/types/tarot";
import { setQuestionOrigin } from "./QuestionFlight";

/** 질문 입력 + 스프레드(배열) 고르기 — 고르면 질문이 수정구슬로 들어가고 셔플 시작 */
export default function SpreadSelector({ visible }: { visible: boolean }) {
  const question = useReading((s) => s.question);
  const setQuestion = useReading((s) => s.setQuestion);
  const startReading = useReading((s) => s.startReading);
  const input = useRef<HTMLInputElement>(null);

  const start = (id: Spread["id"]) => {
    setQuestionOrigin(input.current?.getBoundingClientRect() ?? null);
    startReading(id);
  };

  return (
    <section
      className={`absolute inset-x-0 bottom-[4vh] flex flex-col items-center gap-4 px-4 transition-all duration-1000 ${
        visible ? "pointer-events-auto translate-y-0 opacity-100 delay-500" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <p className="animate-pulse-soft text-center font-serif-ko text-sm tracking-widest text-parchment/80">
        ✦ 마음속 질문을 적고, 배열을 골라 주세요 ✦
      </p>
      <input
        ref={input}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={60}
        placeholder="무엇이 궁금한가요? (비워 두어도 괜찮아요)"
        className="w-full max-w-xl rounded-full border border-gold/30 bg-[#0d0820]/70 px-6 py-3 text-center font-serif-ko text-lg text-parchment placeholder:text-parchment/35 backdrop-blur-md transition focus:border-gold/70 focus:shadow-[0_0_30px_rgba(212,175,55,0.25)] focus:outline-none"
      />
      <div className="grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
        {SPREADS.map((spread) => (
          <button
            key={spread.id}
            onClick={() => start(spread.id)}
            className="group rounded-2xl border border-gold/25 bg-[#0d0820]/65 px-4 py-4 text-left backdrop-blur-md transition hover:-translate-y-1 hover:border-gold/60 hover:bg-[#1a1036]/75 hover:shadow-[0_0_32px_rgba(212,175,55,0.25)]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="gold-text font-serif-ko text-lg font-bold">{spread.name}</span>
              <span className="font-display text-xs tracking-widest text-gold/70">{spread.positions.length}장</span>
            </div>
            <p className="mt-1 font-serif-ko text-xs leading-5 text-parchment/65 group-hover:text-parchment/85">
              {spread.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
