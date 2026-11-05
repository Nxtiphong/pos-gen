import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ProductId } from "@/domain/catalog";
import type { Baht } from "@/domain/money";
import { useCart } from "./cart-context";

export type SaleLine = {
  productId: ProductId;
  name: string;
  price: Baht;
  qty: number;
};

export type Sale = {
  lines: readonly SaleLine[];
  total: Baht;
  cashReceived: Baht;
  change: Baht;
};

export type CompleteSale = (sale: Sale) => void;

export function useCompleteSale(): CompleteSale {
  const { dispatch } = useCart();
  const router = useRouter();
  return useCallback(() => {
    router.replace("/sell");
    dispatch({ type: "clear" });
  }, [dispatch, router]);
}
