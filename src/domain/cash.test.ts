import { describe, expect, it } from "vitest";
import { pressKey, receivedAmount, settle, type CashKey } from "./cash";
import { baht } from "./money";

const type = (keys: CashKey[], start = "") => keys.reduce(pressKey, start);

describe("pressKey", () => {
  it("appends digits", () => {
    expect(type(["1", "0", "0"])).toBe("100");
  });

  it("ignores 00 on an empty entry", () => {
    expect(pressKey("", "00")).toBe("");
  });

  it("appends 00 after a digit", () => {
    expect(type(["5", "00"])).toBe("500");
  });

  it("does not keep a leading zero", () => {
    expect(type(["0", "0", "7"])).toBe("7");
  });

  it("caps the entry at 6 digits", () => {
    expect(type(["1", "2", "3", "4", "5", "6", "7"])).toBe("123456");
    expect(pressKey("12345", "00")).toBe("12345");
  });

  it("back removes the last digit and stops at empty", () => {
    expect(pressKey("100", "back")).toBe("10");
    expect(type(["back", "back"], "1")).toBe("");
  });
});

describe("receivedAmount", () => {
  it("reads an empty entry as zero", () => {
    expect(receivedAmount("")).toBe(0);
    expect(receivedAmount("1000")).toBe(1000);
  });
});

describe("settle", () => {
  it("returns change when the cash covers the total", () => {
    expect(settle(baht(85), "100")).toEqual({ kind: "enough", change: 15 });
  });

  it("returns zero change for exact cash", () => {
    expect(settle(baht(85), "85")).toEqual({ kind: "enough", change: 0 });
  });

  it("returns the missing amount when short", () => {
    expect(settle(baht(85), "10")).toEqual({ kind: "short", missing: 75 });
    expect(settle(baht(85), "")).toEqual({ kind: "short", missing: 85 });
  });
});
