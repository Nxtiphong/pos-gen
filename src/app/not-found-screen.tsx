"use client";

import Link from "next/link";
import { useState } from "react";

const ROASTS = [
  "เดา path เก่งจัง แต่หน้านี้ไม่มีนะจ๊ะ",
  "ที่นี่ชงมัทฉะ ไม่ได้ชง URL",
  "กดอีกทีก็ไม่เจอหรอก ลองดูสิ",
  "แอดมินเห็นนะ ว่าแอบพิมพ์ URL เอง",
  "หาอะไรอยู่จ๊ะ บอกพี่ได้นะ",
  "ระดับความซน: มัทฉะเข้มข้น 100%",
  "path นี้หมดสต็อกตั้งแต่ยังไม่เปิดร้าน",
  "ปั่นไปก็ไม่เจอ ไปสั่งมัทฉะดีกว่า",
];

export function NotFoundScreen() {
  const [taps, setTaps] = useState(0);
  const roast = ROASTS[taps % ROASTS.length];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ground px-6 py-10 text-center text-ink">
      <button
        type="button"
        onClick={() => setTaps((n) => n + 1)}
        aria-label="แตะน้องมัทฉะ"
        className="cursor-pointer rounded-full p-2 outline-offset-4"
      >
        <svg
          key={taps}
          role="img"
          aria-label="น้องมัทฉะส่ายนิ้ว"
          viewBox="0 0 200 220"
          className="size-[200px] animate-[nf-spin_0.9s_cubic-bezier(.4,1.6,.6,1)] motion-reduce:animate-none max-md:size-[168px]"
        >
          <ellipse cx="100" cy="206" rx="58" ry="8" fill="#13261c" opacity="0.08" />
          <path d="M42 62h116l-14 132a12 12 0 0 1-12 11H68a12 12 0 0 1-12-11L42 62z" fill="#fff" stroke="#13261c" strokeWidth="5" strokeLinejoin="round" />
          <path d="M49 92h102l-9 98a8 8 0 0 1-8 7H66a8 8 0 0 1-8-7l-9-98z" fill="#5fa86f" />
          <path d="M60 160h80l-3 30a8 8 0 0 1-8 7H71a8 8 0 0 1-8-7l-3-30z" fill="#2b4cb0" />
          <path d="M60 160c12 6 22-6 34 0s22 6 34 0 10-4 12-2" fill="none" stroke="#e7edfb" strokeWidth="4" strokeLinecap="round" />
          <rect x="34" y="48" width="132" height="18" rx="9" fill="#2e7a4b" stroke="#13261c" strokeWidth="5" />
          <path d="M120 48 136 10" stroke="#13261c" strokeWidth="6" strokeLinecap="round" />
          <path d="M78 118q8-7 16 0" fill="none" stroke="#13261c" strokeWidth="5" strokeLinecap="round" />
          <path d="M108 118q8-7 16 0" fill="none" stroke="#13261c" strokeWidth="5" strokeLinecap="round" />
          <path d="M90 140q11 7 22 -2" fill="none" stroke="#13261c" strokeWidth="5" strokeLinecap="round" />
          <circle cx="76" cy="132" r="5" fill="#f2a7a0" />
          <circle cx="128" cy="132" r="5" fill="#f2a7a0" />
          <g className="origin-[172px_118px] animate-[nf-wag_0.5s_ease-in-out_infinite_alternate] motion-reduce:animate-none">
            <path d="M152 128c10 0 18-6 20-14" fill="none" stroke="#13261c" strokeWidth="5" strokeLinecap="round" />
            <rect x="166" y="80" width="12" height="38" rx="6" fill="#fff" stroke="#13261c" strokeWidth="5" />
          </g>
        </svg>
      </button>

      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-blue-soft px-3 py-1 text-[14px] font-bold text-blue-ink">404 · ไม่พบหน้านี้</span>
        <h1 className="text-[64px] leading-[1.1] font-bold tracking-tight max-md:text-[48px]">อย่าซน!</h1>
        <p aria-live="polite" className="min-h-[1.6em] max-w-[420px] text-[20px] leading-[1.6] text-ink-2 max-md:text-[17px]">
          {roast}
        </p>
        {taps >= 3 && <p className="text-[14px] text-ink-2">แตะไป {taps} ครั้งแล้วนะ ยังไม่เลิกอีก</p>}
      </div>

      <Link href="/" className="flex h-14 items-center rounded-[16px] bg-accent px-8 text-[18px] font-bold text-white">
        กลับหน้าหลัก
      </Link>
    </main>
  );
}
