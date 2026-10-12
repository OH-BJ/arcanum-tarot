/**
 * data/parts/{major,wands,cups,swords,pentacles}.json 을 합쳐 data/cards.ko.json 을 만들고 검증한다.
 * 실행: node scripts/build-cards.mts
 */
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const PARTS = ["major", "wands", "cups", "swords", "pentacles"] as const;
const RANKS = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"];
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const SUIT_KO = { wands: "완드", cups: "컵", swords: "소드", pentacles: "펜타클" } as const;

type Card = {
  id: string;
  number: number;
  roman?: string;
  nameEn: string;
  nameKo: string;
  arcana: "major" | "minor";
  suit?: keyof typeof SUIT_KO;
  rank?: string;
  keywords: string[];
  upright: string;
  reversed: string;
  image: string;
};

const errors: string[] = [];
const warnings: string[] = [];
const err = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

const cards: Card[] = [];
for (const part of PARTS) {
  const list = JSON.parse(await readFile(path.join(ROOT, "data", "parts", `${part}.json`), "utf8")) as Card[];
  const expected = part === "major" ? 22 : 14;
  if (list.length !== expected) errors.push(`${part}.json: ${list.length}장 (기대 ${expected}장)`);
  cards.push(...list);
}

const pad = (n: number) => String(n).padStart(2, "0");
const seen = new Set<string>();

for (const c of cards) {
  if (seen.has(c.id)) err(c.id, "중복 id");
  seen.add(c.id);

  for (const key of ["id", "nameEn", "nameKo", "upright", "reversed", "image"] as const) {
    if (typeof c[key] !== "string" || !c[key].trim()) err(c.id, `${key} 비어 있음`);
  }

  if (c.arcana === "major") {
    if (c.id !== `major-${pad(c.number)}`) err(c.id, "id/number 불일치");
    if (c.roman !== ROMAN[c.number]) err(c.id, `roman 불일치 (${c.roman})`);
    if (c.image !== `/cards/major/${pad(c.number)}.webp`) err(c.id, "image 경로 불일치");
  } else {
    const rank = RANKS[c.number - 1];
    if (!c.suit || !(c.suit in SUIT_KO)) err(c.id, "suit 없음");
    if (c.rank !== rank) err(c.id, `rank 불일치 (${c.rank} ≠ ${rank})`);
    if (c.id !== `${c.suit}-${rank}`) err(c.id, "id 형식 불일치");
    if (c.image !== `/cards/${c.suit}/${pad(c.number)}.webp`) err(c.id, "image 경로 불일치");
    if (c.suit && !c.nameKo.startsWith(SUIT_KO[c.suit])) err(c.id, `nameKo가 '${SUIT_KO[c.suit]}'로 시작하지 않음`);
  }

  if (!Array.isArray(c.keywords) || c.keywords.length !== 4) err(c.id, "keywords는 4개여야 함");
  else if (new Set(c.keywords).size !== 4) err(c.id, "keywords 중복");

  if (c.upright.length < 40 || c.upright.length > 140) warnings.push(`${c.id}: upright 길이 ${c.upright.length}자`);
  if (c.reversed.length < 30 || c.reversed.length > 120) warnings.push(`${c.id}: reversed 길이 ${c.reversed.length}자`);

  try {
    await access(path.join(ROOT, "public", c.image));
  } catch {
    err(c.id, `이미지 파일 없음 ${c.image}`);
  }
}

if (cards.length !== 78) errors.push(`전체 ${cards.length}장 (기대 78장)`);

warnings.forEach((w) => console.warn("경고 ", w));
if (errors.length) {
  errors.forEach((e) => console.error("오류 ", e));
  console.error(`\n검증 실패: 오류 ${errors.length}건`);
  process.exit(1);
}

// 키 순서 고정해서 저장
const ordered = cards.map((c) => ({
  id: c.id,
  number: c.number,
  ...(c.roman !== undefined && { roman: c.roman }),
  nameEn: c.nameEn,
  nameKo: c.nameKo,
  arcana: c.arcana,
  ...(c.suit && { suit: c.suit, rank: c.rank }),
  keywords: c.keywords,
  upright: c.upright,
  reversed: c.reversed,
  image: c.image,
}));
await writeFile(path.join(ROOT, "data", "cards.ko.json"), JSON.stringify(ordered, null, 2) + "\n", "utf8");
console.log(`data/cards.ko.json 생성: ${ordered.length}장 (경고 ${warnings.length}건)`);
