"use client";

import { useState } from "react";
import { isMuted, setMuted } from "@/lib/sound";

/** 오른쪽 위 소리 켜기/끄기 (설정은 브라우저에 기억) — 입장 후에만 그려지므로 초기값을 바로 읽어도 됨 */
export default function SoundToggle() {
  const [muted, setMutedState] = useState(() => isMuted());

  return (
    <button
      onClick={() => {
        setMuted(!muted);
        setMutedState(!muted);
      }}
      aria-label={muted ? "소리 켜기" : "소리 끄기"}
      className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded-full border border-gold/25 bg-[#0d0820]/60 px-4 py-2 font-serif-ko text-xs tracking-widest text-parchment/75 backdrop-blur-md transition hover:border-gold/60 hover:text-gold"
    >
      <span className="flex h-3 items-end gap-[2px]">
        {[0.5, 1, 0.7].map((h, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full bg-current ${muted ? "" : "animate-pulse"}`}
            style={{ height: muted ? 2 : `${h * 100}%`, animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      {muted ? "소리 꺼짐" : "소리 켜짐"}
    </button>
  );
}
