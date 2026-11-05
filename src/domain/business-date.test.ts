import { describe, expect, it } from "vitest";
import { businessDate, shiftDate, startOfBusinessDate, type BusinessDate } from "./business-date";

describe("businessDate", () => {
  it("uses the Bangkok calendar day, rolling over at 17:00 UTC", () => {
    expect(businessDate(new Date("2026-11-04T16:59:00Z"))).toBe("2026-11-04");
    expect(businessDate(new Date("2026-11-04T17:00:00Z"))).toBe("2026-11-05");
    expect(businessDate(new Date("2026-11-05T17:30:00Z"))).toBe("2026-11-06");
    expect(businessDate(new Date("2026-12-31T20:00:00Z"))).toBe("2027-01-01");
  });
});

describe("shiftDate", () => {
  it("crosses month and year boundaries", () => {
    expect(shiftDate("2026-11-01" as BusinessDate, -1)).toBe("2026-10-31");
    expect(shiftDate("2026-12-31" as BusinessDate, 1)).toBe("2027-01-01");
  });
});

describe("startOfBusinessDate", () => {
  it("is 17:00 UTC the day before", () => {
    expect(startOfBusinessDate("2026-11-05" as BusinessDate).toISOString()).toBe("2026-11-04T17:00:00.000Z");
  });
});
