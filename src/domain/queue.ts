import type { Baht } from "./money";

export type QueueStatus = "preparing" | "notified" | "picked_up";

export type QueueLine = {
  name: string;
  qty: number;
  price: Baht;
};

export type QueueOrder = {
  id: string;
  orderNo: string;
  createdAt: Date;
  lines: readonly QueueLine[];
  itemCount: number;
  total: Baht;
  status: QueueStatus;
  scannedAt?: Date;
  notifiedAt?: Date;
  notifyCount: number;
  pickedUpAt?: Date;
};

export type QueueEvent = "notify" | "renotify" | "pickup";

export type QueueTransitionError = {
  kind: "illegal_transition";
  orderNo: string;
  from: QueueStatus;
  event: QueueEvent;
};

export type QueueTransitionResult = { ok: true; order: QueueOrder } | { ok: false; error: QueueTransitionError };

const notify = (order: QueueOrder, now: Date): QueueOrder => ({
  ...order,
  status: "notified",
  notifiedAt: now,
  notifyCount: order.notifyCount + 1,
});

const TRANSITIONS: Record<QueueStatus, Partial<Record<QueueEvent, (order: QueueOrder, now: Date) => QueueOrder>>> = {
  preparing: { notify },
  notified: {
    renotify: notify,
    pickup: (order, now) => ({ ...order, status: "picked_up", pickedUpAt: now }),
  },
  picked_up: {},
};

export function applyQueueEvent(order: QueueOrder, event: QueueEvent, now: Date): QueueTransitionResult {
  const transition = TRANSITIONS[order.status][event];
  if (!transition) {
    return { ok: false, error: { kind: "illegal_transition", orderNo: order.orderNo, from: order.status, event } };
  }
  return { ok: true, order: transition(order, now) };
}

export function queueTabs(orders: readonly QueueOrder[]): Record<QueueStatus, number> {
  const counts: Record<QueueStatus, number> = { preparing: 0, notified: 0, picked_up: 0 };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

const time = (date: Date | undefined) => date?.getTime() ?? 0;

const ORDERING: Record<QueueStatus, (a: QueueOrder, b: QueueOrder) => number> = {
  preparing: (a, b) => time(a.createdAt) - time(b.createdAt),
  notified: (a, b) => time(b.notifiedAt) - time(a.notifiedAt),
  picked_up: (a, b) => time(b.pickedUpAt) - time(a.pickedUpAt),
};

export function ordersForTab(orders: readonly QueueOrder[], status: QueueStatus): QueueOrder[] {
  return orders.filter((order) => order.status === status).sort(ORDERING[status]);
}

export function itemsSummary(lines: readonly QueueLine[]): string {
  return lines.map((line) => `${line.name} × ${line.qty}`).join(" · ");
}
