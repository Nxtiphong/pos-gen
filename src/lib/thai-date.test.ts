import { describe, expect, it } from "vitest";
import { formatClock } from "./thai-date";

describe("formatClock", () => {
  it("renders HH:MM in Asia/Bangkok regardless of the input offset", () => {
    expect(formatClock(new Date("2026-11-05T03:42:00Z"))).toBe("10:42");
    expect(formatClock(new Date("2026-11-04T17:05:00Z"))).toBe("00:05");
  });
});
