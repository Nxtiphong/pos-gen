"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type ReactNode } from "react";
import type { CategoryId } from "@/domain/catalog";
import { cartCount, cartLines, cartTotal, type CartAction, type CartLine } from "@/domain/cart";
import { formatBaht } from "@/domain/money";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog";
import { StaffNav } from "@/components/staff-nav";
import type { OrderNo } from "@/domain/order";
import { useNextOrderNo } from "@/lib/orders";

type Filter = CategoryId | "all";

export function SellScreen({ today }: { today: string }) {
  const { categories, products } = useCatalog();
  const { cart, dispatch } = useCart();
  const nextOrderNo = useNextOrderNo();
  const [filter, setFilter] = useState<Filter>("all");
  const [billOpen, setBillOpen] = useState(false);

  const chips: { id: Filter; name: string }[] = [{ id: "all", name: "ทั้งหมด" }, ...categories];
  const shown = products.filter((p) => p.isAvailable && (filter === "all" || p.categoryId === filter));
  const lines = cartLines(cart, products);
  const total = formatBaht(cartTotal(lines));
  if (billOpen && lines.length === 0) setBillOpen(false);
  const bill = <Bill lines={lines} total={total} nextOrderNo={nextOrderNo} dispatch={dispatch} />;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-ground text-ink">
      <StaffNav />

      <div className="flex min-w-0 flex-1 flex-col max-md:pb-tabbar">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 p-6 max-lg:overflow-y-auto max-md:p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-[28px] font-bold">ขายสินค้า</h1>
            <span className="text-[15px] text-ink-2">{today}</span>
          </div>

          <div role="group" aria-label="หมวดสินค้า" className="flex shrink-0 flex-wrap gap-2 max-md:-mx-4 max-md:flex-nowrap max-md:overflow-x-auto max-md:px-4 max-md:[scrollbar-width:none]">
            {chips.map((chip) => {
              const on = chip.id === filter;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(chip.id)}
                  className={`h-11 shrink-0 cursor-pointer rounded-full border px-5 text-[16px] font-semibold ${
                    on ? "border-ink bg-ink text-white" : "border-line bg-card text-ink"
                  }`}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 content-start gap-3 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => {
              const qty = cart.get(p.id) ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`เพิ่ม ${p.name} ราคา ${p.price} บาท`}
                  onClick={() => dispatch({ type: "add", productId: p.id })}
                  className={`relative flex h-[124px] min-w-0 cursor-pointer flex-col items-start justify-between rounded-[18px] border-2 p-4 text-left text-ink ${
                    qty > 0 ? "border-accent bg-accent-tint" : "border-card bg-card"
                  }`}
                >
                  <span className="pr-[30px] text-[19px] leading-[1.3] font-semibold">{p.name}</span>
                  <span className="flex items-baseline gap-1">
                    <span className="text-[20px] font-bold">{formatBaht(p.price)}</span>
                    <span className="text-[14px] text-ink-2">/ {p.unit}</span>
                  </span>
                  {qty > 0 && (
                    <span className="absolute top-3 right-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-2 text-[16px] font-bold text-white">
                      {qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </main>

        <div className="flex items-center gap-3 border-t border-line bg-card px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`ดูบิล รวม ${cartCount(lines)} ชิ้น ${total}`}
            disabled={lines.length === 0}
            onClick={() => setBillOpen(true)}
            className="flex h-14 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left disabled:cursor-default"
          >
            <span className="min-w-0 truncate text-[16px] text-ink-2">
              รวม {cartCount(lines)} ชิ้น · <b className="text-[22px] text-ink">{total}</b>
            </span>
            {lines.length > 0 && (
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-2">
                <path d="M6 15l6-6 6 6" />
              </svg>
            )}
          </button>
          {lines.length > 0 ? (
            <Link href="/sell/checkout" className="flex h-14 shrink-0 items-center rounded-[16px] bg-accent px-7 text-[20px] font-bold text-white">
              คิดเงิน
            </Link>
          ) : (
            <button type="button" disabled className="h-14 shrink-0 rounded-[16px] bg-line px-7 text-[20px] font-bold text-ink-2">
              คิดเงิน
            </button>
          )}
        </div>
      </div>

      <aside aria-label="บิลปัจจุบัน" className="hidden w-[380px] shrink-0 flex-col border-l border-line bg-card lg:flex">
        {bill}
      </aside>

      {billOpen && <BillSheet onClose={() => setBillOpen(false)}>{bill}</BillSheet>}
    </div>
  );
}

function Bill({
  lines,
  total,
  nextOrderNo,
  dispatch,
}: {
  lines: CartLine[];
  total: string;
  nextOrderNo: OrderNo | null;
  dispatch: Dispatch<CartAction>;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] text-ink-2">ออเดอร์ถัดไป</span>
          <span className="text-[24px] font-bold">{nextOrderNo ? `#${nextOrderNo}` : "\u00a0"}</span>
        </div>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "clear" })}
            className="h-11 cursor-pointer rounded-[12px] border border-line bg-card px-4 text-[15px] font-semibold text-ink"
          >
            ล้างบิล
          </button>
        )}
      </div>
      <div className="mx-6 h-px bg-line" />

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-ink-2">
          <div aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-[24px] bg-ground">
            <BagIcon size={32} strokeWidth={1.8} />
          </div>
          <p className="text-[18px] font-semibold text-ink">ยังไม่มีสินค้าในบิล</p>
          <p className="text-[15px]">แตะสินค้าทางซ้ายเพื่อเพิ่ม</p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col overflow-auto px-6 py-2">
          {lines.map(({ product, qty, lineTotal }) => (
            <li key={product.id} className="flex items-center gap-3 border-b border-line-soft py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-semibold">{product.name}</span>
                <span className="text-[14px] text-ink-2">
                  {formatBaht(product.price)} / {product.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <StepButton label={`ลด ${product.name}`} onClick={() => dispatch({ type: "dec", productId: product.id })}>
                  <path d="M5 12h14" />
                </StepButton>
                <span className="min-w-7 text-center text-[18px] font-bold">{qty}</span>
                <StepButton label={`เพิ่ม ${product.name}`} onClick={() => dispatch({ type: "inc", productId: product.id })}>
                  <path d="M5 12h14M12 5v14" />
                </StepButton>
              </div>
              <span className="w-14 text-right text-[17px] font-bold">{formatBaht(lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4 border-t border-line px-6 pt-5 pb-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[16px] text-ink-2">รวม {cartCount(lines)} ชิ้น</span>
          <span className="text-[36px] leading-none font-bold">{total}</span>
        </div>
        {lines.length > 0 ? (
          <Link
            href="/sell/checkout"
            className="flex h-16 items-center justify-center gap-2.5 rounded-[18px] bg-accent text-[22px] font-bold text-white"
          >
            คิดเงิน · {total}
          </Link>
        ) : (
          <button type="button" disabled className="h-16 rounded-[18px] bg-line text-[22px] font-bold text-ink-2">
            คิดเงิน
          </button>
        )}
      </div>
    </>
  );
}

function BillSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="bill-sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="mx-0 mt-auto mb-0 w-full max-w-none rounded-t-[28px] bg-card p-0 text-ink backdrop:bg-ink/50 md:mx-auto md:max-w-[600px]"
    >
      <div className="flex max-h-[85dvh] flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 pt-3 pr-4 pl-6">
          <h2 id="bill-sheet-title" className="text-[18px] font-bold">บิลปัจจุบัน</h2>
          <button
            type="button"
            aria-label="ปิดบิล"
            onClick={() => ref.current?.close()}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] bg-ground text-ink"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] border border-line bg-card text-ink"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        {children}
      </svg>
    </button>
  );
}

function BagIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
