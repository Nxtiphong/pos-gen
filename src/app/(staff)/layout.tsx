import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { CatalogProvider } from "@/lib/catalog";
import { StaffGuard } from "./staff-guard";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffGuard>
      <CatalogProvider>
        <CartProvider>{children}</CartProvider>
      </CatalogProvider>
    </StaffGuard>
  );
}
