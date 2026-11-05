import { describe, expect, it } from "vitest";
import { baht } from "./money";
import { applyQueueEvent, itemsSummary, ordersForTab, queueTabs, type QueueOrder } from "./queue";

const at = (hhmm: string) => new Date(`2026-11-05T${hhmm}:00+07:00`);

function order(orderNo: string, fields: Partial<QueueOrder> = {}): QueueOrder {
  return {
    id: orderNo.toLowerCase(),
    orderNo,
    createdAt: at("10:00"),
    lines: [{ name: "หมูปิ้ง", qty: 1, price: baht(10) }],
    itemCount: 1,
    total: baht(10),
    status: "preparing",
    notifyCount: 0,
    ...fields,
  };
}

describe("applyQueueEvent", () => {
  it("notify moves preparing to notified, stamps notifiedAt and counts the notify", () => {
    const result = applyQueueEvent(order("A023"), "notify", at("10:48"));
    expect(result).toEqual({
      ok: true,
      order: { ...order("A023"), status: "notified", notifiedAt: at("10:48"), notifyCount: 1 },
    });
  });

  it("renotify keeps notified, restamps notifiedAt and counts again", () => {
    const notified = order("A019", { status: "notified", notifiedAt: at("10:36"), notifyCount: 1 });
    const result = applyQueueEvent(notified, "renotify", at("10:50"));
    expect(result.ok && result.order.status).toBe("notified");
    expect(result.ok && result.order.notifiedAt).toEqual(at("10:50"));
    expect(result.ok && result.order.notifyCount).toBe(2);
  });

  it("pickup moves notified to picked_up and keeps the notify history", () => {
    const notified = order("A019", { status: "notified", notifiedAt: at("10:36"), notifyCount: 2 });
    const result = applyQueueEvent(notified, "pickup", at("10:52"));
    expect(result).toEqual({
      ok: true,
      order: { ...notified, status: "picked_up", pickedUpAt: at("10:52") },
    });
  });

  it.each([
    ["preparing", "renotify"],
    ["preparing", "pickup"],
    ["notified", "notify"],
    ["picked_up", "notify"],
    ["picked_up", "renotify"],
    ["picked_up", "pickup"],
  ] as const)("rejects %s + %s", (from, event) => {
    const result = applyQueueEvent(order("A020", { status: from }), event, at("11:00"));
    expect(result).toEqual({ ok: false, error: { kind: "illegal_transition", orderNo: "A020", from, event } });
  });
});

describe("queueTabs", () => {
  it("counts orders per status, including empty statuses", () => {
    const orders = [
      order("A001"),
      order("A002"),
      order("A003", { status: "notified" }),
    ];
    expect(queueTabs(orders)).toEqual({ preparing: 2, notified: 1, picked_up: 0 });
  });
});

describe("ordersForTab", () => {
  const orders = [
    order("A003", { createdAt: at("10:40") }),
    order("A001", { createdAt: at("10:30") }),
    order("A002", { createdAt: at("10:35") }),
    order("A010", { status: "notified", notifiedAt: at("10:36") }),
    order("A011", { status: "notified", notifiedAt: at("10:48") }),
    order("A020", { status: "picked_up", pickedUpAt: at("10:24") }),
    order("A021", { status: "picked_up", pickedUpAt: at("10:33") }),
  ];
  const nos = (list: QueueOrder[]) => list.map((o) => o.orderNo);

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
      { name: "หมูปิ้ง", qty: 4, price: baht(10) },
      { name: "ข้าวเหนียว", qty: 2, price: baht(10) },
    ];
    expect(itemsSummary(lines)).toBe("หมูปิ้ง × 4 · ข้าวเหนียว × 2");
  });
});
