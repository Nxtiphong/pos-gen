"use client";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { baht } from "@/domain/money";
import { businessDate, type BusinessDate } from "@/domain/business-date";
import {
  FIRST_ORDER_NUMBER,
  formatOrderNo,
  newPublicToken,
  type Bill,
  type Order,
  type OrderId,
  type OrderLine,
  type OrderNo,
  type OrderProgress,
  type PublicToken,
} from "@/domain/order";
import { getDb } from "./firebase/client";
import type { Sale } from "./sale";

export function newOrderId(db: Firestore = getDb()): OrderId {
  return doc(collection(db, "orders")).id as OrderId;
}

// The caller keeps orderId across retries of one checkout, so a retry after a commit whose response was lost
// finds the order and returns it instead of taking a second order number.
export async function createOrder(db: Firestore, orderId: OrderId, sale: Sale, now: Date = new Date()): Promise<OrderId> {
  const date = businessDate(now);
  const counterRef = doc(db, "counters", date);
  const orderRef = doc(db, "orders", orderId);
  const publicToken = newPublicToken();

  await runTransaction(db, async (tx) => {
    if ((await tx.get(orderRef)).exists()) return;
    const counter = await tx.get(counterRef);
    const n: number = counter.get("next") ?? FIRST_ORDER_NUMBER;
    const orderNo = formatOrderNo(n);
    const receipt = {
      orderNo,
      businessDate: date,
      lines: sale.lines,
      total: sale.total,
      cashReceived: sale.cashReceived,
      change: sale.change,
      status: "preparing",
      notifyCount: 0,
      createdAt: serverTimestamp(),
    };
    tx.set(counterRef, { next: n + 1 });
    tx.set(orderRef, { ...receipt, publicToken, itemCount: sale.lines.reduce((sum, l) => sum + l.qty, 0) });
    tx.set(doc(db, "bills", publicToken), { ...receipt, orderId });
    tx.set(doc(db, "queues", date), { preparing: arrayUnion(orderNo) }, { merge: true });
  });

  return orderId;
}

export function useNextOrderNo(): OrderNo | null {
  const today = useToday();
  const [next, setNext] = useState<OrderNo | null>(null);
  useEffect(
    () =>
      onSnapshot(
        doc(getDb(), "counters", today),
        (snap) => setNext(formatOrderNo(snap.get("next") ?? FIRST_ORDER_NUMBER)),
        () => setNext(null),
      ),
    [today],
  );
  return next;
}

const TODAY_CHECK_MS = 30_000;

// Polls instead of one timer to midnight so an iPad that slept through midnight still rolls over on wake.
export function useToday(): BusinessDate {
  const [today, setToday] = useState(() => businessDate(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setToday(businessDate(new Date())), TODAY_CHECK_MS);
    return () => clearInterval(timer);
  }, []);
  return today;
}

export type OrdersOn = { status: "loading" | "ready" | "error"; orders: readonly Order[] };

export function useOrdersOn(date: BusinessDate): OrdersOn {
  const [result, setResult] = useState<OrdersOn & { date: BusinessDate | null }>({ date: null, status: "loading", orders: [] });
  useEffect(
    () =>
      onSnapshot(
        query(collection(getDb(), "orders"), where("businessDate", "==", date), orderBy("createdAt")),
        (snap) =>
          setResult({
            date,
            status: "ready",
            orders: snap.docs.map((d) => parseOrder(d.id, d.data({ serverTimestamps: "estimate" }))),
          }),
        () => setResult({ date, status: "error", orders: [] }),
      ),
    [date],
  );
  return result.date === date ? result : { status: "loading", orders: [] };
}

export type Loadable<T> = { state: "loading" } | { state: "missing" } | { state: "ready"; value: T };

function useDoc<T>(path: string | null, parse: (id: string, data: DocumentData) => T): Loadable<T> {
  const [result, setResult] = useState<Loadable<T>>({ state: "loading" });
  useEffect(() => {
    if (!path) return;
    return onSnapshot(
      doc(getDb(), path),
      (snap) => {
        const data = snap.data({ serverTimestamps: "estimate" });
        setResult(data ? { state: "ready", value: parse(snap.id, data) } : { state: "missing" });
      },
      () => setResult({ state: "missing" }),
    );
  }, [path, parse]);
  return result;
}

export function useOrder(orderId: string): Loadable<Order> {
  return useDoc(`orders/${orderId}`, parseOrder);
}

export function useBill(token: PublicToken): Loadable<Bill> {
  return useDoc(`bills/${token}`, parseBill);
}

export function usePreparingQueue(date: BusinessDate | null): readonly OrderNo[] {
  const queue = useDoc(date && `queues/${date}`, parseQueue);
  return queue.state === "ready" ? queue.value : [];
}

function parseQueue(_: string, data: DocumentData): readonly OrderNo[] {
  return (data.preparing ?? []) as OrderNo[];
}

function toDate(value: unknown): Date | undefined {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

function parseProgress(data: DocumentData): OrderProgress {
  const notifyCount: number = data.notifyCount ?? 0;
  const notifiedAt = toDate(data.notifiedAt);
  switch (data.status) {
    case "notified":
      return { status: "notified", notifyCount, notifiedAt: notifiedAt ?? new Date(0) };
    case "picked_up":
      return { status: "picked_up", notifyCount, ...(notifiedAt && { notifiedAt }), pickedUpAt: toDate(data.pickedUpAt) ?? new Date(0) };
    default:
      return { status: "preparing", notifyCount: 0 };
  }
}

function parseReceipt(data: DocumentData) {
  return {
    orderNo: data.orderNo as OrderNo,
    businessDate: data.businessDate as BusinessDate,
    lines: (data.lines as OrderLine[]).map((l) => ({ ...l, price: baht(l.price) })),
    total: baht(data.total),
    cashReceived: baht(data.cashReceived),
    change: baht(data.change),
    createdAt: toDate(data.createdAt) ?? new Date(),
    scannedAt: toDate(data.scannedAt),
    ...parseProgress(data),
  };
}

function parseOrder(id: string, data: DocumentData): Order {
  return {
    ...parseReceipt(data),
    id: id as OrderId,
    publicToken: data.publicToken as PublicToken,
    itemCount: data.itemCount as number,
  };
}

function parseBill(_: string, data: DocumentData): Bill {
  return { ...parseReceipt(data), orderId: data.orderId as OrderId };
}
