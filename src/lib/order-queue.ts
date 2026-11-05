"use client";

import { arrayRemove, doc, writeBatch } from "firebase/firestore";
import { transition, type Order, type OrderEvent } from "@/domain/order";
import { getDb } from "./firebase/client";
import { useOrdersOn, useToday, type OrdersOn } from "./orders";

export type OrderQueue = OrdersOn & {
  notify: (order: Order) => Promise<void>;
  renotify: (order: Order) => Promise<void>;
  pickup: (order: Order) => Promise<void>;
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
}

const actions = {
  notify: (order: Order) => apply(order, "notify"),
  renotify: (order: Order) => apply(order, "renotify"),
  pickup: (order: Order) => apply(order, "pickup"),
};

export function useOrderQueue(): OrderQueue {
  return { ...useOrdersOn(useToday()), ...actions };
}
