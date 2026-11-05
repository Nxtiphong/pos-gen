import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
