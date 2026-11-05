import { describe, expect, it } from "vitest";
import { summarize, type SummaryOrder } from "./summary";

const line = (productId: string, name: string, price: number, qty: number) => ({ productId, name, price, qty });

const order = (iso: string, lines: SummaryOrder["lines"]): SummaryOrder => ({
  createdAt: new Date(iso),
  lines,
  total: lines.reduce((s, l) => s + l.price * l.qty, 0),
  itemCount: lines.reduce((s, l) => s + l.qty, 0),
});

describe("summarize", () => {
  it("sums revenue, bills and items", () => {
    const result = summarize([
      order("2026-11-05T00:10:00Z", [line("p1", "หมูปิ้ง", 10, 5), line("p7", "ข้าวเหนียว", 10, 2)]),
      order("2026-11-05T01:10:00Z", [line("p10", "ชาเย็น", 25, 1)]),
    ]);
    expect(result.revenue).toBe(95);
    expect(result.billCount).toBe(2);
    expect(result.itemCount).toBe(8);
  });

  it("puts 23:30 UTC in the 06:00 Bangkok bucket", () => {
    const result = summarize([order("2026-11-04T23:30:00Z", [line("p1", "หมูปิ้ง", 10, 3)])]);
    expect(result.hourly).toEqual([{ hour: 6, revenue: 30, billCount: 1 }]);
  });

  it("fills hours between the first and last sale with zeros", () => {
    const result = summarize([
      order("2026-11-05T00:05:00Z", [line("p1", "หมูปิ้ง", 10, 1)]),
      order("2026-11-05T00:50:00Z", [line("p1", "หมูปิ้ง", 10, 2)]),
      order("2026-11-05T03:00:00Z", [line("p2", "ไก่ปิ้ง", 25, 1)]),
    ]);
    expect(result.hourly).toEqual([
      { hour: 7, revenue: 30, billCount: 2 },
      { hour: 8, revenue: 0, billCount: 0 },
      { hour: 9, revenue: 0, billCount: 0 },
      { hour: 10, revenue: 25, billCount: 1 },
    ]);
  });

  it("returns a 06:00 to 22:00 window of zeros when empty", () => {
    const result = summarize([]);
    expect(result.revenue).toBe(0);
    expect(result.billCount).toBe(0);
    expect(result.itemCount).toBe(0);
    expect(result.topProducts).toEqual([]);
    expect(result.hourly).toHaveLength(17);
    expect(result.hourly[0]).toEqual({ hour: 6, revenue: 0, billCount: 0 });
    expect(result.hourly[16]).toEqual({ hour: 22, revenue: 0, billCount: 0 });
  });

  it("ranks top products by qty, then revenue, and keeps five", () => {
    const result = summarize([
      order("2026-11-05T00:00:00Z", [
        line("a", "A", 10, 4),
        line("b", "B", 25, 4),
        line("c", "C", 10, 3),
        line("d", "D", 10, 2),
        line("e", "E", 10, 2),
        line("f", "F", 5, 1),
      ]),
      order("2026-11-05T00:30:00Z", [line("a", "A", 10, 1)]),
    ]);
    expect(result.topProducts).toEqual([
      { productId: "a", name: "A", qty: 5, revenue: 50 },
      { productId: "b", name: "B", qty: 4, revenue: 100 },
      { productId: "c", name: "C", qty: 3, revenue: 30 },
      { productId: "d", name: "D", qty: 2, revenue: 20 },
      { productId: "e", name: "E", qty: 2, revenue: 20 },
    ]);
  });

  it("breaks a full tie by revenue", () => {
    const result = summarize([order("2026-11-05T00:00:00Z", [line("x", "X", 10, 2), line("y", "Y", 20, 2)])]);
    expect(result.topProducts.map((p) => p.productId)).toEqual(["y", "x"]);
  });
});
