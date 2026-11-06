"use client";

import { STATUS_LABEL, ledgerCsv, type Ledger } from "@/domain/ledger";
import { baht, formatBaht } from "@/domain/money";
import { PAYMENT_LABEL, type OrderStatus, type PaymentMethod } from "@/domain/order";
import { formatClock } from "@/lib/thai-date";

const money = (n: number) => formatBaht(baht(n));

const PAYMENT_STYLE: Record<PaymentMethod, string> = {
  cash: "bg-ground text-ink",
  transfer: "bg-blue-soft text-blue-ink",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  preparing: "bg-blue-soft text-blue-ink",
  notified: "bg-ok-soft text-ok-ink",
  picked_up: "bg-ground text-ink-2",
  cancelled: "bg-danger-soft text-danger",
};

function download(data: Ledger, date: string) {
  const blob = new Blob([ledgerCsv(data, formatClock)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bills-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BillsTable({ data, date }: { data: Ledger; date: string }) {
  const { rows, totals } = data;
  const cancelledCount = rows.filter((r) => r.status === "cancelled").length;
  const num = "px-4 py-3 text-right whitespace-nowrap";
  return (
    <section aria-labelledby="bills-title" className="flex min-w-0 flex-col gap-4 rounded-[22px] bg-card p-6 max-md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="bills-title" className="text-[20px] font-bold">
          รายละเอียดบิล{" "}
          <span className="text-[16px] font-medium text-ink-2">
            ({rows.length} บิล{cancelledCount > 0 && ` · ยกเลิก ${cancelledCount} ไม่นับรวมยอด`})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => download(data, date)}
          className="flex h-14 cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-5 text-[16px] font-semibold text-ink"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          ดาวน์โหลด CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-line">
        <table className="w-full border-collapse text-[16px]">
          <thead className="bg-ground text-[14px] text-ink-2">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">เลขบิล</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">เวลา</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">รายการ</th>
              <th scope="col" className={`${num} font-semibold`}>ชิ้น</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">ช่องทาง</th>
              <th scope="col" className={`${num} font-semibold`}>ยอด</th>
              <th scope="col" className={`${num} font-semibold`}>รับเงิน</th>
              <th scope="col" className={`${num} font-semibold`}>เงินทอน</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-line-soft ${r.status === "cancelled" ? "text-ink-2 line-through decoration-ink-2/60" : ""}`}>
                <th scope="row" className="px-4 py-3 text-left font-bold">{r.orderNo}</th>
                <td className="px-4 py-3 whitespace-nowrap text-ink-2">{formatClock(r.createdAt)}</td>
                <td className="px-4 py-3 max-lg:min-w-[220px]">{r.items}</td>
                <td className={num}>{r.itemCount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap ${PAYMENT_STYLE[r.paymentMethod]}`}>
                    {PAYMENT_LABEL[r.paymentMethod]}
                  </span>
                </td>
                <td className={`${num} font-bold`}>{money(r.total)}</td>
                <td className={num}>{money(r.cashReceived)}</td>
                <td className={num}>{money(r.change)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-line bg-ground font-bold">
            <tr>
              <th scope="row" colSpan={3} className="px-4 py-3 text-left">
                รวม
              </th>
              <td className={num}>{totals.itemCount}</td>
              <td className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-ink-2">
                สด {money(totals.cash)} · โอน {money(totals.transfer)}
              </td>
              <td className={num}>{money(totals.total)}</td>
              <td className={num}>{money(totals.cashReceived)}</td>
              <td className={num}>{money(totals.change)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
