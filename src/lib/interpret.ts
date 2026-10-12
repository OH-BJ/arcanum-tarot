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

const RANK_THEME: Record<string, string> = {
  two: "균형과 선택",
  three: "성장과 협력",
  four: "안정과 멈춤",
  five: "갈등과 변화",
  six: "조화와 회복",
  seven: "시험과 성찰",
  eight: "움직임과 노력",
  nine: "완성 직전의 고비",
  ten: "한 주기의 마무리",
};

const ELEMENT: Record<Suit, { name: string; lack: string }> = {
  wands: { name: "불(완드)", lack: "밀고 나갈 열정이나 행동력이 조금 부족할 수 있어요" },
  cups: { name: "물(컵)", lack: "마음과 감정을 돌보는 일이 뒤로 밀려 있을 수 있어요" },
  swords: { name: "공기(소드)", lack: "차분히 따져 보고 말로 정리하는 과정이 필요할 수 있어요" },
  pentacles: { name: "흙(펜타클)", lack: "현실적인 계획이나 구체적인 준비가 아직 부족할 수 있어요" },
};

/** 함께 나오면 의미가 깊어지는 카드 조합 (순서 무관) */
const COMBOS: { ids: [string, string]; text: string }[] = [
  { ids: ["major-16", "major-17"], text: "탑과 별이 함께 나왔어요. 무너진 자리에 오히려 더 맑은 희망이 들어설 거예요." },
  { ids: ["major-13", "major-19"], text: "죽음과 태양이 함께 나왔어요. 한 시기를 끝낸 뒤 환하게 밝아지는 흐름이에요." },
  { ids: ["major-13", "major-20"], text: "죽음과 심판이 함께 나왔어요. 낡은 것을 보내고 새로 깨어나는 전환점이에요." },
  { ids: ["major-00", "major-21"], text: "바보와 세계가 함께 나왔어요. 한 여정이 완성되고 새로운 출발이 시작되는 순환이에요." },
  { ids: ["major-06", "cups-two"], text: "연인과 컵 2가 함께 나왔어요. 서로를 강하게 끌어당기는 인연의 기운이 있어요." },
  { ids: ["major-15", "major-08"], text: "악마와 힘이 함께 나왔어요. 나를 붙잡는 것을 억지가 아닌 다정한 인내로 다스릴 수 있어요." },
  { ids: ["major-18", "major-02"], text: "달과 여사제가 함께 나왔어요. 지금은 눈에 보이는 것보다 직감과 꿈을 믿을 때예요." },
  { ids: ["major-10", "major-01"], text: "운명의 수레바퀴와 마법사가 함께 나왔어요. 찾아온 기회를 당신의 능력으로 붙잡을 수 있어요." },
  { ids: ["swords-three", "major-14"], text: "소드 3과 절제가 함께 나왔어요. 아픈 마음이 천천히 균형을 되찾아 가는 중이에요." },
  { ids: ["major-03", "major-04"], text: "여황제와 황제가 함께 나왔어요. 따뜻한 돌봄과 단단한 질서가 함께 필요한 때예요." },
];

/** 질문에서 주제를 짐작 (연애·일·돈·관계·나 자신) */
const TOPICS: { words: string[]; name: string; suits: Suit[]; focus: string }[] = [
  { words: ["사랑", "연애", "썸", "남자친구", "여자친구", "남친", "여친", "결혼", "재회", "고백", "그 사람", "그사람", "짝사랑", "이별"], name: "연애", suits: ["cups"], focus: "감정과 관계를 뜻하는 컵" },
  { words: ["일", "직장", "회사", "취업", "이직", "사업", "시험", "합격", "공부", "면접", "프로젝트", "커리어"], name: "일과 진로", suits: ["wands", "pentacles"], focus: "행동의 완드와 현실의 펜타클" },
  { words: ["돈", "재물", "금전", "월급", "투자", "빚", "수입", "부자"], name: "돈", suits: ["pentacles"], focus: "물질과 현실을 뜻하는 펜타클" },
  { words: ["친구", "가족", "부모", "엄마", "아빠", "동료", "관계", "사람들"], name: "관계", suits: ["cups", "swords"], focus: "마음의 컵과 대화의 소드" },
  { words: ["나 ", "나는", "자신", "마음", "고민", "불안", "행복", "앞으로"], name: "나 자신", suits: [], focus: "" },
];

function detectTopic(question: string) {
  const q = ` ${question} `;
  return TOPICS.find((t) => t.words.some((w) => q.includes(w)));
}

