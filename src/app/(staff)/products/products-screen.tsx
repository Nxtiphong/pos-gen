"use client";

import { useState } from "react";
import { formatBaht } from "@/domain/money";
import { useCatalog, useCatalogActions } from "@/lib/catalog";
import { StaffNav } from "@/components/staff-nav";
import { AddProductDialog } from "./add-product-dialog";

export function ProductsScreen() {
  const { categories, products } = useCatalog();
  const { setAvailable } = useCatalogActions();
  const [adding, setAdding] = useState(false);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  const onCount = rows.filter((p) => p.isAvailable).length;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-ground text-ink">
      <StaffNav />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[28px] font-bold">
            สินค้า{" "}
            <span className="text-[18px] font-medium text-ink-2">
              {onCount} จาก {rows.length} รายการมีขาย
            </span>
          </h1>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-[52px] cursor-pointer items-center gap-2 rounded-[16px] bg-accent pr-[22px] pl-[18px] text-[18px] font-bold text-white"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M12 5v14" />
            </svg>
            เพิ่มสินค้า
          </button>
        </div>

        <section aria-label="รายการสินค้า" className="flex min-h-0 flex-col overflow-auto rounded-[22px] bg-card px-6 py-2">
          <div className="grid h-11 shrink-0 grid-cols-[1fr_160px_120px_120px] items-center gap-4 border-b border-line text-[14px] text-ink-2">
            <span>สินค้า</span>
            <span>หมวด</span>
            <span className="text-right">ราคา</span>
            <span className="text-right">มีขาย</span>
          </div>
          <ul>
            {rows.map((p) => (
              <li
                key={p.id}
                className={`grid h-12 grid-cols-[1fr_160px_120px_120px] items-center gap-4 border-b border-[#f0f1ee] ${
                  p.isAvailable ? "text-ink" : "text-ink-2"
                }`}
              >
                <span className="flex items-center gap-2.5 text-[17px] font-semibold">
                  {p.name}
                  {!p.isAvailable && (
                    <span className="flex h-6 items-center rounded-full bg-[#f0f1ee] px-2 text-[12px] font-semibold text-ink-2">หมด</span>
                  )}
                </span>
                <span className="text-[15px] text-ink-2">{categoryName.get(p.categoryId)}</span>
                <span className="text-right text-[17px] font-bold">
                  {formatBaht(p.price)} / {p.unit}
                </span>
                <span className="flex justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.isAvailable}
                    aria-label={`มีขาย ${p.name}`}
                    onClick={() => void setAvailable(p.id, !p.isAvailable)}
                    className="flex h-11 w-14 cursor-pointer items-center justify-center"
                  >
                    <span
                      className={`flex h-[34px] w-14 items-center rounded-full p-[3px] ${
                        p.isAvailable ? "justify-end bg-ok" : "justify-start bg-[#c9ccc5]"
                      }`}
                    >
                      <span className="size-7 rounded-full bg-white shadow-[0_1px_3px_rgba(28,29,26,0.3)]" />
                    </span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {adding && <AddProductDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
