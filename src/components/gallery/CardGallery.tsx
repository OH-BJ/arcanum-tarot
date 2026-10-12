"use client";

import { useState } from "react";
import { filterCards, GALLERY_FILTERS, SUIT_INFO, type GalleryFilter } from "@/lib/deck";
import GalleryCard from "./GalleryCard";

/** 카드 도감: 분류 탭 + 검색 + 카드 그리드 */
export default function CardGallery() {
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [query, setQuery] = useState("");
  const cards = filterCards(filter, query);
  const suit = filter !== "all" && filter !== "major" ? SUIT_INFO[filter] : null;

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-col gap-3 bg-[#05030c]/80 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-1.5 font-serif-ko text-sm transition ${
                filter === f.id
                  ? "border-gold/70 bg-gold/15 text-gold shadow-[0_0_18px_rgba(212,175,55,0.3)]"
                  : "border-white/10 text-parchment/70 hover:border-gold/40 hover:text-parchment"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름이나 키워드로 찾기 (예: 사랑, Star)"
          className="w-full rounded-full border border-gold/25 bg-[#0d0820]/70 px-5 py-2 font-serif-ko text-sm text-parchment placeholder:text-parchment/35 focus:border-gold/60 focus:outline-none sm:w-72"
        />
      </div>

      {suit && (
        <p className="mb-5 font-serif-ko text-sm text-parchment/70">
          원소 <span className="text-gold">{suit.element}</span> · {suit.theme}
        </p>
      )}

      {cards.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {cards.map((card, i) => (
            <GalleryCard key={card.id} card={card} priority={i < 6} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center font-serif-ko text-parchment/60">찾는 카드가 없어요. 다른 단어로 검색해 보세요.</p>
      )}
    </>
  );
}
