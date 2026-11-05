import { describe, expect, it } from "vitest";
import { bangkokDate, shiftDate, startOfBusinessDate } from "./business-date";

describe("bangkokDate", () => {
  it("rolls to the next day at 17:00 UTC", () => {
    expect(bangkokDate(new Date("2026-11-04T16:59:00Z"))).toBe("2026-11-04");
    expect(bangkokDate(new Date("2026-11-04T17:00:00Z"))).toBe("2026-11-05");
  });
});

describe("shiftDate", () => {
  it("crosses month and year boundaries", () => {
    expect(shiftDate("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("startOfBusinessDate", () => {
  it("is 17:00 UTC the day before", () => {
    expect(startOfBusinessDate("2026-11-05").toISOString()).toBe("2026-11-04T17:00:00.000Z");
  });
});
