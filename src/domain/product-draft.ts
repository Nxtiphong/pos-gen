import { baht, type Baht } from "./money";
import type { CategoryId } from "./catalog";

export type ProductDraftInput = {
  name: string;
  price: string;
  unit: string;
  categoryId: string;
  newCategoryName?: string;
};

export type ProductDraftField = "name" | "price" | "unit" | "category";

export type ProductDraft = {
  name: string;
  price: Baht;
  unit: string;
  category: { kind: "existing"; id: CategoryId } | { kind: "new"; name: string };
};

export type ProductDraftResult =
  | { ok: true; value: ProductDraft }
  | { ok: false; errors: Partial<Record<ProductDraftField, string>> };

const MAX_NAME = 40;
const MAX_UNIT = 12;
const MAX_CATEGORY = 20;
const MAX_PRICE = 99_999;

export function parseProductDraft(input: ProductDraftInput): ProductDraftResult {
  const errors: Partial<Record<ProductDraftField, string>> = {};

  const name = input.name.trim();
  if (name.length === 0) errors.name = "กรุณาใส่ชื่อสินค้า";
  else if (name.length > MAX_NAME) errors.name = `ชื่อสินค้ายาวเกิน ${MAX_NAME} ตัวอักษร`;

  const priceText = input.price.trim();
  const price = /^\d+$/.test(priceText) ? Number(priceText) : NaN;
  if (priceText.length === 0) errors.price = "กรุณาใส่ราคา";
  else if (Number.isNaN(price)) errors.price = "ราคาต้องเป็นตัวเลขเท่านั้น";
  else if (price < 1 || price > MAX_PRICE) errors.price = "ราคาต้องอยู่ระหว่าง 1 ถึง 99,999 บาท";

  const unit = input.unit.trim();
  if (unit.length === 0) errors.unit = "กรุณาใส่หน่วย";
  else if (unit.length > MAX_UNIT) errors.unit = `หน่วยยาวเกิน ${MAX_UNIT} ตัวอักษร`;
  else if (/^[\d\s.,]+$/.test(unit)) errors.unit = "หน่วยต้องเป็นคำ เช่น แก้ว ไม้ ห่อ";

  const newCategory = input.newCategoryName?.trim() ?? "";
  let category: ProductDraft["category"] | undefined;
  if (newCategory.length > 0) {
    if (newCategory.length > MAX_CATEGORY) errors.category = `ชื่อหมวดยาวเกิน ${MAX_CATEGORY} ตัวอักษร`;
    else category = { kind: "new", name: newCategory };
  } else if (input.categoryId.length > 0) {
    category = { kind: "existing", id: input.categoryId as CategoryId };
  } else {
    errors.category = "กรุณาเลือกหมวด หรือตั้งชื่อหมวดใหม่";
  }

  if (Object.keys(errors).length > 0 || !category) return { ok: false, errors };
  return { ok: true, value: { name, price: baht(price), unit, category } };
}
