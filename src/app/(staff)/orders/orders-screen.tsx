"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatBaht } from "@/domain/money";
import type { Order, OrderStatus } from "@/domain/order";
import { itemsSummary, ordersForTab, queueTabs } from "@/domain/queue";
import { useOrderQueue } from "@/lib/order-queue";
import { formatClock } from "@/lib/thai-date";
import { StaffNav } from "@/components/staff-nav";

const TABS: { status: OrderStatus; label: string }[] = [
  { status: "preparing", label: "กำลังทำ" },
  { status: "notified", label: "แจ้งแล้ว" },
  { status: "picked_up", label: "รับแล้ว" },
];

const TOAST_MS = 4000;

type Toast = { orderId: string; text: string; seq: number };

function notifyToast(order: Order): string {
  return order.scannedAt
    ? `ส่งแจ้งเตือนไปที่มือถือลูกค้า ${order.orderNo} แล้ว`
    : `ลูกค้ายังไม่สแกนบิล · เรียก ${order.orderNo} ด้วยเสียง`;
}

export function OrdersScreen() {
  const queue = useOrderQueue();
  const [tab, setTab] = useState<OrderStatus>("preparing");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const counts = queueTabs(queue.orders);
  const shown = ordersForTab(queue.orders, tab);

  function show(order: Order, text: string) {
    setToast((prev) => ({ orderId: order.id, text, seq: (prev?.seq ?? 0) + 1 }));
  }

  async function alert(order: Order, send: (order: Order) => Promise<void>) {
    try {
      await send(order);
      show(order, notifyToast(order));
    } catch {
      show(order, `แจ้ง ${order.orderNo} ไม่สำเร็จ · ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง`);
    }
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-ground text-ink">
      <StaffNav />

      <main aria-busy={queue.status === "loading"} className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[28px] font-bold">คิวออเดอร์</h1>
          <div role="tablist" aria-label="สถานะออเดอร์" className="flex gap-1 rounded-[16px] bg-[#e6e8e3] p-1">
            {TABS.map(({ status, label }) => {
              const on = status === tab;
              return (
                <button
                  key={status}
                  id={`tab-${status}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="orders-panel"
                  onClick={() => setTab(status)}
                  className={`flex h-11 cursor-pointer items-center gap-2 rounded-[12px] px-[18px] text-[16px] font-semibold ${
                    on ? "bg-card text-ink" : "bg-transparent text-[#4d514e]"
                  }`}
                >
                  {label}
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] ${
                      on ? "bg-ink text-white" : "bg-[#d5d8d2] text-ink"
                    }`}
                  >
                    {counts[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="orders-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {queue.status === "loading" ? null : queue.status === "error" ? (
            <p className="mt-10 text-center text-[18px] text-ink-2">โหลดออเดอร์ไม่สำเร็จ · เปิดหน้านี้ใหม่อีกครั้ง</p>
          ) : shown.length === 0 ? (
            <p className="mt-10 text-center text-[18px] text-ink-2">ไม่มีออเดอร์ในสถานะนี้</p>
          ) : (
            <div className="grid grid-cols-3 content-start gap-3.5">
              {shown.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  highlighted={toast?.orderId === order.id}
                  onNotify={() => alert(order, queue.notify)}
                  onRenotify={() => alert(order, queue.renotify)}
                  onPickup={async () => {
                    try {
                      await queue.pickup(order);
                      setToast((prev) => (prev?.orderId === order.id ? null : prev));
                    } catch {
                      show(order, `บันทึกการรับของ ${order.orderNo} ไม่สำเร็จ · ลองอีกครั้ง`);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div
          key={toast.seq}
          role="status"
          className="absolute bottom-7 left-1/2 ml-11 flex -translate-x-1/2 items-center gap-4 rounded-[18px] bg-ink py-3 pr-3 pl-5 whitespace-nowrap text-white shadow-[0_12px_32px_rgba(28,29,26,0.25)]"
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
          <span className="text-[16px] font-semibold">{toast.text}</span>
          <button
            type="button"
            aria-label="ปิด"
            onClick={() => setToast(null)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[12px] bg-transparent text-white"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  highlighted,
  onNotify,
  onRenotify,
  onPickup,
}: {
  order: Order;
  highlighted: boolean;
  onNotify: () => void;
  onRenotify: () => void;
  onPickup: () => void;
}) {
  return (
    <article
      aria-label={`ออเดอร์ ${order.orderNo}`}
      className={`flex flex-col gap-3 rounded-[20px] border-2 bg-card p-5 ${highlighted ? "border-ok" : "border-card"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[34px] leading-none font-bold">{order.orderNo}</span>
        <span className="text-[14px] text-ink-2">{formatClock(order.createdAt)}</span>
      </div>
      {order.scannedAt ? (
        <Pill className="bg-ok-soft text-ok-ink" icon={<rect x="7" y="2" width="10" height="20" rx="2" />}>
          ลูกค้าสแกนบิลแล้ว
        </Pill>
      ) : (
        <Pill className="bg-accent-soft text-accent-deep" icon={<><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></>}>
          ยังไม่สแกน · เรียกเลขด้วยเสียง
        </Pill>
      )}
      <p className="min-h-12 text-[16px] leading-normal">{itemsSummary(order.lines)}</p>
      <div className="flex items-baseline justify-between text-[15px] text-ink-2">
        <span>{order.itemCount} ชิ้น</span>
        <span className="text-[20px] font-bold text-ink">{formatBaht(order.total)}</span>
      </div>
      <CardActions order={order} onNotify={onNotify} onRenotify={onRenotify} onPickup={onPickup} />
    </article>
  );
}

function CardActions({
  order,
  onNotify,
  onRenotify,
  onPickup,
}: {
  order: Order;
  onNotify: () => void;
  onRenotify: () => void;
  onPickup: () => void;
}) {
  switch (order.status) {
    case "preparing":
      return (
        <div className="grid grid-cols-[2fr_1fr] gap-2.5">
          <button
            type="button"
            onClick={onNotify}
            className="flex h-14 cursor-pointer items-center justify-center gap-2.5 rounded-[16px] bg-accent text-[18px] font-bold text-white"
          >
            <BellIcon size={22} strokeWidth={2.2} />
            แจ้งรับของ
          </button>
          <button
            type="button"
            onClick={onPickup}
            aria-label={`${order.orderNo} ลูกค้ารับของแล้ว ไม่ต้องแจ้ง`}
            className="h-14 cursor-pointer rounded-[16px] border border-line bg-card text-[16px] font-semibold text-ink"
          >
            รับของแล้ว
          </button>
        </div>
      );
    case "notified":
      return (
        <div className="flex flex-col gap-2.5">
          <span className="text-[14px] font-semibold text-ok-ink">แจ้งลูกค้าแล้ว · {formatClock(order.notifiedAt)}</span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRenotify}
              className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-line bg-card text-[16px] font-semibold text-ink"
            >
              <BellIcon size={20} strokeWidth={2} />
              แจ้งซ้ำ
            </button>
            <button type="button" onClick={onPickup} className="h-14 cursor-pointer rounded-[16px] bg-ink text-[16px] font-semibold text-white">
              รับของแล้ว
            </button>
          </div>
        </div>
      );
    case "picked_up":
      return (
        <span className="flex h-11 items-center justify-center rounded-[14px] bg-ground text-[15px] font-semibold text-ink-2">
          ลูกค้ารับแล้ว · {formatClock(order.pickedUpAt)}
        </span>
      );
  }
}

function Pill({ className, icon, children }: { className: string; icon: ReactNode; children: ReactNode }) {
  return (
    <span className={`flex h-7 items-center gap-1.5 self-start rounded-full px-2.5 text-[13px] font-semibold ${className}`}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {children}
    </span>
  );
}

function BellIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
      <path d="M10 21h4" />
    </svg>
  );
}
