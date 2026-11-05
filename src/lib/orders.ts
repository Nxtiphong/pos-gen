"use client";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { baht } from "@/domain/money";
import {
  businessDate,
  FIRST_ORDER_NUMBER,
  formatOrderNo,
  newPublicToken,
  type Bill,
  type BusinessDate,
  type Order,
  type OrderId,
  type OrderLine,
  type OrderNo,
  type OrderProgress,
  type PublicToken,
} from "@/domain/order";
import { getDb } from "./firebase/client";
import type { Sale } from "./sale";

export async function createOrder(sale: Sale, now: Date = new Date()): Promise<OrderId> {
  const db = getDb();
  const date = businessDate(now);
  const counterRef = doc(db, "counters", date);
  const orderRef = doc(collection(db, "orders"));
  const orderId = orderRef.id as OrderId;
  const publicToken = newPublicToken();

  await runTransaction(db, async (tx) => {
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
  const [next, setNext] = useState<OrderNo | null>(null);
  useEffect(
    () =>
      onSnapshot(
        doc(getDb(), "counters", businessDate(new Date())),
        (snap) => setNext(formatOrderNo(snap.get("next") ?? FIRST_ORDER_NUMBER)),
        () => setNext(null),
      ),
    [],
  );
  return next;
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
  const notifiedAt = toDate(data.notifiedAt) ?? new Date(0);
  switch (data.status) {
    case "notified":
      return { status: "notified", notifyCount, notifiedAt };
    case "picked_up":
      return { status: "picked_up", notifyCount, notifiedAt, pickedUpAt: toDate(data.pickedUpAt) ?? new Date(0) };
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
