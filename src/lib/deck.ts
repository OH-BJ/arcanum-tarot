import cardsData from "../../data/cards.ko.json";
import type { Card, Suit } from "@/types/tarot";

export const CARDS = cardsData as Card[];

export function getCardById(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

/** "XVII" 또는 "CUPS · QUEEN" 같은 카드 표기 */
export function cardLabel(card: Card): string {
  return card.arcana === "major" ? (card.roman ?? String(card.number)) : `${card.suit} · ${card.rank}`.toUpperCase();
}

export const SUIT_INFO: Record<Suit, { nameKo: string; element: string; theme: string }> = {
  wands: { nameKo: "완드", element: "불", theme: "열정 · 행동 · 창조" },
  cups: { nameKo: "컵", element: "물", theme: "감정 · 관계 · 직관" },
  swords: { nameKo: "소드", element: "공기", theme: "생각 · 진실 · 갈등" },
  pentacles: { nameKo: "펜타클", element: "흙", theme: "현실 · 일 · 풍요" },
};

export type GalleryFilter = "all" | "major" | Suit;

export const GALLERY_FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "major", label: "메이저" },
  { id: "wands", label: "완드" },
  { id: "cups", label: "컵" },
  { id: "swords", label: "소드" },
  { id: "pentacles", label: "펜타클" },
];

/** 도감 필터 + 검색 (한글·영문 이름, 키워드) */
export function filterCards(filter: GalleryFilter, query: string): Card[] {
  const q = query.trim().toLowerCase();
  return CARDS.filter((c) => {
    if (filter === "major" && c.arcana !== "major") return false;
    if (filter !== "all" && filter !== "major" && c.suit !== filter) return false;
    if (!q) return true;
    return (
      c.nameKo.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}
