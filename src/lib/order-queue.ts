"use client";

import { useSyncExternalStore } from "react";
import { baht } from "@/domain/money";
import { applyQueueEvent, type QueueEvent, type QueueLine, type QueueOrder } from "@/domain/queue";

export type OrderQueue = {
  orders: readonly QueueOrder[];
  notify: (id: string) => Promise<void>;
  renotify: (id: string) => Promise<void>;
  pickup: (id: string) => Promise<void>;
};

const PRICES: Record<string, number> = {
  หมูปิ้ง: 10,
  ไก่ปิ้ง: 25,
  ลูกชิ้นปิ้ง: 10,
  ไส้กรอกอีสาน: 10,
  ไก่ทอด: 20,
  หนังไก่ทอด: 20,
  ข้าวเหนียว: 10,
  ข้าวเหนียวหมูทอด: 35,
  น้ำเปล่า: 10,
  ชาเย็น: 25,
  โอเลี้ยง: 20,
};

const bangkokToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const today = (hhmm: string) => new Date(`${bangkokToday}T${hhmm}:00+07:00`);

type Seed = {
  orderNo: string;
  created: string;
  items: [string, number][];
  scanned: boolean;
  notified?: string;
  pickedUp?: string;
};

function seedOrder({ orderNo, created, items, scanned, notified, pickedUp }: Seed): QueueOrder {
  const lines: QueueLine[] = items.map(([name, qty]) => ({ name, qty, price: baht(PRICES[name]) }));
  const createdAt = today(created);
  return {
    id: orderNo.toLowerCase(),
    orderNo,
    createdAt,
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
    total: baht(lines.reduce((sum, l) => sum + l.qty * l.price, 0)),
    status: pickedUp ? "picked_up" : notified ? "notified" : "preparing",
    scannedAt: scanned ? new Date(createdAt.getTime() + 60_000) : undefined,
    notifiedAt: notified ? today(notified) : undefined,
    notifyCount: notified ? 1 : 0,
    pickedUpAt: pickedUp ? today(pickedUp) : undefined,
  };
}

const SEED: readonly QueueOrder[] = (
  [
    { orderNo: "A023", created: "10:42", items: [["หมูปิ้ง", 4], ["ข้าวเหนียว", 2], ["ชาเย็น", 1]], scanned: true },
    { orderNo: "A022", created: "10:40", items: [["ไก่ทอด", 2], ["ข้าวเหนียว", 1]], scanned: true },
    { orderNo: "A021", created: "10:38", items: [["ข้าวเหนียวหมูทอด", 1], ["โอเลี้ยง", 1]], scanned: false },
    { orderNo: "A020", created: "10:35", items: [["ลูกชิ้นปิ้ง", 5], ["น้ำเปล่า", 1]], scanned: true },
    { orderNo: "A019", created: "10:31", items: [["ไก่ปิ้ง", 2], ["ข้าวเหนียว", 2]], scanned: true, notified: "10:36" },
    { orderNo: "A018", created: "10:27", items: [["หมูปิ้ง", 6], ["ข้าวเหนียว", 3]], scanned: true, notified: "10:30", pickedUp: "10:33" },
    { orderNo: "A017", created: "10:22", items: [["ชาเย็น", 2], ["หนังไก่ทอด", 1]], scanned: false, notified: "10:25", pickedUp: "10:26" },
    { orderNo: "A016", created: "10:18", items: [["ไส้กรอกอีสาน", 4], ["ข้าวเหนียว", 1]], scanned: true, notified: "10:22", pickedUp: "10:24" },
  ] satisfies Seed[]
).map(seedOrder);

let orders: readonly QueueOrder[] = SEED;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function dispatch(id: string, event: QueueEvent): Promise<void> {
  const current = orders.find((o) => o.id === id);
  if (!current) throw new Error(`order ${id} not found`);
  const result = applyQueueEvent(current, event, new Date());
  if (!result.ok) throw new Error(`${result.error.event} not allowed from ${result.error.from} (${result.error.orderNo})`);
  orders = orders.map((o) => (o.id === id ? result.order : o));
  listeners.forEach((listener) => listener());
}

const actions = {
  notify: (id: string) => dispatch(id, "notify"),
  renotify: (id: string) => dispatch(id, "renotify"),
  pickup: (id: string) => dispatch(id, "pickup"),
};

export function useOrderQueue(): OrderQueue {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => orders,
    () => SEED,
  );
  return { orders: snapshot, ...actions };
}
