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

export type OrderStatus = "preparing" | "notified" | "picked_up" | "cancelled";

export type OrderProgress =
  | { status: "preparing"; notifyCount: 0 }
  | { status: "notified"; notifyCount: number; notifiedAt: Date }
  | { status: "picked_up"; notifyCount: number; notifiedAt?: Date; pickedUpAt: Date }
  | { status: "cancelled"; notifyCount: number; notifiedAt?: Date; pickedUpAt?: Date; cancelledAt: Date };

export type PaymentMethod = "cash" | "transfer";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = { cash: "เงินสด", transfer: "เงินโอน" };

type Receipt = {
  orderNo: OrderNo;
  paymentMethod: PaymentMethod;
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

export const isCounted = (order: { status: OrderStatus }) => order.status !== "cancelled";

export function queueAhead(preparing: readonly OrderNo[], orderNo: OrderNo): number {
  return Math.max(preparing.indexOf(orderNo), 0);
}

export type OrderEvent = "notify" | "renotify" | "pickup" | "cancel";

export type TransitionResult =
  | { ok: true; progress: OrderProgress }
  | { ok: false; error: { from: OrderStatus; event: OrderEvent } };

type Step<S extends OrderStatus> = (progress: Extract<OrderProgress, { status: S }>, now: Date) => OrderProgress;

const TRANSITIONS: { [S in OrderStatus]: Partial<Record<OrderEvent, Step<S>>> } = {
  preparing: {
    notify: (_, now) => ({ status: "notified", notifyCount: 1, notifiedAt: now }),
    pickup: (_, now) => ({ status: "picked_up", notifyCount: 0, pickedUpAt: now }),
    cancel: (_, now) => ({ status: "cancelled", notifyCount: 0, cancelledAt: now }),
  },
  notified: {
    renotify: (p, now) => ({ status: "notified", notifyCount: p.notifyCount + 1, notifiedAt: now }),
    pickup: (p, now) => ({ status: "picked_up", notifyCount: p.notifyCount, notifiedAt: p.notifiedAt, pickedUpAt: now }),
    cancel: (p, now) => ({ status: "cancelled", notifyCount: p.notifyCount, notifiedAt: p.notifiedAt, cancelledAt: now }),
  },
  // A wrong or refunded bill can still be voided after the customer left.
  picked_up: {
    cancel: (p, now) => ({ status: "cancelled", notifyCount: p.notifyCount, ...(p.notifiedAt && { notifiedAt: p.notifiedAt }), pickedUpAt: p.pickedUpAt, cancelledAt: now }),
  },
  cancelled: {},
};

export function transition(progress: OrderProgress, event: OrderEvent, now: Date): TransitionResult {
  const step = TRANSITIONS[progress.status][event] as Step<OrderStatus> | undefined;
  if (!step) return { ok: false, error: { from: progress.status, event } };
  return { ok: true, progress: step(progress, now) };
}
