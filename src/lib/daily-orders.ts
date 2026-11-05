"use client";

import { useEffect, useState } from "react";
import { bangkokDate, shiftDate, startOfBusinessDate } from "@/domain/business-date";
import { SEED_PRODUCTS } from "@/domain/catalog";
import type { SummaryOrder } from "@/domain/summary";

type DailyOrders = { status: "loading" | "ready" | "error"; orders: SummaryOrder[] };

const SALES_START_MINUTE = 7 * 60;
const SALES_SPAN_MINUTES = 450;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function orderCountFor(businessDate: string, today: string): number {
  if (businessDate === today) return 40;
  if (businessDate === shiftDate(today, -1)) return 15;
  return 0;
}

export function fixtureOrders(businessDate: string, today: string): SummaryOrder[] {
  const count = orderCountFor(businessDate, today);
  const rand = mulberry32(Number(businessDate.replaceAll("-", "")));
  const dayStart = startOfBusinessDate(businessDate).getTime();
  const slot = SALES_SPAN_MINUTES / Math.max(count, 1);
  return Array.from({ length: count }, (_, i) => {
    const minute = SALES_START_MINUTE + Math.floor(i * slot + rand() * slot);
    const lineCount = 1 + Math.floor(rand() * 3) + (minute < 9 * 60 ? 1 : 0);
    const picked = new Set<number>();
    while (picked.size < Math.min(lineCount, SEED_PRODUCTS.length)) picked.add(Math.floor(rand() ** 1.6 * SEED_PRODUCTS.length));
    const lines = [...picked].map((index) => {
      const product = SEED_PRODUCTS[index];
      return { productId: product.id, name: product.name, price: product.price, qty: 1 + Math.floor(rand() * (product.price <= 10 ? 5 : 2)) };
    });
    return {
      createdAt: new Date(dayStart + minute * 60_000),
      lines,
      total: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
      itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
    };
  });
}

// Firestore seam: replace the body with a query of orders where businessDate == businessDate.
export function useDailyOrders(businessDate: string): DailyOrders {
  const [loaded, setLoaded] = useState<{ date: string; orders: SummaryOrder[] } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded({ date: businessDate, orders: fixtureOrders(businessDate, bangkokDate(new Date())) });
    }, 150);
    return () => clearTimeout(timer);
  }, [businessDate]);

  if (loaded?.date !== businessDate) return { status: "loading", orders: [] };
  return { status: "ready", orders: loaded.orders };
}