/** 카드 하나를 그 자리의 의미와 엮은 문장 (해석 패널용) */
export function positionLine(position: { label: string; meaning: string }, card: Card, reversed: boolean): string {
  const [k1, k2] = card.keywords;
  const name = `${card.nameKo}${reversed ? "(역방향)" : ""}`;
  return `'${position.label}' 자리 — ${position.meaning}. 이 자리의 ${name}${josa(card.nameKo, "은", "는")} '${k1}'${josa(k1, "과", "와")} '${k2}'의 기운을 비춥니다.`;
}

/**
 * 뽑힌 카드 구성으로 전체 흐름을 요약하는 기본 해석 (규칙 기반, 무료·즉시).
 * AI 해석을 못 쓸 때의 대체 문구이기도 하다.
 */
export function summarizeReading(spread: Spread, cards: ReadingCard[], question = ""): string[] {
  if (!cards.length) return [];
  const lines: string[] = [];
  const ordered = [...cards].sort((a, b) => a.slot - b.slot);
  const total = ordered.length;
  const topic = detectTopic(question);

  if (total === 1) {
    const c = ordered[0];
    const [k1, k2] = c.card.keywords;
    lines.push(`오늘 당신에게 필요한 키워드는 '${k1}'${josa(k1, "과", "와")} '${k2}'입니다.`);
    if (topic && topic.name !== "나 자신") lines.push(`${topic.name}에 관한 질문이라면, 이 카드의 메시지를 그 상황에 비춰 천천히 곱씹어 보세요.`);
    return lines;
  }

  // 흐름 문장 (쓰리 카드)
  if (spread.id === "three") {
    const [past, present, future] = ordered;
    lines.push(
      `${named(past)}에서 시작된 흐름이 지금은 ${named(present)}${josa(present.card.nameKo, "으로", "로")} 나타나고, ${named(future)}${josa(future.card.nameKo, "으로", "로")} 이어집니다.`,
    );
  }

  // 질문 주제와 관련된 카드 짚기
  if (topic && topic.suits.length) {
    const related = ordered.filter((c) => c.card.suit && topic.suits.includes(c.card.suit));
    lines.push(
      related.length
        ? `${topic.name}에 관한 질문에 ${topic.focus} 카드가 ${related.length}장(${related.map((c) => c.card.nameKo).join(", ")}) 나왔어요. ${related.length > 1 ? "이 카드들이" : "이 카드가"} 질문에 가장 직접적으로 답하고 있어요.`
        : `${topic.name}에 관한 질문이지만 ${topic.focus} 카드는 나오지 않았어요. 문제의 뿌리가 겉보다 다른 곳에 있을 수 있어요.`,
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

  // 원소 균형 (5장 이상일 때만 의미 있음)
  if (total >= 5) {
    const missing = (Object.keys(ELEMENT) as Suit[]).filter((s) => !counts.has(s));
    if (missing.length === 1) lines.push(`${ELEMENT[missing[0]].name}의 카드가 하나도 없어요. ${ELEMENT[missing[0]].lack}.`);
    else if (missing.length >= 2) lines.push(`${missing.map((m) => ELEMENT[m].name).join("·")}의 기운이 비어 있어요. 한쪽으로 치우친 흐름을 의식해 보세요.`);
  }

  // 숫자 반복 · 궁정 카드 · 에이스
  const ranks = new Map<string, number>();
  ordered.forEach((c) => c.card.rank && ranks.set(c.card.rank, (ranks.get(c.card.rank) ?? 0) + 1));
  const repeated = [...ranks.entries()].filter(([rank, n]) => n >= 2 && RANK_THEME[rank]).map(([rank]) => RANK_THEME[rank]);
  if (repeated.length) {
    const last = repeated[repeated.length - 1];
    lines.push(
      `같은 숫자 카드가 겹쳐 나왔어요. '${repeated.join("', '")}'${josa(last, "이라는", "라는")} 주제가 반복해서 당신에게 말을 걸고 있어요.`,
    );
  }
  const courts = ordered.filter((c) => ["page", "knight", "queen", "king"].includes(c.card.rank ?? ""));
  if (courts.length >= 2) lines.push(`궁정 카드(인물 카드)가 ${courts.length}장 나왔어요. 이 일에는 주변 사람들의 영향이 크거나, 당신이 여러 역할을 오가고 있을 수 있어요.`);
  const aces = ranks.get("ace") ?? 0;
  if (aces >= 2) lines.push(`에이스가 ${aces}장이나 나왔어요. 여러 방면에서 새로운 시작의 씨앗이 움트고 있어요.`);

  // 의미 깊은 조합
  const ids = new Set(ordered.map((c) => c.card.id));
  COMBOS.filter((c) => c.ids.every((id) => ids.has(id)))
    .slice(0, 2)
    .forEach((c) => lines.push(c.text));

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
