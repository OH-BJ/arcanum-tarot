import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARCANUM — 타로",
  description: "카드를 뒤집어 당신의 운명을 확인하세요",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Gowun+Batang:wght@400;700&display=swap"
        />
      </head>
      <body className="min-h-full bg-night text-parchment">{children}</body>
    </html>
  );
}
