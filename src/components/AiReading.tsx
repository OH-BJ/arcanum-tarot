"use client";

import { useEffect, useRef, useState } from "react";
import { CARDS } from "@/lib/deck";
import type { Drawn } from "@/store/readingStore";
import type { Spread } from "@/types/tarot";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

const ERROR_TEXT: Record<string, string> = {
  quota: "오늘 준비된 AI 해석을 모두 사용했어요. 위의 '전체 흐름'을 참고해 주세요.",
  "rate-limit": "잠시 후 다시 시도해 주세요. (요청이 너무 잦아요)",
  "no-key": "AI 해석이 아직 설정되지 않았어요. 위의 '전체 흐름'을 참고해 주세요.",
};

/** 모든 카드가 공개된 뒤 누르면 Gemini 종합 해석을 글자가 흘러나오듯 보여줌 (무료 사용량 절약을 위해 버튼으로만 요청) */
export default function AiReading({ spreadId, question, drawn }: { spreadId: Spread["id"]; question: string; drawn: Drawn[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus("loading");
    setText("");
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          question,
          spreadId,
          cards: drawn.map((d) => ({ cardId: CARDS[d.cardIndex].id, reversed: d.reversed, slot: d.slot })),
        }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(ERROR_TEXT[j.error ?? ""] ?? "AI 해석을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        setStatus("error");
        return;
      }
      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + decoder.decode(value, { stream: true }));
      }
      setStatus("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError("AI 해석을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.");
      setStatus("error");
    }
  };

  return (
    <div className="animate-fade-up mt-4 rounded-xl border border-violet-300/25 bg-violet-400/[0.05] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-serif-ko text-sm font-bold tracking-widest text-violet-200">✦ AI 종합 해석</p>
        {status === "done" && (
          <button onClick={run} className="font-serif-ko text-xs text-parchment/50 transition hover:text-violet-200">
            다시 듣기
          </button>
        )}
      </div>

      {status === "idle" && (
        <button
          onClick={run}
          className="mt-3 w-full rounded-xl border border-violet-300/40 bg-violet-400/10 py-3 font-serif-ko text-sm tracking-widest text-violet-100 transition hover:bg-violet-400/20 hover:shadow-[0_0_24px_rgba(167,139,250,0.35)]"
        >
          카드들의 이야기 듣기
        </button>
      )}
      {status === "loading" && <p className="animate-pulse-soft mt-3 font-serif-ko text-sm text-parchment/70">카드들이 속삭이는 이야기를 모으는 중…</p>}
      {(status === "streaming" || status === "done") && (
        <div className="mt-3 space-y-3 font-serif-ko text-[14.5px] leading-7 text-parchment/90">
          {text
            .split(/\n+/)
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          {status === "streaming" && <span className="inline-block h-4 w-1.5 animate-pulse bg-violet-200/70 align-middle" />}
        </div>
      )}
      {status === "error" && (
        <div className="mt-3">
          <p className="font-serif-ko text-sm leading-6 text-parchment/70">{error}</p>
          <button onClick={run} className="mt-2 font-serif-ko text-xs text-violet-200/80 hover:text-violet-100">
            다시 시도
          </button>
        </div>
      )}
      <p className="mt-3 font-serif-ko text-[11px] text-parchment/35">AI가 만든 해석이에요. 재미와 자기성찰용으로만 참고해 주세요.</p>
    </div>
  );
}
