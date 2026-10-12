import type { Card, Spread, Suit } from "@/types/tarot";

export interface ReadingCard {
  card: Card;
  reversed: boolean;
  slot: number;
}

const SUIT_THEME: Record<Suit, { name: string; theme: string }> = {
  wands: { name: "완드", theme: "열정과 행동, 새로 시작하려는 에너지" },
  cups: { name: "컵", theme: "감정과 관계, 마음의 흐름" },
  swords: { name: "소드", theme: "생각과 판단, 풀어야 할 갈등" },
  pentacles: { name: "펜타클", theme: "현실과 일, 돈과 몸 같은 구체적인 문제" },
};

type Batchim = "none" | "rieul" | "other";

// 숫자로 끝나는 이름(예: "펜타클 8")은 읽는 소리 기준: 일·칠·팔 = ㄹ, 이·사·오·구 = 없음
const DIGIT_BATCHIM: Record<string, Batchim> = {
  "0": "other", "1": "rieul", "2": "none", "3": "other", "4": "none",
  "5": "none", "6": "other", "7": "rieul", "8": "rieul", "9": "none",
};

function batchim(word: string): Batchim {
  const last = word.trim().slice(-1);
  if (last in DIGIT_BATCHIM) return DIGIT_BATCHIM[last];
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "other";
  const jong = code % 28;
  return jong === 0 ? "none" : jong === 8 ? "rieul" : "other";
}

/** 받침에 맞는 조사: 을/를, 은/는, 으로/로(ㄹ 받침은 '로') */
const josa = (word: string, withBatchim: string, without: string) => {
  const b = batchim(word);
  if (withBatchim === "으로") return b === "other" ? "으로" : "로";
  return b === "none" ? without : withBatchim;
};

const named = (c: ReadingCard) => `${c.card.nameKo}${c.reversed ? "(역방향)" : ""}`;

/**
 * 뽑힌 카드 구성으로 전체 흐름을 요약하는 기본 해석 (규칙 기반).
 * AI 종합 해석(7단계)이 붙기 전까지의 요약이자, AI가 없을 때의 대체 문구.
 */
export function summarizeReading(spread: Spread, cards: ReadingCard[]): string[] {
  if (!cards.length) return [];
  const lines: string[] = [];
  const ordered = [...cards].sort((a, b) => a.slot - b.slot);
  const total = ordered.length;

  if (total === 1) {
    const c = ordered[0];
    const kw = c.card.keywords.slice(0, 2).join("과 ");
    lines.push(`오늘 당신에게 필요한 키워드는 '${kw}'입니다.`);
    return lines;
  }

  // 흐름 문장 (쓰리 카드)
  if (spread.id === "three") {
    const [past, present, future] = ordered;
    lines.push(
      `${named(past)}에서 시작된 흐름이 지금은 ${named(present)}${josa(present.card.nameKo, "으로", "로")} 나타나고, ${named(future)}${josa(future.card.nameKo, "으로", "로")} 이어집니다.`,
    );
  }

  // 메이저 아르카나 비율
  const majors = ordered.filter((c) => c.card.arcana === "major");
  if (majors.length >= Math.ceil(total / 2)) {
    lines.push(`메이저 아르카나가 ${majors.length}장 나왔습니다. 일상적인 고민을 넘어 삶의 큰 흐름이 바뀌는 시기일 수 있어요.`);
  } else if (majors.length === 0) {
    lines.push("메이저 아르카나가 없습니다. 거대한 운명보다는 당신의 선택과 노력으로 충분히 풀어갈 수 있는 문제입니다.");
  }

  // 가장 많이 나온 수트
  const counts = new Map<Suit, number>();
  ordered.forEach((c) => c.card.suit && counts.set(c.card.suit, (counts.get(c.card.suit) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (top.length && top[0][1] >= 2 && (top.length === 1 || top[0][1] > top[1][1])) {
    const { name, theme } = SUIT_THEME[top[0][0]];
    lines.push(`${name}가 ${top[0][1]}장으로 가장 많습니다. 지금 질문의 중심에는 ${theme}가 있습니다.`);
  }

  // 역방향 비율
  const reversed = ordered.filter((c) => c.reversed).length;
  if (reversed / total >= 0.6) {
    lines.push("역방향 카드가 많습니다. 에너지가 막혀 있거나 바깥보다 마음 안쪽을 먼저 돌볼 때라는 신호예요.");
  } else if (reversed === 0) {
    lines.push("모든 카드가 정방향입니다. 흐름이 비교적 순조롭게 열려 있어요.");
  }

  // 마지막 자리 강조
  const last = ordered[total - 1];
  const lastPos = spread.positions[last.slot];
  const kw = last.card.keywords[0];
  lines.push(`'${lastPos.label}' 자리의 ${named(last)}${josa(last.card.nameKo, "은", "는")} '${kw}'${josa(kw, "을", "를")} 가리킵니다. 이 키워드를 마음에 두고 다음 걸음을 정해 보세요.`);

  return lines;
}
