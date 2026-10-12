import { create } from "zustand";
import type { ScenePhase, Spread } from "@/types/tarot";
import { CARDS } from "@/lib/deck";
import { secureRandom, shuffle } from "@/lib/random";
import { getSpread } from "@/lib/spreads";
import { sfx } from "@/lib/sound";

/** 셔플 연출 길이(초) — 씬(Deck)도 같은 값으로 애니메이션 구간을 나눈다 */
export const SHUFFLE_SECONDS = 3.4;
/** 질문 글자가 수정구슬로 빨려 들어가는 연출 길이(초) */
export const QUESTION_SECONDS = 2.4;
export const GATHER_SECONDS = 1.4;

export type DrawnState = "flying" | "placed" | "revealing" | "revealed" | "returning";

export interface Drawn {
  cardIndex: number; // CARDS 인덱스
  reversed: boolean;
  slot: number; // 스프레드 자리 (0부터)
  deckPos: number; // 아치에서 몇 번째 카드였는지
  state: DrawnState;
}

export interface Burst {
  tick: number;
  pos: [number, number, number];
  reversed: boolean;
  big: boolean; // 메이저 아르카나 — 더 크고 화려하게
}

/** 메이저 아르카나가 공개되는 순간 (화면 암전·충격파·이름 연출의 신호) */
export interface MajorMoment {
  tick: number;
  slot: number;
  at: number; // performance.now() 초
}

interface ReadingState {
  phase: ScenePhase;
  /** 현재 단계가 시작된 시각 (performance.now() 초) — 씬 애니메이션의 기준 */
  phaseStartedAt: number;
  spreadId: Spread["id"];
  /** 셔플된 덱: 아치 위치 → CARDS 인덱스 */
  deckOrder: number[];
  drawn: Drawn[];
  /** 해석 패널에 보여줄 자리 */
  activeSlot: number | null;
  /** 카메라 앞으로 크게 띄워 보는 카드 자리 */
  focusSlot: number | null;
  /** "모두 뒤집기" 진행 중 — 이때는 자동 확대·메이저 연출을 생략 */
  revealingAll: boolean;
  burst: Burst;
  majorMoment: MajorMoment;
  /** 3D 씬이 처음 그려진 시각(캔버스 clock 기준). null이면 아직 로딩 중 */
  readyAt: number | null;
  /** 입장 버튼을 누른 시각 (performance.now() 초) — 인트로 연출의 기준. null이면 입장 전 */
  introStartedAt: number | null;
  /** 사용자가 마음속에 품은 질문 (비워도 됨) */
  question: string;

  setReadyAt: (t: number) => void;
  enter: () => void;
  setQuestion: (q: string) => void;
  beginShuffle: () => void;
  setPhase: (phase: ScenePhase) => void;
  startReading: (spreadId: Spread["id"]) => void;
  pickCard: (deckPos: number) => void;
  markPlaced: (slot: number) => void;
  requestReveal: (slot: number) => void;
  revealAll: () => void;
  markRevealed: (slot: number) => void;
  setActiveSlot: (slot: number | null) => void;
  setFocus: (slot: number | null) => void;
  triggerMajor: (slot: number) => void;
  fireBurst: (pos: [number, number, number], reversed: boolean, big?: boolean) => void;
  newReading: () => void;
}

const now = () => performance.now() / 1000;
const timers = new Set<ReturnType<typeof setTimeout>>();
const later = (ms: number, fn: () => void) => {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
};

