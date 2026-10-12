// 서버 전용: Gemini REST API로 타로 종합 해석을 스트리밍 (SDK 없이 fetch만 사용)
import { getCardById } from "./deck";
import { getSpread } from "./spreads";
import type { Spread } from "@/types/tarot";

export const GEMINI_MODEL = "gemini-2.5-flash";

export interface InterpretRequest {
  question: string;
  spreadId: Spread["id"];
  cards: { cardId: string; reversed: boolean; slot: number }[];
}

const SYSTEM_PROMPT = `당신은 따뜻하고 통찰력 있는 타로 리더입니다. 라이더–웨이트 덱으로 뽑힌 카드를 바탕으로 한국어로 종합 해석을 들려줍니다.

규칙:
- 존댓말(~해요/~입니다)로, 신비롭지만 과장 없이 다정하게 이야기하세요.
- 4~5개의 짧은 문단, 전체 600~900자. 마크다운 기호(#, *, - 목록)는 쓰지 말고 문단만 쓰세요.
- 첫 문단은 질문(없으면 지금의 흐름)에 대한 한 줄 핵심 메시지로 시작하세요.
- 각 카드를 그 자리의 의미와 연결하고, 카드들 사이의 흐름과 관계를 이야기하세요. 카드 이름은 한국어로 쓰세요.
- 역방향 카드는 막힘·지나침·내면의 문제로 부드럽게 해석하세요. 겁을 주거나 단정하지 마세요.
- 마지막 문단은 오늘 해 볼 수 있는 구체적이고 작은 행동 하나를 제안하세요.
- 건강·법률·투자 등에 대해 단정하거나 전문가 판단을 대신하는 말은 하지 마세요.`;

/** 요청을 검증하고 Gemini에 보낼 사용자 프롬프트를 만든다. 잘못된 요청이면 null */
export function buildPrompt(req: InterpretRequest): string | null {
  let spread: Spread;
  try {
    spread = getSpread(req.spreadId);
  } catch {
    return null;
  }
  if (!Array.isArray(req.cards) || req.cards.length !== spread.positions.length) return null;
  const question = typeof req.question === "string" ? req.question.trim().slice(0, 80) : "";

  const lines: string[] = [];
  for (const c of [...req.cards].sort((a, b) => a.slot - b.slot)) {
    const card = getCardById(String(c.cardId));
    const pos = spread.positions[c.slot];
    if (!card || !pos) return null;
    lines.push(
      `${pos.index}. [${pos.label} — ${pos.meaning}] ${card.nameKo}(${card.nameEn}) ${c.reversed ? "역방향" : "정방향"}` +
        ` / 키워드: ${card.keywords.join(", ")} / 기본 의미: ${c.reversed ? card.reversed : card.upright}`,
    );
  }

  return [
    `질문: ${question || "(질문 없음 — 지금 삶의 흐름 전반에 대해)"}`,
    `배열: ${spread.name} (${spread.description})`,
    "",
    "뽑힌 카드:",
    ...lines,
    "",
    "위 카드들로 종합 해석을 들려주세요.",
  ].join("\n");
}

/** Gemini 스트리밍 응답(SSE)을 순수 텍스트 스트림으로 바꿔 돌려준다 */
export async function streamInterpretation(apiKey: string, prompt: string, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1400,
          thinkingConfig: { thinkingBudget: 0 }, // 빠른 응답 + 무료 사용량 절약
        },
      }),
    },
  );
  if (!res.ok || !res.body) return res;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const reader = res.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      for (const ev of events) {
        const data = ev
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("");
        if (!data) continue;
        try {
          const json = JSON.parse(data) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          /* 잘린 조각은 무시 */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
