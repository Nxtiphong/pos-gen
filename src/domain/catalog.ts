import { baht, type Baht } from "./money";

export type CategoryId = string & { readonly __brand: "CategoryId" };
export type ProductId = string & { readonly __brand: "ProductId" };

export type Category = {
  id: CategoryId;
  name: string;
  sortOrder: number;
};

export type Product = {
  id: ProductId;
  name: string;
  price: Baht;
  unit: string;
  categoryId: CategoryId;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
};

const category = (id: string, name: string, sortOrder: number): Category => ({
  id: id as CategoryId,
  name,
  sortOrder,
});

export const SEED_CATEGORIES: readonly Category[] = [
  category("grill", "ปิ้งย่าง", 1),
  category("fried", "ของทอด", 2),
  category("rice", "ข้าว", 3),
  category("drink", "เครื่องดื่ม", 4),
];

const product = (
  id: string,
  name: string,
  price: number,
  categoryId: string,
  unit: string,
  sortOrder: number,
): Product => ({
  id: id as ProductId,
  name,
  price: baht(price),
  unit,
  categoryId: categoryId as CategoryId,
  isAvailable: true,
  sortOrder,
});

export const SEED_PRODUCTS: readonly Product[] = [
  product("p1", "หมูปิ้ง", 10, "grill", "ไม้", 1),
  product("p2", "ไก่ปิ้ง", 25, "grill", "ไม้", 2),
  product("p3", "ลูกชิ้นปิ้ง", 10, "grill", "ไม้", 3),
  product("p4", "ไส้กรอกอีสาน", 10, "grill", "ไม้", 4),
  product("p5", "ไก่ทอด", 20, "fried", "ชิ้น", 5),
  product("p6", "หนังไก่ทอด", 20, "fried", "ถุง", 6),
  product("p7", "ข้าวเหนียว", 10, "rice", "ห่อ", 7),
  product("p8", "ข้าวเหนียวหมูทอด", 35, "rice", "ห่อ", 8),
  product("p9", "น้ำเปล่า", 10, "drink", "ขวด", 9),
  product("p10", "ชาเย็น", 25, "drink", "แก้ว", 10),
  product("p11", "โอเลี้ยง", 20, "drink", "แก้ว", 11),
  product("p12", "น้ำเก๊กฮวย", 20, "drink", "แก้ว", 12),
];
