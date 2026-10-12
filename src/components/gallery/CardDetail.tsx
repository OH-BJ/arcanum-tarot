"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { CARDS, cardLabel, SUIT_INFO } from "@/lib/deck";
import type { Card } from "@/types/tarot";
import type { ViewerControl } from "@/scene/viewer/CardViewer";

const CardViewer = dynamic(() => import("@/scene/viewer/CardViewer"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-white/[0.02]" />,
});

/** 도감 상세: 3D 카드(드래그·뒤집기·역방향) + 정/역방향 해석 + 이전/다음 */
export default function CardDetail({ card }: { card: Card }) {
  const control = useRef<ViewerControl>({ dragX: 0, dragY: 0, dragging: false, flipped: false, reversed: false });
  const drag = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);
  const [reversed, setReversed] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const idx = CARDS.findIndex((c) => c.id === card.id);
  const prev = CARDS[(idx - 1 + CARDS.length) % CARDS.length];
  const next = CARDS[(idx + 1) % CARDS.length];
  const suit = card.suit ? SUIT_INFO[card.suit] : null;

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, baseX: control.current.dragX, baseY: control.current.dragY };
    control.current.dragging = true;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    control.current.dragX = drag.current.baseX + (e.clientX - drag.current.x) * 0.01;
    control.current.dragY = drag.current.baseY + (e.clientY - drag.current.y) * 0.006;
  };
  const onUp = () => {
    drag.current = null;
    control.current.dragging = false;
    control.current.dragY = 0; // 위아래 기울기는 놓으면 돌아옴
  };

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div
          className="relative h-[52vh] min-h-[340px] cursor-grab touch-none select-none active:cursor-grabbing lg:h-[72vh]"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <CardViewer key={card.id} image={card.image} control={control} />
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => {
              control.current.flipped = !flipped;
              setFlipped(!flipped);
            }}
            className="rounded-full border border-white/15 px-4 py-2 font-serif-ko text-sm text-parchment/80 transition hover:border-gold/50 hover:text-gold"
          >
            {flipped ? "앞면 보기" : "뒷면 보기"}
          </button>
          <button
            onClick={() => {
              control.current.reversed = !reversed;
              setReversed(!reversed);
            }}
            className={`rounded-full border px-4 py-2 font-serif-ko text-sm transition ${
              reversed ? "border-rose-400/60 text-rose-300" : "border-white/15 text-parchment/80 hover:border-gold/50 hover:text-gold"
            }`}
          >
            {reversed ? "정방향으로" : "역방향으로 보기"}
          </button>
        </div>
        <p className="mt-2 text-center font-serif-ko text-xs text-parchment/40">드래그해서 카드를 돌려 보세요</p>
      </div>

      <article className="rounded-3xl border border-gold/20 bg-[#0d0820]/70 p-6 backdrop-blur-md sm:p-8">
        <p className="font-display text-xs tracking-[0.5em] text-gold/80">{cardLabel(card)}</p>
        <h1 className="gold-text mt-1 font-display text-4xl font-semibold leading-tight tracking-wide">{card.nameEn}</h1>
        <p className="mt-1 font-serif-ko text-2xl text-parchment">{card.nameKo}</p>
        <p className="mt-3 font-serif-ko text-sm text-parchment/60">
          {card.arcana === "major" ? "메이저 아르카나 · 삶의 큰 흐름과 전환" : `마이너 아르카나 · ${suit?.nameKo} (원소: ${suit?.element}) · ${suit?.theme}`}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {card.keywords.map((k) => (
            <li key={k} className="rounded-md bg-white/5 px-2.5 py-1 font-serif-ko text-sm text-parchment/85">
              {k}
            </li>
          ))}
        </ul>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <section className={`rounded-xl p-4 transition ${!reversed ? "bg-gold/[0.07] ring-1 ring-gold/30" : ""}`}>
          <h2 className="font-serif-ko text-sm font-bold tracking-widest text-gold">정방향</h2>
          <p className="mt-2 font-serif-ko text-[15px] leading-7 text-parchment/90">{card.upright}</p>
        </section>
        <section className={`mt-3 rounded-xl p-4 transition ${reversed ? "bg-rose-500/[0.07] ring-1 ring-rose-400/30" : ""}`}>
          <h2 className="font-serif-ko text-sm font-bold tracking-widest text-rose-300">역방향</h2>
          <p className="mt-2 font-serif-ko text-[15px] leading-7 text-parchment/90">{card.reversed}</p>
        </section>

        <nav className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href={`/cards/${prev.id}`}
            className="rounded-xl border border-white/10 px-4 py-3 font-serif-ko text-sm text-parchment/75 transition hover:border-gold/40 hover:text-gold"
          >
            ← {prev.nameKo}
          </Link>
          <Link
            href={`/cards/${next.id}`}
            className="rounded-xl border border-white/10 px-4 py-3 text-right font-serif-ko text-sm text-parchment/75 transition hover:border-gold/40 hover:text-gold"
          >
            {next.nameKo} →
          </Link>
        </nav>
      </article>
    </div>
  );
}
