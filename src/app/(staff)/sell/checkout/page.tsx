"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartCount, cartLines, cartTotal } from "@/domain/cart";
import { pressKey, receivedAmount, settle, type CashKey } from "@/domain/cash";
import { baht, formatBaht } from "@/domain/money";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog";
import { useNextOrderNo } from "@/lib/orders";
import { useCompleteSale } from "@/lib/sale";

const KEYS: readonly CashKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

export default function CheckoutPage() {
  const { products } = useCatalog();
  const { cart } = useCart();
  const router = useRouter();
  const { status, complete } = useCompleteSale();
  const nextOrderNo = useNextOrderNo();
  const [entry, setEntry] = useState("");

  const lines = cartLines(cart, products);
  const total = cartTotal(lines);
  const received = receivedAmount(entry);
  const settlement = settle(total, entry);
  const quick = [
    { label: `พอดี ${formatBaht(total)}`, amount: total },
    ...[100, 500, 1000].map((n) => ({ label: formatBaht(baht(n)), amount: baht(n) })),
  ];

  useEffect(() => {
    if (lines.length === 0 && status !== "done") router.replace("/sell");
  }, [lines.length, status, router]);

  if (lines.length === 0) return null;

  return (
    <div className="flex h-dvh flex-col gap-5 overflow-hidden bg-ground p-6 text-ink">
      <header className="flex items-center gap-4">
        <Link
          href="/sell"
          className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-card pr-[18px] pl-3 text-[16px] font-semibold text-ink"
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          แก้รายการ
        </Link>
        <h1 className="text-[28px] font-bold">คิดเงิน</h1>
        {nextOrderNo && <span className="text-[18px] text-ink-2">ออเดอร์ #{nextOrderNo}</span>}
      </header>

      <div className="flex min-h-0 flex-1 gap-5">
        <section aria-label="สรุปรายการ" className="flex w-[400px] shrink-0 flex-col gap-4 rounded-[24px] bg-card p-6">
          <h2 className="text-[18px] font-semibold text-ink-2">รายการ ({cartCount(lines)} ชิ้น)</h2>
          <ul className="flex flex-col gap-3.5">
            {lines.map(({ product, qty, lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-3 text-[18px]">
                <span>
                  {product.name} <span className="text-ink-2">× {qty}</span>
                </span>
                <span className="font-semibold">{formatBaht(lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="h-px bg-line" />
          <div className="flex flex-col gap-1">
            <span className="text-[16px] text-ink-2">ยอดที่ต้องชำระ</span>
            <span className="text-[56px] leading-[1.1] font-bold">{formatBaht(total)}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2.5">
            <span className="text-[15px] text-ink-2">ช่องทางชำระ</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                aria-pressed="true"
                className="flex h-14 items-center justify-center gap-2 rounded-[14px] border-2 border-ink bg-ink text-[17px] font-semibold text-white"
              >
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                เงินสด
              </button>
              <button
                type="button"
                disabled
                className="flex h-14 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#C9CCC5] bg-card text-[15px] leading-[1.2] font-medium text-ink-2"
              >
                PromptPay
                <span className="text-[12px]">ยังไม่เปิดใช้</span>
              </button>
            </div>
          </div>
        </section>

        <section aria-label="รับเงิน" className="flex min-w-0 flex-1 flex-col gap-4 rounded-[24px] bg-card p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5 rounded-[18px] border-2 border-ink px-5 py-3.5">
              <span className="text-[15px] text-ink-2">รับเงินมา</span>
              <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold">
                {formatBaht(received)}
              </output>
            </div>
            {settlement.kind === "enough" ? (
              <div className="flex flex-col gap-0.5 rounded-[18px] bg-ok-soft px-5 py-4 text-ok-ink">
                <span className="text-[15px]">เงินทอน</span>
                <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold">
                  {formatBaht(settlement.change)}
                </output>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 rounded-[18px] bg-accent-soft px-5 py-4 text-accent-deep">
                <span className="text-[15px]">ยังขาดอีก</span>
                <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold">
                  {formatBaht(settlement.missing)}
                </output>
              </div>
            )}
          </div>

          <div role="group" aria-label="จำนวนเงินด่วน" className="grid grid-cols-4 gap-2.5">
            {quick.map((q) => {
              const on = received === q.amount;
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setEntry(String(q.amount))}
                  className={`h-14 cursor-pointer rounded-[14px] border text-[18px] font-semibold ${
                    on ? "border-ink bg-ink text-white" : "border-line bg-card text-ink"
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="แป้นตัวเลข" className="grid grid-cols-3 gap-2.5">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={key === "back" ? "ลบ" : key}
                onClick={() => setEntry((current) => pressKey(current, key))}
                className="flex h-[62px] cursor-pointer items-center justify-center rounded-[14px] bg-ground text-[26px] font-semibold text-ink"
              >
                {key === "back" ? (
                  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6h11v12H9l-6-6 6-6z" />
                    <path d="M13 10l4 4M17 10l-4 4" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>

          {status === "failed" && (
            <p role="alert" className="mt-auto rounded-[14px] bg-accent-soft px-4 py-3 text-[16px] font-semibold text-accent-deep">
              บันทึกออเดอร์ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วกดชำระเสร็จอีกครั้ง
            </p>
          )}
          {settlement.kind === "enough" ? (
            <button
              type="button"
              disabled={status === "saving"}
              aria-busy={status === "saving"}
              onClick={() =>
                complete({
                  lines: lines.map(({ product, qty }) => ({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    qty,
                  })),
                  total,
                  cashReceived: received,
                  change: settlement.change,
                })
              }
              className={`flex h-[68px] cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-accent text-[22px] font-bold text-white disabled:cursor-default disabled:opacity-70 ${
                status === "failed" ? "" : "mt-auto"
              }`}
            >
              {status === "saving" ? (
                "กำลังบันทึกออเดอร์…"
              ) : (
                <>
                  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                  ชำระเสร็จ · ทอน {formatBaht(settlement.change)}
                </>
              )}
            </button>
          ) : (
            <button type="button" disabled className="mt-auto h-[68px] rounded-[18px] bg-line text-[22px] font-bold text-ink-2">
              ใส่เงินที่รับมาให้ครบก่อน
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
