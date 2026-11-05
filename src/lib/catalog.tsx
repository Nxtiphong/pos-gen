"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  type Category,
  type CategoryId,
  type Product,
  type ProductId,
} from "@/domain/catalog";
import type { ProductDraft } from "@/domain/product-draft";

export type Catalog = {
  categories: readonly Category[];
  products: readonly Product[];
};

export type CatalogActions = {
  addProduct(draft: ProductDraft, image?: File): Promise<Product>;
  setAvailable(id: ProductId, isAvailable: boolean): Promise<void>;
  addCategory(name: string): Promise<Category>;
};

const CatalogContext = createContext<Catalog | null>(null);
const ActionsContext = createContext<CatalogActions | null>(null);

const nextSortOrder = (items: readonly { sortOrder: number }[]) =>
  items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;

// Firestore seam: this provider is the only place that knows where the catalog lives.
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<readonly Category[]>(SEED_CATEGORIES);
  const [products, setProducts] = useState<readonly Product[]>(SEED_PRODUCTS);

  const catalog = useMemo(() => ({ categories, products }), [categories, products]);

  const actions = useMemo<CatalogActions>(() => {
    const addCategory = async (name: string) => {
      const id = crypto.randomUUID() as CategoryId;
      const created: Category = { id, name, sortOrder: 0 };
      setCategories((prev) => [...prev, { ...created, sortOrder: nextSortOrder(prev) }]);
      return created;
    };
    return {
      addCategory,
      async addProduct(draft, image) {
        const categoryId =
          draft.category.kind === "existing" ? draft.category.id : (await addCategory(draft.category.name)).id;
        const id = crypto.randomUUID() as ProductId;
        const created: Product = {
          id,
          name: draft.name,
          price: draft.price,
          unit: draft.unit,
          categoryId,
          imageUrl: image ? URL.createObjectURL(image) : undefined,
          isAvailable: true,
          sortOrder: 0,
        };
        setProducts((prev) => [...prev, { ...created, sortOrder: nextSortOrder(prev) }]);
        return created;
      },
      async setAvailable(id, isAvailable) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable } : p)));
      },
    };
  }, []);

  return (
    <CatalogContext.Provider value={catalog}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </CatalogContext.Provider>
  );
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}

export function useCatalogActions(): CatalogActions {
  const value = useContext(ActionsContext);
  if (!value) throw new Error("useCatalogActions must be used inside CatalogProvider");
  return value;
}
