"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { cardLabel } from "@/lib/deck";
import type { Card } from "@/types/tarot";

/** 마우스를 따라 3D로 기울며 홀로그램이 번지는 도감 카드 */
export default function GalleryCard({ card, priority }: { card: Card; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <Link
      ref={ref}
      href={`/cards/${card.id}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="holo-card group relative block rounded-xl border border-gold/20 bg-[#0d0820] p-1.5"
    >
      <div className="relative aspect-[3/5] overflow-hidden rounded-lg">
        <Image
          src={card.image}
          alt={`${card.nameKo} (${card.nameEn})`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 170px"
          className="object-cover"
          priority={priority}
        />
        <div className="holo-shine pointer-events-none absolute inset-0" />
      </div>
      <div className="px-1 pb-1 pt-2 text-center">
        <p className="font-display text-[10px] tracking-[0.3em] text-gold/70">{cardLabel(card)}</p>
        <p className="font-serif-ko text-sm text-parchment/90 group-hover:text-gold">{card.nameKo}</p>
      </div>
    </Link>
  );
}
