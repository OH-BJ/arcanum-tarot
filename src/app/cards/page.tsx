import type { Metadata } from "next";
import Link from "next/link";
import CardGallery from "@/components/gallery/CardGallery";

export const metadata: Metadata = {
  title: "카드 도감 — ARCANUM",
  description: "라이더–웨이트 타로 78장의 의미를 한눈에",
};

export default function CardsPage() {
  return (
    <main className="starfield-bg min-h-dvh">
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="font-serif-ko text-sm tracking-widest text-parchment/70 transition hover:text-gold">
            ← 리딩으로
          </Link>
          <p className="font-display text-xs tracking-[0.5em] text-gold/70">ARCANUM</p>
        </header>
        <div className="mb-8 text-center">
          <h1 className="gold-text font-display text-4xl font-semibold tracking-[0.2em] sm:text-5xl">THE DECK</h1>
          <p className="mt-2 font-serif-ko text-parchment/75">카드 도감 · 78장</p>
        </div>
        <CardGallery />
      </div>
    </main>
  );
}
