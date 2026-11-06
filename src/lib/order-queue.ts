"use client";

import { arrayRemove, doc, writeBatch } from "firebase/firestore";
import { transition, type Order, type OrderEvent } from "@/domain/order";
import { getStaffAuth } from "./firebase/auth";
import { getDb } from "./firebase/client";
import { useOrdersOn, useToday, type OrdersOn } from "./orders";

export type OrderQueue = OrdersOn & {
  notify: (order: Order) => Promise<void>;
  renotify: (order: Order) => Promise<void>;
  pickup: (order: Order) => Promise<void>;
  cancel: (order: Order) => Promise<void>;
};

async function apply(order: Order, event: OrderEvent): Promise<void> {
  const result = transition(order, event, new Date());
  if (!result.ok) throw new Error(`${event} not allowed from ${result.error.from} (${order.orderNo})`);
  const db = getDb();
  const batch = writeBatch(db);
  batch.update(doc(db, "orders", order.id), result.progress);
  batch.update(doc(db, "bills", order.publicToken), result.progress);
  batch.set(doc(db, "queues", order.businessDate), { preparing: arrayRemove(order.orderNo) }, { merge: true });
  await batch.commit();
  if (result.progress.status === "notified") void pushReady(order);
}

// The in-page alert covers customers with the bill open; the push reaches phones whose screen is off.
async function pushReady(order: Order): Promise<void> {
  const idToken = await getStaffAuth().currentUser?.getIdToken();
  if (!idToken) return;
  await fetch(`/api/orders/${order.id}/push`, { method: "POST", headers: { Authorization: `Bearer ${idToken}` } }).catch(() => {});
}

const actions = {
  notify: (order: Order) => apply(order, "notify"),
  renotify: (order: Order) => apply(order, "renotify"),
  pickup: (order: Order) => apply(order, "pickup"),
  cancel: (order: Order) => apply(order, "cancel"),
};

export function useOrderQueue(): OrderQueue {
  return { ...useOrdersOn(useToday()), ...actions };
}
