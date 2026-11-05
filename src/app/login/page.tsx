"use client";

import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getStaffAuth } from "@/lib/firebase/auth";
import { SHOP_NAME } from "@/lib/shop";
import { useStaffSession } from "@/lib/staff-session";

const STAFF_EMAIL = "staff@pos.local";

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/sell";
}

function signInError(error: unknown): string {
  if (error instanceof FirebaseError && error.code === "auth/network-request-failed") {
    return "เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง";
  }
  if (error instanceof FirebaseError && error.code === "auth/too-many-requests") {
    return "ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";
  }
  return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
}

export default function LoginPage() {
  const session = useStaffSession();
  const router = useRouter();
  const [email, setEmail] = useState(STAFF_EMAIL);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session === "signedIn") router.replace(nextPath());
  }, [session, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(getStaffAuth(), email.trim(), password);
    } catch (e) {
      setError(signInError(e));
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ground p-6 text-ink">
      <form onSubmit={submit} className="flex w-full max-w-[440px] flex-col gap-5 rounded-[28px] bg-card p-9">
        <div className="flex flex-col items-center gap-3 text-center">
          <div aria-hidden="true" className="flex size-14 items-center justify-center rounded-[16px] bg-ink text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9l1.5-5h13L20 9" />
              <path d="M4 9h16" />
              <path d="M5 9v11h14V9" />
              <path d="M10 20v-5h4v5" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold">เข้าสู่ระบบ</h1>
          <p className="text-[16px] text-ink-2">{SHOP_NAME} · สำหรับพนักงาน</p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-ink-2">อีเมล</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-[14px] border border-line bg-card px-4 text-[18px] text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-ink-2">รหัสผ่าน</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-[14px] border border-line bg-card px-4 text-[18px] text-ink outline-none focus:border-ink"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-[14px] bg-accent-soft px-4 py-3 text-[15px] font-semibold text-accent-deep">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-14 cursor-pointer rounded-[16px] bg-accent text-[20px] font-bold text-white disabled:cursor-default disabled:bg-line disabled:text-ink-2"
        >
          {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </main>
  );
}
