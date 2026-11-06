"use client";

import { useEffect, useRef, useState } from "react";
import { BillQr } from "@/components/bill-qr";
import type { Order } from "@/domain/order";

export function BillQrButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`แสดง QR บิล ${order.orderNo}`}
        className="flex h-11 cursor-pointer items-center gap-1.5 rounded-[12px] border border-line bg-card px-3 text-[14px] font-semibold text-ink"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3M21 14v.01M14 21h3M21 18v3" />
        </svg>
        QR
      </button>
      {open && <BillQrDialog order={order} onClose={() => setOpen(false)} />}
    </>
  );
}

function BillQrDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="bill-qr-title"
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[28px] bg-card p-0 text-ink backdrop:bg-ink/55"
    >
      <div className="flex flex-col items-center gap-4 p-7 text-center">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[15px] text-ink-2">QR บิลออเดอร์</span>
            <h2 id="bill-qr-title" className="text-[44px] leading-none font-bold">
              {order.orderNo}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="ปิด"
            className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] bg-ground text-ink"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="rounded-[22px] border-2 border-ink p-4">
          <BillQr url={`${window.location.origin}/b/${order.publicToken}`} label={`QR บิลออเดอร์ ${order.orderNo}`} size={260} />
        </div>
        <p className="text-[16px] leading-[1.5] text-ink-2">ให้ลูกค้าสแกนเพื่อดูบิลและรับแจ้งเตือนเมื่อของพร้อม</p>
      </div>
    </dialog>
  );
}
