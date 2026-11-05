import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, type Firestore } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ProductId } from "@/domain/catalog";
import { baht } from "@/domain/money";
import { createOrder, newOrderId } from "@/lib/orders";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pos-gen-create-order",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

// rules-unit-testing types its Firestore as the compat class; at runtime it is the modular instance.
const staffDb = () => env.authenticatedContext("staff-uid", { staff: true }).firestore() as unknown as Firestore;
const noon = new Date("2026-11-05T05:00:00Z");
const sale = {
  lines: [{ productId: "p1" as ProductId, name: "หมูปิ้ง", price: baht(10), qty: 4 }],
  total: baht(40),
  cashReceived: baht(100),
  change: baht(60),
};

describe("createOrder", () => {
  it("a second run with the same order id creates no second order and keeps the counter", async () => {
    const db = staffDb();
    const id = newOrderId(db);

    expect(await createOrder(db, id, sale, noon)).toBe(id);
    expect(await createOrder(db, id, sale, noon)).toBe(id);

    const orders = await getDocs(collection(db, "orders"));
    expect(orders.docs.map((d) => [d.id, d.get("orderNo")])).toEqual([[id, "A001"]]);
    expect((await getDoc(doc(db, "counters/2026-11-05"))).data()).toEqual({ next: 2 });
    expect((await getDoc(doc(db, "queues/2026-11-05"))).data()).toEqual({ preparing: ["A001"] });
    expect((await getDocs(collection(db, "bills"))).size).toBe(1);
  });

  it("a new order id takes the next number", async () => {
    const db = staffDb();
    await createOrder(db, newOrderId(db), sale, noon);
    const second = newOrderId(db);
    await createOrder(db, second, sale, noon);

    expect((await getDoc(doc(db, "orders", second))).get("orderNo")).toBe("A002");
    expect((await getDoc(doc(db, "counters/2026-11-05"))).data()).toEqual({ next: 3 });
    expect((await getDoc(doc(db, "queues/2026-11-05"))).data()).toEqual({ preparing: ["A001", "A002"] });
  });
});
