import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { Baht } from "@/domain/money";
import type { OrderLine } from "@/domain/order";
import { useCart } from "./cart-context";
import { createOrder } from "./orders";

export type Sale = {
  lines: readonly OrderLine[];
  total: Baht;
  cashReceived: Baht;
  change: Baht;
};

export type SaleStatus = "idle" | "saving" | "failed" | "done";

export type CompleteSale = {
  status: SaleStatus;
  complete: (sale: Sale) => void;
};

export function useCompleteSale(): CompleteSale {
  const { dispatch } = useCart();
  const router = useRouter();
  const [status, setStatus] = useState<SaleStatus>("idle");
  const inFlight = useRef(false);

  const complete = useCallback(
    async (sale: Sale) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setStatus("saving");
      try {
        const orderId = await createOrder(sale);
        setStatus("done");
        router.replace(`/sell/paid/${orderId}`);
        dispatch({ type: "clear" });
      } catch {
        inFlight.current = false;
        setStatus("failed");
      }
    },
    [dispatch, router],
  );

  return { status, complete };
}
