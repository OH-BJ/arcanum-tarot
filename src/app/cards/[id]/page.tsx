import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CARDS, getCardById } from "@/lib/deck";
import CardDetail from "@/components/gallery/CardDetail";

// 78장 모두 빌드 시 미리 생성
export function generateStaticParams() {
  return CARDS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/cards/[id]">): Promise<Metadata> {
  const { id } = await params;
  const card = getCardById(id);
  if (!card) return { title: "카드를 찾을 수 없어요 — ARCANUM" };
  return {
    title: `${card.nameKo} (${card.nameEn}) — ARCANUM`,
    description: `${card.keywords.join(" · ")} — ${card.upright}`,
  };
}

/** URL의 id를 읽는 부분 — Suspense 안에 둬서 머리말(정적 껍데기)은 즉시 보이게 함 */
async function CardContent({ params }: { params: PageProps<"/cards/[id]">["params"] }) {
  const { id } = await params;
  const card = getCardById(id);
  if (!card) notFound();
  return <CardDetail card={card} />;
}

export default function CardPage({ params }: PageProps<"/cards/[id]">) {
  return (
    <main className="starfield-bg min-h-dvh">
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <header className="flex items-center justify-between py-6">
          <Link href="/cards" className="font-serif-ko text-sm tracking-widest text-parchment/70 transition hover:text-gold">
            ← 도감
          </Link>
          <Link href="/" className="font-serif-ko text-sm tracking-widest text-parchment/70 transition hover:text-gold">
            리딩 하러 가기 ✦
          </Link>
        </header>
        <Suspense fallback={<div className="h-[72vh] animate-pulse rounded-3xl bg-white/[0.02]" />}>
          <CardContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}
