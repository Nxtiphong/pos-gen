import { describe, expect, it } from "vitest";
import type { BusinessDate } from "./business-date";
import type { ProductId } from "./catalog";
import { baht } from "./money";
import type { Order, OrderId, OrderNo, OrderProgress, PublicToken } from "./order";
import { itemsSummary, ordersForTab, queueTabs } from "./queue";

const at = (hhmm: string) => new Date(`2026-11-05T${hhmm}:00+07:00`);
const preparing: OrderProgress = { status: "preparing", notifyCount: 0 };
const notified = (hhmm: string): OrderProgress => ({ status: "notified", notifyCount: 1, notifiedAt: at(hhmm) });
const pickedUp = (hhmm: string): OrderProgress => ({ status: "picked_up", notifyCount: 1, notifiedAt: at("10:00"), pickedUpAt: at(hhmm) });

function order(orderNo: string, progress: OrderProgress = preparing, created = "10:00"): Order {
  return {
    id: orderNo.toLowerCase() as OrderId,
    orderNo: orderNo as OrderNo,
    publicToken: `tok-${orderNo}` as PublicToken,
    businessDate: "2026-11-05" as BusinessDate,
    lines: [{ productId: "p1" as ProductId, name: "หมูปิ้ง", qty: 1, price: baht(10) }],
    itemCount: 1,
    total: baht(10),
    paymentMethod: "cash",
    cashReceived: baht(10),
    change: baht(0),
    createdAt: at(created),
    ...progress,
  };
}

describe("queueTabs", () => {
  it("counts orders per status, including empty statuses", () => {
    const orders = [order("A001"), order("A002"), order("A003", notified("10:30"))];
    expect(queueTabs(orders)).toEqual({ preparing: 2, notified: 1, picked_up: 0, cancelled: 0 });
  });
});

describe("ordersForTab", () => {
  const orders = [
    order("A003", preparing, "10:40"),
    order("A001", preparing, "10:30"),
    order("A002", preparing, "10:35"),
    order("A010", notified("10:36")),
    order("A011", notified("10:48")),
    order("A020", pickedUp("10:24")),
    order("A021", pickedUp("10:33")),
  ];
  const nos = (list: Order[]) => list.map((o) => o.orderNo);

  it("preparing lists the oldest order first", () => {
    expect(nos(ordersForTab(orders, "preparing"))).toEqual(["A001", "A002", "A003"]);
  });

  it("notified lists the most recently notified first", () => {
    expect(nos(ordersForTab(orders, "notified"))).toEqual(["A011", "A010"]);
  });

  it("picked_up lists the most recent pickup first", () => {
    expect(nos(ordersForTab(orders, "picked_up"))).toEqual(["A021", "A020"]);
  });
});

describe("itemsSummary", () => {
  it("joins name × qty with a middle dot", () => {
    const lines = [
      { name: "หมูปิ้ง", qty: 4 },
      { name: "ข้าวเหนียว", qty: 2 },
    ];
    expect(itemsSummary(lines)).toBe("หมูปิ้ง × 4 · ข้าวเหนียว × 2");
  });
});
