import type { Product, ProductId } from "./catalog";
import { baht, type Baht } from "./money";

export type Cart = ReadonlyMap<ProductId, number>;

export const EMPTY_CART: Cart = new Map();

export type CartAction =
  | { type: "add"; productId: ProductId }
  | { type: "inc"; productId: ProductId }
  | { type: "dec"; productId: ProductId }
  | { type: "clear" };

export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "add":
    case "inc":
      return withQty(cart, action.productId, (cart.get(action.productId) ?? 0) + 1);
    case "dec":
      return withQty(cart, action.productId, (cart.get(action.productId) ?? 0) - 1);
    case "clear":
      return EMPTY_CART;
  }
}

function withQty(cart: Cart, productId: ProductId, qty: number): Cart {
  const next = new Map(cart);
  if (qty > 0) next.set(productId, qty);
  else next.delete(productId);
  return next;
}

export type CartLine = {
  product: Product;
  qty: number;
  lineTotal: Baht;
};

export function cartLines(cart: Cart, products: readonly Product[]): CartLine[] {
  return products.flatMap((product) => {
    const qty = cart.get(product.id);
    return qty ? [{ product, qty, lineTotal: baht(product.price * qty) }] : [];
  });
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function cartTotal(lines: readonly CartLine[]): Baht {
  return baht(lines.reduce((sum, line) => sum + line.lineTotal, 0));
}
