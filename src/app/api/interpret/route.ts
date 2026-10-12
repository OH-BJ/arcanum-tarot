import { buildPrompt, streamInterpretation, type InterpretRequest } from "@/lib/gemini";

// 아주 단순한 IP별 요청 제한 (무료 사용량 보호용, 서버 인스턴스마다 따로 셈)
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** POST /api/interpret — 뽑힌 카드로 AI 종합 해석을 텍스트 스트림으로 돌려줌. 실패 시 { error } JSON */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "no-key" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "rate-limit" }, { status: 429 });

  let body: InterpretRequest;
  try {
    body = (await request.json()) as InterpretRequest;
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const prompt = buildPrompt(body);
  if (!prompt) return Response.json({ error: "bad-request" }, { status: 400 });

  try {
    const res = await streamInterpretation(apiKey, prompt, request.signal);
    if (res.ok) return res;
    // 429 = 무료 사용량 초과
    return Response.json({ error: res.status === 429 ? "quota" : "upstream" }, { status: res.status === 429 ? 429 : 502 });
  } catch {
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
