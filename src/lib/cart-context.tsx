"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { cartReducer, EMPTY_CART, type Cart, type CartAction } from "@/domain/cart";

type CartStore = { cart: Cart; dispatch: Dispatch<CartAction> };

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  return <CartContext value={{ cart, dispatch }}>{children}</CartContext>;
}

export function useCart(): CartStore {
  const store = useContext(CartContext);
  if (!store) throw new Error("useCart must be used inside CartProvider");
  return store;
}
