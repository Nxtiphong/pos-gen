import { describe, expect, it } from "vitest";
import { SEED_PRODUCTS, type ProductId } from "./catalog";
import { cartCount, cartLines, cartReducer, cartTotal, EMPTY_CART, type Cart, type CartAction } from "./cart";

const id = (raw: string) => raw as ProductId;

function run(actions: CartAction[], start: Cart = EMPTY_CART): Cart {
  return actions.reduce(cartReducer, start);
}

const add = (raw: string): CartAction => ({ type: "add", productId: id(raw) });

describe("cartReducer", () => {
  it("add counts taps per product", () => {
    const cart = run([add("p1"), add("p1"), add("p7")]);
    expect([...cart]).toEqual([
      ["p1", 2],
      ["p7", 1],
    ]);
  });

  it("inc and dec move the quantity by one", () => {
    const cart = run([add("p1"), { type: "inc", productId: id("p1") }, { type: "inc", productId: id("p1") }, { type: "dec", productId: id("p1") }]);
    expect(cart.get(id("p1"))).toBe(2);
  });

  it("dec to zero removes the line", () => {
    const cart = run([add("p1"), add("p7"), { type: "dec", productId: id("p1") }]);
    expect([...cart]).toEqual([["p7", 1]]);
  });

  it("dec on a product not in the cart leaves the cart unchanged", () => {
    const cart = run([add("p7"), { type: "dec", productId: id("p1") }]);
    expect([...cart]).toEqual([["p7", 1]]);
  });

  it("clear empties the cart", () => {
    const cart = run([add("p1"), add("p7"), { type: "clear" }]);
    expect(cart.size).toBe(0);
  });

  it("does not mutate the previous cart", () => {
    const before = run([add("p1")]);
    cartReducer(before, add("p1"));
    expect(before.get(id("p1"))).toBe(1);
  });
});

describe("cart selectors", () => {
  const cart = run([add("p10"), add("p1"), add("p1"), add("p1"), add("p1"), add("p7"), add("p7")]);
  const lines = cartLines(cart, SEED_PRODUCTS);

  it("lists lines in catalog order with line totals", () => {
    expect(lines.map((l) => [l.product.name, l.qty, l.lineTotal])).toEqual([
      ["หมูปิ้ง", 4, 40],
      ["ข้าวเหนียว", 2, 20],
      ["ชาเย็น", 1, 25],
    ]);
  });

  it("counts items and totals the bill", () => {
    expect(cartCount(lines)).toBe(7);
    expect(cartTotal(lines)).toBe(85);
  });

  it("an empty cart has no lines and a zero total", () => {
    const empty = cartLines(EMPTY_CART, SEED_PRODUCTS);
    expect(empty).toEqual([]);
    expect(cartCount(empty)).toBe(0);
    expect(cartTotal(empty)).toBe(0);
  });
});
