import { describe, expect, it } from "vitest";
import { formatBillDateTime, formatClock } from "./thai-date";

describe("formatClock", () => {
  it("renders HH:MM in Asia/Bangkok regardless of the input offset", () => {
    expect(formatClock(new Date("2026-11-05T03:42:00Z"))).toBe("10:42");
    expect(formatClock(new Date("2026-11-04T17:05:00Z"))).toBe("00:05");
  });
});

describe("formatBillDateTime", () => {
  it("prints the Bangkok date in the Thai calendar and a 24-hour time", () => {
    expect(formatBillDateTime(new Date("2026-11-05T03:42:00Z"))).toBe("5 พ.ย. 2569 · 10:42");
    expect(formatBillDateTime(new Date("2026-11-05T17:05:00Z"))).toBe("6 พ.ย. 2569 · 00:05");
  });
});
