"use client";

import { useMemo, useState } from "react";
import { shiftDate, startOfBusinessDate, type BusinessDate } from "@/domain/business-date";
import { baht, formatBaht } from "@/domain/money";
import { ledger } from "@/domain/ledger";
import { summarize } from "@/domain/summary";
import { useCatalog } from "@/lib/catalog";
import { useOrdersOn } from "@/lib/orders";
import { formatThaiDate } from "@/lib/thai-date";
import { StaffNav } from "@/components/staff-nav";
import { BillsTable } from "./bills-table";
import { HourlyChart, peakOf } from "./hourly-chart";

const money = (n: number) => formatBaht(baht(n));
// A unit typed as a number (e.g. "1") reads as a second quantity, so fall back to a generic noun.
const unitWord = (unit: string | undefined) => (unit && /\D/.test(unit) ? unit : "ชิ้น");
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

const stepButton =
  "flex size-14 cursor-pointer items-center justify-center rounded-xl border border-line bg-card text-ink disabled:cursor-default disabled:opacity-40";

export function SummaryScreen({ today }: { today: BusinessDate }) {
  const [date, setDate] = useState(today);
  const { products } = useCatalog();
  const { status, orders } = useOrdersOn(date);
  const summary = useMemo(() => summarize(orders), [orders]);
  const bills = useMemo(() => ledger(orders), [orders]);
  const ready = status === "ready";
  const unitOf = new Map(products.map((p) => [p.id as string, p.unit]));
  const isToday = date === today;
  const peak = ready && summary.billCount > 0 ? peakOf(summary.hourly) : null;
  const maxQty = summary.topProducts[0]?.qty ?? 1;

  const pick = (value: string) => {
    if (value) setDate(value > today ? today : (value as BusinessDate));
  };
  const tile = (value: string | number) => (ready ? value : "–");

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-ground text-ink">
      <StaffNav />

      <main aria-busy={status === "loading"} className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6 max-md:p-4 max-md:pb-[calc(var(--spacing-tabbar)+16px)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold">{isToday ? "สรุปยอดวันนี้" : "สรุปยอดรายวัน"}</h1>
            <span className="text-[15px] text-ink-2">{formatThaiDate(startOfBusinessDate(date))}</span>
          </div>
          <div role="group" aria-label="เลือกวันที่" className="flex items-center gap-2">
            <button type="button" aria-label="วันก่อนหน้า" onClick={() => setDate(shiftDate(date, -1))} className={stepButton}>
              <Chevron direction="left" />
            </button>
            <input
              type="date"
              aria-label="วันที่"
              value={date}
              max={today}
              onChange={(e) => pick(e.target.value)}
              className="h-14 rounded-xl border border-line bg-card px-4 text-[16px] font-semibold text-ink"
            />
            <button type="button" aria-label="วันถัดไป" disabled={isToday} onClick={() => setDate(shiftDate(date, 1))} className={stepButton}>
              <Chevron direction="right" />
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr] gap-3">
          <div className="flex flex-col gap-1 rounded-[22px] bg-ink px-6 py-[22px] text-white">
            <dt className="text-[16px] text-[#c9ccc5]">ยอดขายรวม</dt>
            <dd data-testid="revenue" className="text-[44px] leading-[1.15] font-bold">{tile(money(summary.revenue))}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[22px] bg-card px-5 py-[22px]">
            <dt className="text-[16px] text-ink-2">เงินสด</dt>
            <dd data-testid="cash" className="text-[36px] leading-[1.2] font-bold">{tile(money(bills.totals.cash))}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[22px] bg-card px-5 py-[22px]">
            <dt className="text-[16px] text-ink-2">เงินโอน</dt>
            <dd data-testid="transfer" className="text-[36px] leading-[1.2] font-bold">{tile(money(bills.totals.transfer))}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[22px] bg-card px-5 py-[22px]">
            <dt className="text-[16px] text-ink-2">จำนวนบิล</dt>
            <dd data-testid="bills" className="text-[36px] leading-[1.2] font-bold">{tile(summary.billCount)}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-[22px] bg-card px-5 py-[22px]">
            <dt className="text-[16px] text-ink-2">ชิ้นที่ขายได้</dt>
            <dd data-testid="items" className="text-[36px] leading-[1.2] font-bold">{tile(summary.itemCount)}</dd>
          </div>
        </dl>

        {status === "error" ? (
          <Notice title="โหลดข้อมูลไม่สำเร็จ" hint="ลองเปลี่ยนวันที่หรือเปิดหน้านี้ใหม่อีกครั้ง" />
        ) : status === "loading" ? (
          <Notice title="กำลังโหลด…" />
        ) : summary.billCount === 0 ? (
          <Notice title="ยังไม่มียอดขายในวันนี้" hint="เมื่อมีการขาย ยอดและสินค้าขายดีจะแสดงที่นี่" />
        ) : (
          <>
            <div className="grid h-[460px] shrink-0 grid-cols-2 gap-3.5">
              <section className="flex flex-col gap-[18px] rounded-[22px] bg-card p-6">
                <h2 className="text-[20px] font-bold">สินค้าขายดี 5 อันดับ</h2>
                <ol data-testid="top-list" className="flex flex-col gap-[18px]">
                  {summary.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex flex-col gap-2">
                      <div className="flex items-baseline gap-2.5">
                        <span className="w-5 text-[15px] font-bold text-ink-2">{i + 1}</span>
                        <span className="flex-1 text-[18px] font-semibold">{p.name}</span>
                        <span className="text-[15px] text-ink-2">
                          ขายได้ {p.qty} {unitWord(unitOf.get(p.productId))}
                        </span>
                        <span className="w-[76px] text-right text-[18px] font-bold">{money(p.revenue)}</span>
                      </div>
                      <div aria-hidden="true" className="ml-[30px] h-2 rounded-full bg-[#f0f1ee]">
                        <div
                          className={`h-2 rounded-full ${i === 0 ? "bg-accent" : "bg-[#8c918d]"}`}
                          style={{ width: `${Math.round((p.qty / maxQty) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="flex min-h-0 flex-col gap-3 rounded-[22px] bg-card p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[20px] font-bold">ยอดขายรายชั่วโมง</h2>
                  {peak && <span className="text-[14px] text-ink-2">ขายดีสุด {hourLabel(peak.hour)}–{hourLabel(peak.hour + 1)}</span>}
                </div>
                <HourlyChart hourly={summary.hourly} />
              </section>
            </div>
            <BillsTable data={bills} date={date} />
          </>
        )}
      </main>
    </div>
  );
}

function Notice({ title, hint }: { title: string; hint?: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[22px] bg-card p-6 text-center">
      <p className="text-[22px] font-bold">{title}</p>
      {hint && <p className="text-[16px] text-ink-2">{hint}</p>}
    </div>
  );
}
