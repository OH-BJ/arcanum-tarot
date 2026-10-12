export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";
export type Rank =
  | "ace" | "two" | "three" | "four" | "five" | "six" | "seven"
  | "eight" | "nine" | "ten" | "page" | "knight" | "queen" | "king";

export interface Card {
  id: string; // "major-00", "cups-queen"
  number: number; // 메이저 0~21, 마이너 1~14
  roman?: string; // 메이저 아르카나만
  nameEn: string;
  nameKo: string;
  arcana: Arcana;
  suit?: Suit; // 마이너 아르카나만
  rank?: Rank; // 마이너 아르카나만
  keywords: string[];
  upright: string;
  reversed: string;
  image: string;
}

/**
 * 스프레드 안 카드 자리. x, y는 "카드 칸" 단위
 * (x 1 = 카드 폭 + 간격, y 1 = 카드 높이 + 간격) — 3D 좌표 변환은 lib/spreads.ts
 */
export interface SpreadPosition {
  index: number;
  label: string;
  meaning: string;
  x: number;
  y: number;
  rotate?: number; // 도(degree), 켈틱 크로스 2번 카드 등
}

export interface Spread {
  id: "one" | "three" | "love" | "celtic-cross";
  name: string;
  description: string;
  positions: SpreadPosition[];
}

export interface DrawnCard {
  card: Card;
  reversed: boolean;
  position: number;
  revealed: boolean;
}

/**
 * 리딩 흐름: 인트로 → 스프레드 선택(+질문) → 질문 흡수 → 셔플 → 카드 고르기 → 뒤집어 읽기 → (새 리딩) 카드 회수 → 선택
 */
export type ScenePhase = "intro" | "select" | "question" | "shuffling" | "picking" | "reading" | "gathering";
