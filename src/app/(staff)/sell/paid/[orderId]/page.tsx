"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { formatBaht } from "@/domain/money";
import { useOrder } from "@/lib/orders";
import { BillQr } from "@/components/bill-qr";

const noSubscribe = () => () => {};

function useOrigin(): string | null {
  return useSyncExternalStore(noSubscribe, () => window.location.origin, () => null);
}

export default function PaidPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const origin = useOrigin();

  if (order.state === "loading" || !origin) return <div aria-busy="true" className="h-dvh bg-ground" />;
  if (order.state === "missing") {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-ground text-ink">
        <p className="text-[22px] font-semibold">ไม่พบออเดอร์นี้</p>
        <Link href="/sell" className="flex h-14 items-center rounded-[16px] bg-accent px-7 text-[18px] font-bold text-white">
          กลับไปหน้าขาย
        </Link>
      </main>
    );
  }

  const { orderNo, total, cashReceived, change, publicToken, paymentMethod } = order.value;

  return (
    <div className="flex h-dvh items-stretch gap-8 overflow-hidden bg-ground p-10 text-ink">
      <section className="flex min-w-0 flex-1 flex-col justify-center gap-7 px-6">
        <div className="flex items-center gap-3.5">
          <span aria-hidden="true" className="flex size-[52px] items-center justify-center rounded-full bg-ok text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h1 className="text-[30px] font-bold">ชำระเงินเรียบร้อย</h1>
        </div>

        <div className="flex flex-col">
          <span className="text-[20px] text-ink-2">หมายเลขออเดอร์</span>
          <span className="text-[148px] leading-none font-bold tracking-[-2px]">{orderNo}</span>
        </div>

        <dl className="grid max-w-[520px] grid-cols-3 gap-3">
          <div className="flex flex-col gap-0.5 rounded-[18px] bg-card px-[18px] py-3.5">
            <dt className="text-[14px] text-ink-2">ยอด</dt>
            <dd className="text-[28px] font-bold">{formatBaht(total)}</dd>
          </div>
          {paymentMethod === "transfer" ? (
            <div className="col-span-2 flex flex-col gap-0.5 rounded-[18px] bg-ok-soft px-[18px] py-3.5 text-ok-ink">
              <dt className="text-[14px]">ชำระโดย</dt>
              <dd className="text-[28px] font-bold">เงินโอน</dd>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-0.5 rounded-[18px] bg-card px-[18px] py-3.5">
                <dt className="text-[14px] text-ink-2">รับเงินสด</dt>
                <dd className="text-[28px] font-bold">{formatBaht(cashReceived)}</dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-[18px] bg-ok-soft px-[18px] py-3.5 text-ok-ink">
                <dt className="text-[14px]">เงินทอน</dt>
                <dd className="text-[28px] font-bold">{formatBaht(change)}</dd>
              </div>
            </>
          )}
        </dl>

        <div className="flex flex-wrap gap-3">
          <Link href="/sell" className="flex h-16 items-center gap-2.5 rounded-[18px] bg-accent px-8 text-[20px] font-bold text-white">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
            เริ่มออเดอร์ถัดไป
          </Link>
          <Link href="/orders" className="flex h-16 items-center rounded-[18px] border border-line bg-card px-7 text-[18px] font-semibold text-ink">
            ดูคิวออเดอร์
          </Link>
        </div>
      </section>

      <section
        aria-label="QR บิลสำหรับลูกค้า"
        className="flex w-[460px] shrink-0 flex-col items-center justify-center gap-6 rounded-[28px] bg-card p-9 text-center"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[26px] font-bold">สแกนเพื่อดูบิล</h2>
          <p className="text-[17px] text-ink-2">แล้วรอรับแจ้งเตือนบนมือถือเมื่อของพร้อม</p>
        </div>
        <div className="rounded-[24px] border-2 border-ink bg-card p-5">
          <BillQr url={`${origin}/b/${publicToken}`} label={`QR บิลออเดอร์ ${orderNo}`} />
        </div>
        <div className="flex items-center gap-2.5 text-[16px] text-ink-2">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
          ใช้กล้องมือถือสแกนได้เลย ไม่ต้องลงแอป
        </div>
      </section>
    </div>
  );
}
