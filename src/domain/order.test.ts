import { describe, expect, it } from "vitest";
import {
  formatOrderNo,
  isPublicToken,
  newPublicToken,
  queueAhead,
  transition,
  type OrderNo,
  type OrderProgress,
} from "./order";

describe("formatOrderNo", () => {
  it("pads the counter to three digits after A", () => {
    expect(formatOrderNo(1)).toBe("A001");
    expect(formatOrderNo(23)).toBe("A023");
    expect(formatOrderNo(999)).toBe("A999");
    expect(formatOrderNo(1000)).toBe("A1000");
  });
});

describe("newPublicToken", () => {
  it("is 24 url-safe characters (144 random bits)", () => {
    const token = newPublicToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(isPublicToken(token)).toBe(true);
  });

  it("does not repeat", () => {
    const tokens = new Set(Array.from({ length: 1000 }, newPublicToken));
    expect(tokens.size).toBe(1000);
  });
});

describe("isPublicToken", () => {
  it("rejects short or non-url-safe strings", () => {
    expect(isPublicToken("A001")).toBe(false);
    expect(isPublicToken("abc/defghijklmnopqrstuvwx")).toBe(false);
    expect(isPublicToken("abcdefghijklmnopqrstuv")).toBe(true);
  });
});

describe("queueAhead", () => {
  const preparing = ["A001", "A002", "A003"] as OrderNo[];

  it("counts the orders before this one", () => {
    expect(queueAhead(preparing, "A001" as OrderNo)).toBe(0);
    expect(queueAhead(preparing, "A003" as OrderNo)).toBe(2);
  });

  it("is zero when the order is no longer preparing", () => {
    expect(queueAhead(preparing, "A009" as OrderNo)).toBe(0);
  });
});

describe("transition", () => {
  const t1 = new Date("2026-11-05T03:00:00Z");
  const t2 = new Date("2026-11-05T03:05:00Z");
  const t3 = new Date("2026-11-05T03:09:00Z");
  const preparing: OrderProgress = { status: "preparing", notifyCount: 0 };
  const notified: OrderProgress = { status: "notified", notifyCount: 1, notifiedAt: t1 };

  it("notify moves preparing to notified with the first notification", () => {
    expect(transition(preparing, "notify", t1)).toEqual({
      ok: true,
      progress: { status: "notified", notifyCount: 1, notifiedAt: t1 },
    });
  });

  it("renotify bumps the count and the notified time", () => {
    expect(transition(notified, "renotify", t2)).toEqual({
      ok: true,
      progress: { status: "notified", notifyCount: 2, notifiedAt: t2 },
    });
  });

  it("pickup closes a notified order and keeps its notify history", () => {
    expect(transition({ status: "notified", notifyCount: 2, notifiedAt: t2 }, "pickup", t3)).toEqual({
      ok: true,
      progress: { status: "picked_up", notifyCount: 2, notifiedAt: t2, pickedUpAt: t3 },
    });
  });

  it("rejects every transition the table does not list", () => {
    const pickedUp: OrderProgress = { status: "picked_up", notifyCount: 1, notifiedAt: t1, pickedUpAt: t2 };
    expect(transition(preparing, "renotify", t2)).toEqual({ ok: false, error: { from: "preparing", event: "renotify" } });
    expect(transition(preparing, "pickup", t2)).toEqual({ ok: false, error: { from: "preparing", event: "pickup" } });
    expect(transition(notified, "notify", t2)).toEqual({ ok: false, error: { from: "notified", event: "notify" } });
    expect(transition(pickedUp, "notify", t3)).toEqual({ ok: false, error: { from: "picked_up", event: "notify" } });
    expect(transition(pickedUp, "renotify", t3)).toEqual({ ok: false, error: { from: "picked_up", event: "renotify" } });
    expect(transition(pickedUp, "pickup", t3)).toEqual({ ok: false, error: { from: "picked_up", event: "pickup" } });
  });
});
