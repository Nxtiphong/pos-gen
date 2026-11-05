import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pos-gen-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "bills/tok_aaaaaaaaaaaaaaaaaaaaaa"), { orderId: "o1", orderNo: "A001", status: "preparing" });
    await setDoc(doc(db, "orders/o1"), { orderNo: "A001", publicToken: "tok_aaaaaaaaaaaaaaaaaaaaaa" });
    await setDoc(doc(db, "queues/2026-11-05"), { preparing: ["A001"] });
    await setDoc(doc(db, "counters/2026-11-05"), { next: 2 });
    await setDoc(doc(db, "products/p1"), { name: "หมูปิ้ง", price: 10 });
    await setDoc(doc(db, "categories/grill"), { name: "ปิ้งย่าง" });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const staff = () => env.authenticatedContext("staff-uid", { email: "staff@pos.local", staff: true }).firestore();
// Anyone can create an account with the public web API key; without the staff claim it must get nothing.
const stranger = () => env.authenticatedContext("stranger-uid", { email: "someone@example.com" }).firestore();

describe("anonymous customer", () => {
  it("can get a bill by its token", async () => {
    await assertSucceeds(getDoc(doc(anon(), "bills/tok_aaaaaaaaaaaaaaaaaaaaaa")));
  });

  it("can get a missing bill id and learn it does not exist", async () => {
    await assertSucceeds(getDoc(doc(anon(), "bills/nope_nope_nope_nope_nope")));
  });

  it("cannot list bills", async () => {
    await assertFails(getDocs(collection(anon(), "bills")));
  });

  it("cannot write bills", async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, "bills/tok_new_new_new_new_new_new"), { orderNo: "A999" }));
    await assertFails(updateDoc(doc(db, "bills/tok_aaaaaaaaaaaaaaaaaaaaaa"), { scannedAt: new Date() }));
    await assertFails(deleteDoc(doc(db, "bills/tok_aaaaaaaaaaaaaaaaaaaaaa")));
  });

  it("can get today's queue but not list or write queues", async () => {
    const db = anon();
    await assertSucceeds(getDoc(doc(db, "queues/2026-11-05")));
    await assertFails(getDocs(collection(db, "queues")));
    await assertFails(setDoc(doc(db, "queues/2026-11-05"), { preparing: [] }));
  });

  it("cannot read or write orders", async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, "orders/o1")));
    await assertFails(getDocs(collection(db, "orders")));
    await assertFails(setDoc(doc(db, "orders/o2"), { orderNo: "A002" }));
  });

  it("cannot read counters, products or categories", async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, "counters/2026-11-05")));
    await assertFails(getDoc(doc(db, "products/p1")));
    await assertFails(getDocs(collection(db, "categories")));
  });

  it("cannot read or write push subscriptions, even as staff, because only the server sends pushes", async () => {
    for (const db of [anon(), staff()]) {
      await assertFails(getDoc(doc(db, "pushSubscriptions/tok_aaaaaaaaaaaaaaaaaaaaaa")));
      await assertFails(setDoc(doc(db, "pushSubscriptions/tok_aaaaaaaaaaaaaaaaaaaaaa"), { subscription: {} }));
    }
  });

  it("cannot touch collections the architecture does not name", async () => {
    await assertFails(setDoc(doc(anon(), "anything/x"), { a: 1 }));
  });
});

describe("signed-in staff", () => {
  it("can read and write every staff collection", async () => {
    const db = staff();
    for (const path of ["categories/grill", "products/p1", "counters/2026-11-05", "orders/o1", "bills/tok_aaaaaaaaaaaaaaaaaaaaaa", "queues/2026-11-05"]) {
      await assertSucceeds(getDoc(doc(db, path)));
      await assertSucceeds(setDoc(doc(db, path), { touched: true }, { merge: true }));
    }
    await assertSucceeds(getDocs(collection(db, "orders")));
    await assertSucceeds(getDocs(collection(db, "bills")));
    await assertSucceeds(deleteDoc(doc(db, "products/p1")));
  });

  it("cannot touch collections the architecture does not name", async () => {
    await assertFails(setDoc(doc(staff(), "anything/x"), { a: 1 }));
  });
});

describe("signed-in user without the staff claim", () => {
  it("cannot read orders", async () => {
    const db = stranger();
    await assertFails(getDoc(doc(db, "orders/o1")));
    await assertFails(getDocs(collection(db, "orders")));
  });

  it("cannot write orders, products or bills", async () => {
    const db = stranger();
    await assertFails(setDoc(doc(db, "orders/o2"), { orderNo: "A002" }));
    await assertFails(updateDoc(doc(db, "orders/o1"), { status: "picked_up" }));
    await assertFails(setDoc(doc(db, "products/p2"), { name: "ไส้อั่ว", price: 15 }));
    await assertFails(updateDoc(doc(db, "products/p1"), { isAvailable: false }));
    await assertFails(setDoc(doc(db, "bills/tok_new_new_new_new_new_new"), { orderNo: "A999" }));
    await assertFails(updateDoc(doc(db, "bills/tok_aaaaaaaaaaaaaaaaaaaaaa"), { status: "notified" }));
  });

  it("cannot read the counter, catalog or list bills", async () => {
    const db = stranger();
    await assertFails(getDoc(doc(db, "counters/2026-11-05")));
    await assertFails(getDocs(collection(db, "products")));
    await assertFails(getDocs(collection(db, "categories")));
    await assertFails(getDocs(collection(db, "bills")));
  });

  it("can still get a bill and the queue by id, like any customer", async () => {
    const db = stranger();
    await assertSucceeds(getDoc(doc(db, "bills/tok_aaaaaaaaaaaaaaaaaaaaaa")));
    await assertSucceeds(getDoc(doc(db, "queues/2026-11-05")));
  });

  it("a staff claim other than true is not staff", async () => {
    const db = env.authenticatedContext("odd-uid", { staff: "true" }).firestore();
    await assertFails(getDoc(doc(db, "orders/o1")));
  });
});
