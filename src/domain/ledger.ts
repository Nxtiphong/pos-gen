import type { Order, OrderStatus } from "./order";
import { itemsSummary } from "./queue";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "กำลังทำ",
  notified: "แจ้งแล้ว",
  picked_up: "รับแล้ว",
};

export type LedgerRow = {
  id: string;
  orderNo: string;
  createdAt: Date;
  items: string;
  itemCount: number;
  total: number;
  cashReceived: number;
  change: number;
  status: OrderStatus;
};

export type Ledger = {
  rows: LedgerRow[];
  totals: { itemCount: number; total: number; cashReceived: number; change: number };
};

export function ledger(orders: readonly Order[]): Ledger {
  const rows = [...orders]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      items: itemsSummary(o.lines),
      itemCount: o.itemCount,
      total: o.total,
      cashReceived: o.cashReceived,
      change: o.change,
      status: o.status,
    }));
  const sum = (pick: (r: LedgerRow) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
  return {
    rows,
    totals: {
      itemCount: sum((r) => r.itemCount),
      total: sum((r) => r.total),
      cashReceived: sum((r) => r.cashReceived),
      change: sum((r) => r.change),
    },
  };
}

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Excel opens UTF-8 CSV as Thai only when the file starts with a byte order mark.
export function ledgerCsv(data: Ledger, formatTime: (d: Date) => string): string {
  const header = ["เลขบิล", "เวลา", "รายการ", "จำนวนชิ้น", "ยอด", "รับเงิน", "เงินทอน", "สถานะ"];
  const lines = data.rows.map((r) =>
    [r.orderNo, formatTime(r.createdAt), r.items, r.itemCount, r.total, r.cashReceived, r.change, STATUS_LABEL[r.status]],
  );
  const { totals } = data;
  const footer = ["รวม", "", "", totals.itemCount, totals.total, totals.cashReceived, totals.change, ""];
  return "﻿" + [header, ...lines, footer].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