export const useReading = create<ReadingState>((set, get) => ({
  phase: "intro",
  phaseStartedAt: 0,
  spreadId: "three",
  deckOrder: CARDS.map((_, i) => i),
  drawn: [],
  activeSlot: null,
  focusSlot: null,
  revealingAll: false,
  burst: { tick: 0, pos: [0, 0, 0], reversed: false, big: false },
  majorMoment: { tick: 0, slot: -1, at: 0 },
  readyAt: null,
  introStartedAt: null,
  question: "",

  enter: () => {
    if (get().readyAt === null || get().introStartedAt !== null) return;
    set({ introStartedAt: now() });
  },
  setQuestion: (question) => set({ question }),

  setReadyAt: (t) => set({ readyAt: t }),
  setPhase: (phase) => set({ phase, phaseStartedAt: now() }),

  startReading: (spreadId) => {
    if (get().phase !== "select") return;
    set({
      spreadId,
      drawn: [],
      activeSlot: null,
      focusSlot: null,
      revealingAll: false,
      majorMoment: { ...get().majorMoment, slot: -1 },
    });
    // 질문이 있으면 먼저 수정구슬에 질문을 담는 연출
    if (get().question.trim()) {
      set({ phase: "question", phaseStartedAt: now() });
      sfx.absorb(QUESTION_SECONDS);
      later(QUESTION_SECONDS * 1000, () => get().beginShuffle());
    } else {
      get().beginShuffle();
    }
  },

  beginShuffle: () => {
    set({ deckOrder: shuffle(CARDS.map((_, i) => i)), phase: "shuffling", phaseStartedAt: now() });
    sfx.shuffle(SHUFFLE_SECONDS);
    later(SHUFFLE_SECONDS * 1000, () => get().setPhase("picking"));
  },

  pickCard: (deckPos) => {
    const s = get();
    if (s.phase !== "picking") return;
    const total = getSpread(s.spreadId).positions.length;
    if (s.drawn.length >= total || s.drawn.some((d) => d.deckPos === deckPos)) return;
    const drawn: Drawn = {
      cardIndex: s.deckOrder[deckPos],
      reversed: secureRandom() < 0.5,
      slot: s.drawn.length,
      deckPos,
      state: "flying",
    };
    set({ drawn: [...s.drawn, drawn] });
    sfx.pick();
  },

  markPlaced: (slot) => {
    const s = get();
    const drawn = s.drawn.map((d) => (d.slot === slot && d.state === "flying" ? { ...d, state: "placed" as const } : d));
    const total = getSpread(s.spreadId).positions.length;
    const allPlaced = drawn.length === total && drawn.every((d) => d.state !== "flying");
    set({ drawn });
    sfx.place();
    if (allPlaced && s.phase === "picking") later(350, () => get().setPhase("reading"));
  },

  requestReveal: (slot) => {
    const s = get();
    if (s.phase !== "reading") return;
    const target = s.drawn.find((d) => d.slot === slot);
    if (!target) return;
    if (target.state === "placed") {
      set({
        drawn: s.drawn.map((d) => (d.slot === slot ? { ...d, state: "revealing" as const } : d)),
        activeSlot: slot,
        focusSlot: null,
      });
    } else if (target.state === "revealed") {
      // 공개된 카드를 누르면 크게 보기 ↔ 내려놓기
      set({ activeSlot: slot, focusSlot: s.focusSlot === slot ? null : slot });
    }
  },

  revealAll: () => {
    const pending = get().drawn.filter((d) => d.state === "placed");
    if (!pending.length) return;
    set({ revealingAll: true, focusSlot: null });
    pending.forEach((d, i) => later(i * 450, () => get().requestReveal(d.slot)));
  },

  markRevealed: (slot) => {
    const s = get();
    const drawn = s.drawn.map((d) => (d.slot === slot ? { ...d, state: "revealed" as const } : d));
    const busy = drawn.some((d) => d.state === "placed" || d.state === "revealing");
    set({
      drawn,
      // 한 장씩 뒤집었을 때는 공개가 끝나면 그 카드를 카메라 앞으로 띄움
      focusSlot: !s.revealingAll && s.activeSlot === slot ? slot : s.focusSlot,
      revealingAll: s.revealingAll && busy,
    });
  },

  setActiveSlot: (slot) =>
    set((s) => ({ activeSlot: slot, focusSlot: s.focusSlot !== null && slot !== null ? slot : s.focusSlot })),

  setFocus: (slot) => set((s) => ({ focusSlot: slot, activeSlot: slot ?? s.activeSlot })),

  triggerMajor: (slot) => set((s) => ({ majorMoment: { tick: s.majorMoment.tick + 1, slot, at: now() } })),

  fireBurst: (pos, reversed, big = false) => set((s) => ({ burst: { tick: s.burst.tick + 1, pos, reversed, big } })),

  newReading: () => {
    const s = get();
    if (s.phase !== "reading") return;
    timers.forEach(clearTimeout);
    timers.clear();
    set({
      phase: "gathering",
      phaseStartedAt: now(),
      activeSlot: null,
      focusSlot: null,
      revealingAll: false,
      drawn: s.drawn.map((d) => ({ ...d, state: "returning" as const })),
    });
    sfx.gather();
    later(GATHER_SECONDS * 1000, () => set({ phase: "select", phaseStartedAt: now(), drawn: [] }));
  },
}));

// 개발 중 콘솔 디버깅용
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { __reading: typeof useReading }).__reading = useReading;
}
