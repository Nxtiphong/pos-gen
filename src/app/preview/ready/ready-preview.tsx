"use client";

import { useEffect, useRef, useState } from "react";
import { ReadyScreen } from "@/components/customer/ready-screen";
import { baht } from "@/domain/money";
import { startReadyAlert } from "@/lib/ready-alert";

type Phase = "locked" | "ringing" | "stopped";

export function ReadyPreview() {
  const [phase, setPhase] = useState<Phase>("locked");
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  async function unlock() {
    const ctx = typeof AudioContext === "undefined" ? null : new AudioContext();
    await ctx?.resume();
    stopRef.current = startReadyAlert(ctx);
    setPhase("ringing");
  }

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    setPhase("stopped");
  }

  if (phase === "locked") {
    return (
      <button
        type="button"
        onClick={unlock}
        className="flex min-h-dvh w-full cursor-pointer items-center justify-center bg-ok text-[22px] font-bold text-white"
      >
        แตะเพื่อเปิดเสียง
      </button>
    );
  }

  return (
    <ReadyScreen
      shopName="[ชื่อร้าน]"
      orderNo="A023"
      itemsLine="หมูปิ้ง × 4 · ข้าวเหนียว × 2 · ชาเย็น × 1"
      total={baht(85)}
      ringing={phase === "ringing"}
      onStop={stop}
    />
  );
}
