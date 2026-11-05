import type { BusinessDate } from "./business-date";
import type { ProductId } from "./catalog";
import type { Baht } from "./money";

export type OrderId = string & { readonly __brand: "OrderId" };
export type OrderNo = string & { readonly __brand: "OrderNo" };
export type PublicToken = string & { readonly __brand: "PublicToken" };

export type OrderLine = {
  productId: ProductId;
  name: string;
  price: Baht;
  qty: number;
};

export type OrderStatus = "preparing" | "notified" | "picked_up";

export type OrderProgress =
  | { status: "preparing"; notifyCount: 0 }
  | { status: "notified"; notifyCount: number; notifiedAt: Date }
  | { status: "picked_up"; notifyCount: number; notifiedAt?: Date; pickedUpAt: Date };

type Receipt = {
  orderNo: OrderNo;
  businessDate: BusinessDate;
  lines: readonly OrderLine[];
  total: Baht;
  cashReceived: Baht;
  change: Baht;
  createdAt: Date;
  scannedAt?: Date;
};

export type Order = Receipt & OrderProgress & { id: OrderId; publicToken: PublicToken; itemCount: number };

export type Bill = Receipt & OrderProgress & { orderId: OrderId };

export const FIRST_ORDER_NUMBER = 1;

export function formatOrderNo(n: number): OrderNo {
  return ("A" + String(n).padStart(3, "0")) as OrderNo;
}

const TOKEN_BYTES = 18;

export function newPublicToken(): PublicToken {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_") as PublicToken;
}

export function isPublicToken(raw: string): raw is PublicToken {
  return /^[A-Za-z0-9_-]{22,}$/.test(raw);
}

export function queueAhead(preparing: readonly OrderNo[], orderNo: OrderNo): number {
  return Math.max(preparing.indexOf(orderNo), 0);
}

export type OrderEvent = "notify" | "renotify" | "pickup";

export type TransitionResult =
  | { ok: true; progress: OrderProgress }
  | { ok: false; error: { from: OrderStatus; event: OrderEvent } };

type Step<S extends OrderStatus> = (progress: Extract<OrderProgress, { status: S }>, now: Date) => OrderProgress;

const TRANSITIONS: { [S in OrderStatus]: Partial<Record<OrderEvent, Step<S>>> } = {
  preparing: {
    notify: (_, now) => ({ status: "notified", notifyCount: 1, notifiedAt: now }),
    pickup: (_, now) => ({ status: "picked_up", notifyCount: 0, pickedUpAt: now }),
  },
  notified: {
    renotify: (p, now) => ({ status: "notified", notifyCount: p.notifyCount + 1, notifiedAt: now }),
    pickup: (p, now) => ({ status: "picked_up", notifyCount: p.notifyCount, notifiedAt: p.notifiedAt, pickedUpAt: now }),
  },
  picked_up: {},
};

export function transition(progress: OrderProgress, event: OrderEvent, now: Date): TransitionResult {
  const step = TRANSITIONS[progress.status][event] as Step<OrderStatus> | undefined;
  if (!step) return { ok: false, error: { from: progress.status, event } };
  return { ok: true, progress: step(progress, now) };
}
