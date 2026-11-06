"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartCount, cartLines, cartTotal } from "@/domain/cart";
import { pressKey, receivedAmount, settle, type CashKey } from "@/domain/cash";
import { baht, formatBaht, type Baht } from "@/domain/money";
import type { PaymentMethod } from "@/domain/order";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog";
import { useNextOrderNo } from "@/lib/orders";
import { useCompleteSale } from "@/lib/sale";
import { PROMPTPAY_QR_IS_MOCK, PROMPTPAY_QR_SRC } from "@/lib/shop";

const KEYS: readonly CashKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

export default function CheckoutPage() {
  const { products } = useCatalog();
  const { cart } = useCart();
  const router = useRouter();
  const { status, complete } = useCompleteSale();
  const nextOrderNo = useNextOrderNo();
  const [entry, setEntry] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");

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

  const pay = (paymentMethod: PaymentMethod, cashReceived: Baht, change: Baht) =>
    complete({
      lines: lines.map(({ product, qty }) => ({ productId: product.id, name: product.name, price: product.price, qty })),
      total,
      paymentMethod,
      cashReceived,
      change,
    });

  return (
    <div className="flex min-h-dvh flex-col gap-5 bg-ground p-6 text-ink max-lg:pb-[calc(108px+env(safe-area-inset-bottom))] max-md:gap-4 max-md:px-4 max-md:pt-4 lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-center gap-4 max-md:gap-x-3 max-md:gap-y-2">
        <Link
          href="/sell"
          className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-card pr-[18px] pl-3 text-[16px] font-semibold text-ink"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          แก้รายการ
        </Link>
        <h1 className="text-[28px] font-bold">คิดเงิน</h1>
        {nextOrderNo && <span className="text-[18px] text-ink-2">ออเดอร์ #{nextOrderNo}</span>}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 max-md:gap-4 lg:flex-row">
        <section aria-label="สรุปรายการ" className="flex shrink-0 flex-col gap-4 rounded-[24px] bg-card p-6 max-md:p-5 lg:w-[400px]">
          <h2 className="text-[18px] font-semibold text-ink-2">รายการ ({cartCount(lines)} ชิ้น)</h2>
          <ul className="flex flex-col gap-3.5 max-lg:gap-1.5">
            {lines.map(({ product, qty, lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-3 text-[18px] max-lg:text-[16px]">
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
            <span className="text-[56px] leading-[1.1] font-bold max-md:text-[44px]">{formatBaht(total)}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2.5">
            <span className="text-[15px] text-ink-2">ช่องทางชำระ</span>
            <div role="group" aria-label="ช่องทางชำระ" className="grid grid-cols-2 gap-2.5">
              {(
                [
                  [
                    "cash",
                    "เงินสด",
                    <>
                      <rect key="r" x="3" y="6" width="18" height="12" rx="2" />
                      <circle key="c" cx="12" cy="12" r="2.5" />
                    </>,
                  ],
                  [
                    "transfer",
                    "เงินโอน",
                    <>
                      <rect key="r" x="6" y="2" width="12" height="20" rx="2" />
                      <path key="p" d="M9 10h6M13 8l2 2-2 2M11 16l-2-2 2-2M9 14h6" />
                    </>,
                  ],
                ] as const
              ).map(([id, label, icon]) => {
                const on = method === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMethod(id)}
                    className={`flex h-14 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-2 text-[17px] font-semibold ${
                      on ? "border-ink bg-ink text-white" : "border-line bg-card text-ink"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {icon}
                    </svg>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-label="รับเงิน" className="flex min-w-0 flex-1 flex-col gap-4 rounded-[24px] bg-card p-6 max-md:p-4">
          {method === "transfer" ? (
            <div className="flex min-h-0 flex-1 items-center gap-6 max-lg:flex-col max-md:gap-4">
              <figure className="relative flex shrink-0 flex-col items-center gap-2 rounded-[22px] border-2 border-ink bg-card p-4">
                <Image src={PROMPTPAY_QR_SRC} alt="QR พร้อมเพย์ของร้าน" width={300} height={300} unoptimized className="size-[300px] max-md:size-[260px]" />
                <figcaption className="text-[15px] font-semibold text-ink-2">สแกนจ่ายด้วยพร้อมเพย์</figcaption>
                {PROMPTPAY_QR_IS_MOCK && (
                  <span className="absolute -top-3 right-4 rounded-full bg-blue px-3 py-1 text-[13px] font-bold text-white">QR ตัวอย่าง</span>
                )}
              </figure>
              <div className="flex min-w-0 flex-1 flex-col gap-3 max-lg:w-full">
                <div className="flex flex-col gap-0.5 rounded-[18px] bg-ground px-5 py-4">
                  <span className="text-[16px] text-ink-2">ยอดที่ลูกค้าต้องโอน</span>
                  <output aria-live="polite" className="text-[64px] leading-[1.1] font-bold">
                    {formatBaht(total)}
                  </output>
                </div>
                <p className="text-[17px] leading-[1.6] text-ink-2">
                  ให้ลูกค้าสแกน QR แล้วโอน <b className="text-ink">{formatBaht(total)}</b> จากนั้นดูสลิปหรือตรวจยอดเข้าในแอปธนาคารก่อนกดยืนยัน
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 flex-col gap-0.5 rounded-[18px] border-2 border-ink px-5 py-3.5 max-md:px-4">
                  <span className="text-[15px] text-ink-2">รับเงินมา</span>
                  <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold max-md:text-[36px]">
                    {formatBaht(received)}
                  </output>
                </div>
                {settlement.kind === "enough" ? (
                  <div className="flex min-w-0 flex-col gap-0.5 rounded-[18px] bg-ok-soft px-5 py-4 text-ok-ink max-md:px-4">
                    <span className="text-[15px]">เงินทอน</span>
                    <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold max-md:text-[36px]">
                      {formatBaht(settlement.change)}
                    </output>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-col gap-0.5 rounded-[18px] bg-blue-soft px-5 py-4 text-blue-ink max-md:px-4">
                    <span className="text-[15px]">ยังขาดอีก</span>
                    <output aria-live="polite" className="text-[48px] leading-[1.15] font-bold max-md:text-[36px]">
                      {formatBaht(settlement.missing)}
                    </output>
                  </div>
                )}
              </div>

              <div role="group" aria-label="จำนวนเงินด่วน" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
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
                      <svg
                        aria-hidden="true"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 6h11v12H9l-6-6 6-6z" />
                        <path d="M13 10l4 4M17 10l-4 4" />
                      </svg>
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {status === "failed" && (
            <p role="alert" className="mt-auto rounded-[14px] bg-danger-soft px-4 py-3 text-[16px] font-semibold text-danger">
              บันทึกออเดอร์ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วกดชำระเสร็จอีกครั้ง
            </p>
          )}
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-10 max-lg:grid max-lg:bg-ground/95 max-lg:px-6 max-lg:pt-3 max-lg:pb-[calc(12px+env(safe-area-inset-bottom))] max-md:px-4 lg:contents">
            {method === "transfer" || settlement.kind === "enough" ? (
              <button
                type="button"
                disabled={status === "saving"}
                aria-busy={status === "saving"}
                onClick={() =>
                  method === "transfer"
                    ? pay("transfer", total, baht(0))
                    : settlement.kind === "enough" && pay("cash", received, settlement.change)
                }
                className={`flex h-[68px] cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-accent text-[22px] font-bold text-white disabled:cursor-default disabled:opacity-70 ${
                  status === "failed" ? "" : "mt-auto"
                }`}
              >
                {status === "saving" ? (
                  "กำลังบันทึกออเดอร์…"
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                    {method === "transfer"
                      ? `ยืนยันรับโอน · ${formatBaht(total)}`
                      : `ชำระเสร็จ · ทอน ${formatBaht(settlement.kind === "enough" ? settlement.change : baht(0))}`}
                  </>
                )}
              </button>
            ) : (
              <button type="button" disabled className="mt-auto h-[68px] rounded-[18px] bg-line text-[22px] font-bold text-ink-2">
                ใส่เงินที่รับมาให้ครบก่อน
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
