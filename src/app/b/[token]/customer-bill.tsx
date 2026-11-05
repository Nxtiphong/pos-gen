"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReadyScreen } from "@/components/customer/ready-screen";
import { baht, formatBaht } from "@/domain/money";
import { queueAhead, type Bill, type PublicToken } from "@/domain/order";
import { itemsSummary } from "@/domain/queue";
import { alertAudioContext, unlockAlertAudio } from "@/lib/alert-audio";
import { useBill, usePreparingQueue } from "@/lib/orders";
import { startReadyAlert } from "@/lib/ready-alert";
import { SHOP_NAME } from "@/lib/shop";
import { formatBillDateTime } from "@/lib/thai-date";

export function CustomerBill({ token }: { token: PublicToken }) {
  const bill = useBill(token);
  const queue = usePreparingQueue(bill.state === "ready" ? bill.value.businessDate : null);
  const scanned = useRef(false);

  useEffect(() => {
    if (bill.state !== "ready" || scanned.current) return;
    scanned.current = true;
    fetch(`/api/bills/${token}/scan`, { method: "POST" }).catch(() => {});
  }, [bill.state, token]);

  const alert = useReadyAlert(bill.state === "ready" ? bill.value : null);

  if (bill.state === "loading") return <Shell busy />;
  if (bill.state === "missing") return <BillMissing />;
  if (bill.value.status === "notified") {
    return (
      <ReadyScreen
        shopName={SHOP_NAME}
        orderNo={bill.value.orderNo}
        itemsLine={itemsSummary(bill.value.lines)}
        total={bill.value.total}
        ringing={alert.ringing}
        onStop={alert.stop}
      />
    );
  }
  return <BillView bill={bill.value} ahead={queueAhead(queue, bill.value.orderNo)} />;
}

// Rings when notifyCount rises above the count this page last saw. The first snapshot only sets that
// baseline, unless the order is already notified when the customer opens the page.
function useReadyAlert(bill: Bill | null): { ringing: boolean; stop: () => void } {
  const seen = useRef<number | null>(null);
  const [ringingFor, setRingingFor] = useState<number | null>(null);
  const status = bill?.status;
  const notifyCount = bill?.notifyCount;

  useEffect(() => {
    if (status === undefined || notifyCount === undefined) return;
    const rose = seen.current === null ? status === "notified" : notifyCount > seen.current;
    seen.current = notifyCount;
    if (status !== "notified") setRingingFor(null);
    else if (rose) setRingingFor(notifyCount);
  }, [status, notifyCount]);

  useEffect(() => {
    if (ringingFor === null) return;
    return startReadyAlert(alertAudioContext());
  }, [ringingFor]);

  return { ringing: ringingFor !== null, stop: () => setRingingFor(null) };
}

function Shell({ children, busy }: { children?: ReactNode; busy?: boolean }) {
  return (
    <div aria-busy={busy} className="min-h-dvh bg-ground text-ink">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-3.5 p-5">
        <header className="flex items-center justify-between gap-3 px-1 pt-1">
          <span className="text-[17px] font-bold">{SHOP_NAME}</span>
          <span className="text-[14px] text-ink-2">บิลของคุณ</span>
        </header>
        {children}
      </div>
    </div>
  );
}

export function BillMissing() {
  return (
    <Shell>
      <section className="flex flex-col items-center gap-2.5 rounded-[28px] bg-card p-6 text-center">
        <span className="text-[22px] font-bold">ไม่พบบิลนี้</span>
        <p className="text-[15px] leading-[1.5] text-ink-2">
          ลิงก์อาจไม่ครบหรือพิมพ์ผิด
          <br />
          ลองสแกน QR ที่ร้านอีกครั้ง
        </p>
      </section>
    </Shell>
  );
}

function BillView({ bill, ahead }: { bill: Bill; ahead: number }) {
  return (
    <Shell>
      {bill.status === "picked_up" ? (
        <section className="flex flex-col items-center gap-3 rounded-[28px] bg-card p-6 text-center">
          <span aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-full bg-ok-soft text-ok">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h1 role="status" className="text-[24px] leading-[1.3] font-bold">
            รับของแล้ว · ขอบคุณที่อุดหนุน
          </h1>
          <span className="text-[15px] text-ink-2">ออเดอร์ {bill.orderNo}</span>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-2.5 rounded-[28px] bg-card p-6 text-center">
          <span className="text-[15px] text-ink-2">หมายเลขออเดอร์</span>
          <span className="text-[92px] leading-none font-bold tracking-[-1px]">{bill.orderNo}</span>
          <span role="status" className="flex h-9 items-center gap-2 rounded-full bg-accent-soft px-3.5 text-[15px] font-semibold text-accent-deep">
            <span aria-hidden="true" className="wait-dot size-2.5 rounded-full bg-accent" />
            กำลังเตรียม · คิวก่อนหน้า {ahead} ออเดอร์
          </span>
          <p className="mt-1 text-[15px] leading-[1.5] text-ink-2">
            เปิดหน้านี้ค้างไว้ เมื่อของพร้อม
            <br />
            มือถือจะเด้งแจ้งเตือนพร้อมเสียง
          </p>
        </section>
      )}

      {bill.status === "preparing" && <AlertToggle />}

      <section aria-label="รายละเอียดบิล" className="flex flex-col gap-3 rounded-[24px] bg-card px-[22px] py-5">
        <ul className="flex flex-col gap-2.5">
          {bill.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3 text-[16px]">
              <span>
                {line.name} <span className="text-ink-2">× {line.qty}</span>
              </span>
              <span>{formatBaht(baht(line.price * line.qty))}</span>
            </li>
          ))}
        </ul>
        <div className="h-px bg-line" />
        <div className="flex items-baseline justify-between">
          <span className="text-[16px] font-semibold">รวม</span>
          <span className="text-[26px] font-bold">{formatBaht(bill.total)}</span>
        </div>
        <div className="flex justify-between text-[14px] text-ink-2">
          <span>รับเงินสด</span>
          <span>{formatBaht(bill.cashReceived)}</span>
        </div>
        <div className="flex justify-between text-[14px] text-ink-2">
          <span>เงินทอน</span>
          <span>{formatBaht(bill.change)}</span>
        </div>
        <div className="h-px bg-line" />
        <span className="text-center text-[13px] text-ink-2">{formatBillDateTime(bill.createdAt)}</span>
      </section>
    </Shell>
  );
}

function AlertToggle() {
  const [on, setOn] = useState(false);

  if (on) {
    return (
      <div role="status" className="flex h-[58px] items-center justify-center gap-2.5 rounded-[18px] bg-ok-soft text-[16px] font-semibold text-ok-ink">
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-10" />
        </svg>
        เปิดแจ้งเตือนแล้ว · เสียงและสั่น
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        unlockAlertAudio().catch(() => false);
        setOn(true);
      }}
      className="flex h-[58px] cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-ink text-[18px] font-bold text-white"
    >
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
        <path d="M10 21h4" />
      </svg>
      เปิดเสียงแจ้งเตือน
    </button>
  );
}
