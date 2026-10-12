"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { QUESTION_SECONDS, useReading } from "@/store/readingStore";
import { ballScreen } from "@/scene/ballScreen";

/** 질문 입력칸의 화면 위치 — 글자들이 여기서 출발 (SpreadSelector가 기록) */
const questionOrigin = { rect: null as DOMRect | null };
export function setQuestionOrigin(rect: DOMRect | null) {
  questionOrigin.rect = rect;
}

const FLIGHT_MS = 1150;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * 질문 단계: 입력한 질문의 글자 하나하나가 빛나며 떠올라 수정구슬 속으로 빨려 들어간다.
 * 카메라가 움직이는 동안에도 구슬을 따라가도록 매 프레임 목표점(ballScreen)을 다시 읽는다.
 */
export default function QuestionFlight() {
  const phase = useReading((s) => s.phase);
  const [flight, setFlight] = useState<{ text: string; rect: DOMRect } | null>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (phase !== "question") return;
    const text = useReading.getState().question.trim();
    const rect = questionOrigin.rect;
    if (!text || !rect) return;
    // 질문 단계에 들어설 때 한 번 글자 배치를 만듦
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlight({ text, rect });
    const id = setTimeout(() => setFlight(null), QUESTION_SECONDS * 1000 + 200);
    return () => clearTimeout(id);
  }, [phase]);

  useLayoutEffect(() => {
    if (!flight) return;
    const els = spans.current.filter((el): el is HTMLSpanElement => !!el);
    const starts = els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    const stagger = Math.min(45, 900 / Math.max(1, els.length));
    const t0 = performance.now();
    let raf = 0;

    const tick = () => {
      const now = performance.now();
      let alive = false;
      els.forEach((el, i) => {
        const p = Math.min(1, Math.max(0, (now - t0 - i * stagger) / FLIGHT_MS));
        if (p < 1) alive = true;
        const e = easeInOut(p);
        const dx = (ballScreen.x - starts[i].x) * e;
        // 위로 솟구쳤다가 구슬로 떨어지는 곡선
        const dy = (ballScreen.y - starts[i].y) * e - Math.sin(p * Math.PI) * 90;
        const scale = 1 + Math.sin(p * Math.PI) * 0.35 - e * 0.85;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${Math.max(scale, 0.05)})`;
        el.style.opacity = String(p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25);
        el.style.filter = `blur(${e * 1.5}px)`;
      });
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flight]);

  if (!flight) return null;
  const { rect, text } = flight;

  return (
    <div
      className="absolute flex items-center justify-center font-serif-ko text-lg"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    >
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          ref={(el) => void (spans.current[i] = el)}
          className="inline-block whitespace-pre text-gold will-change-transform [text-shadow:0_0_12px_rgba(255,200,110,0.95),0_0_28px_rgba(212,175,55,0.7)]"
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
