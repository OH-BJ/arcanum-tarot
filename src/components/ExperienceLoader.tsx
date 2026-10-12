"use client";

import dynamic from "next/dynamic";

// three.js는 브라우저 전용 — 서버 프리렌더 제외
const Experience = dynamic(() => import("@/scene/Experience"), { ssr: false });

export default function ExperienceLoader() {
  return (
    <div className="fixed inset-0">
      <Experience />
    </div>
  );
}
