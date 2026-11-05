import { baht, type Baht } from "./money";

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type CashKey = Digit | "00" | "back";

const MAX_DIGITS = 6;

export function pressKey(entry: string, key: CashKey): string {
  if (key === "back") return entry.slice(0, -1);
  const next = (entry === "0" ? "" : entry) + key;
  if (next.length > MAX_DIGITS || next === "00") return entry;
  return String(parseInt(next, 10));
}

export function receivedAmount(entry: string): Baht {
  return baht(entry === "" ? 0 : parseInt(entry, 10));
}

export type Settlement =
  | { kind: "enough"; change: Baht }
  | { kind: "short"; missing: Baht };

export function settle(total: Baht, entry: string): Settlement {
  const diff = receivedAmount(entry) - total;
  return diff >= 0
    ? { kind: "enough", change: baht(diff) }
    : { kind: "short", missing: baht(-diff) };
}
