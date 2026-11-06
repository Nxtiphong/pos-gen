import { describe, expect, it } from "vitest";
import type { BusinessDate } from "./business-date";
import type { ProductId } from "./catalog";
import { ledger, ledgerCsv } from "./ledger";
import { baht } from "./money";
import type { Order, OrderId, OrderNo, OrderProgress, PaymentMethod, PublicToken } from "./order";

const at = (hhmm: string) => new Date(`2026-11-05T${hhmm}:00+07:00`);

function order(orderNo: string, created: string, progress: OrderProgress, lines: Order["lines"], cash: number, paymentMethod: PaymentMethod = "cash"): Order {
  const total = lines.reduce((t, l) => t + l.price * l.qty, 0);
  return {
    id: orderNo.toLowerCase() as OrderId,
    orderNo: orderNo as OrderNo,
    publicToken: `tok-${orderNo}` as PublicToken,
    businessDate: "2026-11-05" as BusinessDate,
    lines,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
    total: baht(total),
    paymentMethod,
    cashReceived: baht(cash),
    change: baht(cash - total),
    createdAt: at(created),
    ...progress,
  };
}

const moo = { productId: "p1" as ProductId, name: "หมูปิ้ง", price: baht(10) };
const tea = { productId: "p10" as ProductId, name: "ชาเย็น", price: baht(25) };

const orders = [
  order("A002", "10:40", { status: "preparing", notifyCount: 0 }, [{ ...tea, qty: 1 }], 100),
  order("A001", "10:31", { status: "picked_up", notifyCount: 0, pickedUpAt: at("10:35") }, [{ ...moo, qty: 4 }, { ...tea, qty: 1 }], 65, "transfer"),
];

describe("ledger", () => {
  it("lists bills oldest first with their money and sums every column", () => {
    const result = ledger(orders);
    expect(result.rows.map((r) => [r.orderNo, r.items, r.itemCount, r.paymentMethod, r.total, r.cashReceived, r.change, r.status])).toEqual([
      ["A001", "หมูปิ้ง × 4 · ชาเย็น × 1", 5, "transfer", 65, 65, 0, "picked_up"],
      ["A002", "ชาเย็น × 1", 1, "cash", 25, 100, 75, "preparing"],
    ]);
    expect(result.totals).toEqual({ itemCount: 6, total: 90, cash: 25, transfer: 65, cashReceived: 165, change: 75 });
  });

  it("lists a cancelled bill but leaves it out of the totals", () => {
    const voided = order("A003", "10:50", { status: "cancelled", notifyCount: 0, cancelledAt: at("10:55") }, [{ ...tea, qty: 2 }], 50);
    const result = ledger([...orders, voided]);
    expect(result.rows.map((r) => [r.orderNo, r.status])).toEqual([
      ["A001", "picked_up"],
      ["A002", "preparing"],
      ["A003", "cancelled"],
    ]);
    expect(result.totals).toEqual({ itemCount: 6, total: 90, cash: 25, transfer: 65, cashReceived: 165, change: 75 });
  });

  it("is empty with zero totals when there are no bills", () => {
    expect(ledger([])).toEqual({ rows: [], totals: { itemCount: 0, total: 0, cash: 0, transfer: 0, cashReceived: 0, change: 0 } });
  });
});

describe("ledgerCsv", () => {
  it("writes a BOM, a Thai header, one line per bill and a totals line", () => {
    const hhmm = (d: Date) => d.toISOString().slice(11, 16);
    expect(ledgerCsv(ledger(orders), hhmm)).toBe(
      "\uFEFF" +
        "เลขบิล,เวลา,รายการ,จำนวนชิ้น,ช่องทาง,ยอด,รับเงิน,เงินทอน,สถานะ\r\n" +
        "A001,03:31,หมูปิ้ง × 4 · ชาเย็น × 1,5,เงินโอน,65,65,0,รับแล้ว\r\n" +
        "A002,03:40,ชาเย็น × 1,1,เงินสด,25,100,75,กำลังทำ\r\n" +
        "รวม,,,6,,90,165,75,\r\n",
    );
  });
});
