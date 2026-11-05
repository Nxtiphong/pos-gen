"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Category, CategoryId, Product, ProductId } from "@/domain/catalog";
import { baht } from "@/domain/money";
import type { ProductDraft } from "@/domain/product-draft";
import { getDb, getStorageClient } from "./firebase/client";

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

function parseCategory(id: string, data: DocumentData): Category {
  return { id: id as CategoryId, name: data.name, sortOrder: data.sortOrder };
}

function parseProduct(id: string, data: DocumentData): Product {
  return {
    id: id as ProductId,
    name: data.name,
    price: baht(data.price),
    unit: data.unit,
    categoryId: data.categoryId as CategoryId,
    imageUrl: data.imageUrl,
    isAvailable: data.isAvailable,
    sortOrder: data.sortOrder,
  };
}

function useSorted<T>(name: string, parse: (id: string, data: DocumentData) => T): readonly T[] {
  const [items, setItems] = useState<readonly T[]>([]);
  useEffect(
    () =>
      onSnapshot(query(collection(getDb(), name), orderBy("sortOrder")), (snap) =>
        setItems(snap.docs.map((d) => parse(d.id, d.data()))),
      ),
    [name, parse],
  );
  return items;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const categories = useSorted("categories", parseCategory);
  const products = useSorted("products", parseProduct);
  const catalog = useMemo(() => ({ categories, products }), [categories, products]);

  // Actions read the latest snapshot for sortOrder without being rebuilt on every snapshot.
  const latest = useRef(catalog);
  useEffect(() => {
    latest.current = catalog;
  }, [catalog]);

  const actions = useMemo<CatalogActions>(() => {
    const addCategory = async (name: string) => {
      const ref = doc(collection(getDb(), "categories"));
      const category: Category = { id: ref.id as CategoryId, name, sortOrder: nextSortOrder(latest.current.categories) };
      await setDoc(ref, { name, sortOrder: category.sortOrder });
      return category;
    };
    return {
      addCategory,
      async addProduct(draft, image) {
        const categoryId =
          draft.category.kind === "existing" ? draft.category.id : (await addCategory(draft.category.name)).id;
        const productRef = doc(collection(getDb(), "products"));
        let imageUrl: string | undefined;
        if (image) {
          const uploaded = await uploadBytes(ref(getStorageClient(), `products/${productRef.id}/${image.name}`), image, {
            contentType: image.type,
          });
          imageUrl = await getDownloadURL(uploaded.ref);
        }
        const fields = {
          name: draft.name,
          price: draft.price,
          unit: draft.unit,
          categoryId,
          isAvailable: true,
          sortOrder: nextSortOrder(latest.current.products),
          ...(imageUrl ? { imageUrl } : {}),
        };
        await setDoc(productRef, fields);
        return { id: productRef.id as ProductId, ...fields };
      },
      async setAvailable(id, isAvailable) {
        await updateDoc(doc(getDb(), "products", id), { isAvailable });
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
