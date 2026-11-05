import { SEED_CATEGORIES, SEED_PRODUCTS, type Category, type Product } from "@/domain/catalog";

export type Catalog = {
  categories: readonly Category[];
  products: readonly Product[];
};

const SEED_CATALOG: Catalog = { categories: SEED_CATEGORIES, products: SEED_PRODUCTS };

export function useCatalog(): Catalog {
  return SEED_CATALOG;
}
