import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { CatalogProvider } from "@/lib/catalog";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>{children}</CartProvider>
    </CatalogProvider>
  );
}
