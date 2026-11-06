"use client";

import { useEffect, useRef, useState } from "react";
import { formatBaht } from "@/domain/money";
import type { Order } from "@/domain/order";

export function CancelOrderButton({ order, onConfirm }: { order: Order; onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 cursor-pointer self-center rounded-[12px] px-4 text-[15px] font-semibold text-danger underline-offset-4 hover:underline"
      >
        ยกเลิกออเดอร์
      </button>
      {open && <ConfirmCancel order={order} onConfirm={onConfirm} onClose={() => setOpen(false)} />}
    </>
  );
}

function ConfirmCancel({ order, onConfirm, onClose }: { order: Order; onConfirm: () => Promise<void>; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !saving && ref.current.close()}
      aria-labelledby="cancel-title"
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[28px] bg-card p-0 text-ink backdrop:bg-ink/55"
    >
      <div className="flex flex-col gap-5 p-7">
        <div className="flex flex-col gap-2">
          <h2 id="cancel-title" className="text-[24px] font-bold">
            ยกเลิกออเดอร์ {order.orderNo}?
          </h2>
          <p className="text-[16px] leading-[1.6] text-ink-2">
            ยอด {formatBaht(order.total)} จะไม่ถูกนับในสรุปยอด และหน้าบิลของลูกค้าจะแสดงว่าออเดอร์ถูกยกเลิก
            {order.paymentMethod === "cash" ? " อย่าลืมคืนเงินสดให้ลูกค้า" : " อย่าลืมโอนเงินคืนให้ลูกค้า"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => ref.current?.close()}
            className="h-14 cursor-pointer rounded-[16px] border border-line bg-card text-[17px] font-semibold text-ink disabled:opacity-60"
          >
            ไม่ยกเลิก
          </button>
          <button
            type="button"
            disabled={saving}
            aria-busy={saving}
            onClick={async () => {
              setSaving(true);
              await onConfirm().finally(() => setSaving(false));
              ref.current?.close();
            }}
            className="h-14 cursor-pointer rounded-[16px] bg-danger text-[17px] font-bold text-white disabled:opacity-70"
          >
            {saving ? "กำลังยกเลิก…" : "ยกเลิกออเดอร์"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
