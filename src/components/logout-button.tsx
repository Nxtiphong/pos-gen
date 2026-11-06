"use client";

import { signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { getStaffAuth } from "@/lib/firebase/auth";

function LogoutIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

const STYLE = {
  rail: "mt-auto flex w-[72px] flex-col items-center gap-1 rounded-[14px] py-2.5 text-[13px] font-medium text-ink-2",
  tab: "flex flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-medium text-ink-2",
};

export function LogoutButton({ variant }: { variant: keyof typeof STYLE }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label="ออกจากระบบ" onClick={() => setOpen(true)} className={`cursor-pointer whitespace-nowrap ${STYLE[variant]}`}>
        {variant === "tab" ? (
          <span className="flex h-8 w-14 items-center justify-center rounded-full">
            <LogoutIcon />
          </span>
        ) : (
          <LogoutIcon />
        )}
        ออก
      </button>
      {open && <ConfirmLogout onClose={() => setOpen(false)} />}
    </>
  );
}

function ConfirmLogout({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !busy && ref.current.close()}
      aria-labelledby="logout-title"
      className="m-auto w-[min(400px,calc(100vw-32px))] rounded-[28px] bg-card p-0 text-ink backdrop:bg-ink/55"
    >
      <div className="flex flex-col gap-5 p-7">
        <div className="flex flex-col gap-2">
          <h2 id="logout-title" className="text-[24px] font-bold">
            ออกจากระบบ?
          </h2>
          <p className="text-[16px] leading-[1.6] text-ink-2">ต้องเข้าสู่ระบบใหม่ด้วยอีเมลและรหัสผ่านพนักงานก่อนขายต่อ</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => ref.current?.close()}
            className="h-14 cursor-pointer rounded-[16px] border border-line bg-card text-[17px] font-semibold text-ink disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={async () => {
              setBusy(true);
              await signOut(getStaffAuth()).catch(() => setBusy(false));
            }}
            className="h-14 cursor-pointer rounded-[16px] bg-ink text-[17px] font-bold text-white disabled:opacity-70"
          >
            {busy ? "กำลังออก…" : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
