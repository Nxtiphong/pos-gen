import { describe, expect, it } from "vitest";
import { parseProductDraft } from "./product-draft";

const valid = { name: "ไส้อั่ว", price: "15", unit: "ไม้", categoryId: "grill" };

describe("parseProductDraft", () => {
  it("accepts a valid draft with an existing category and trims text", () => {
    expect(parseProductDraft({ ...valid, name: "  ไส้อั่ว  " })).toEqual({
      ok: true,
      value: { name: "ไส้อั่ว", price: 15, unit: "ไม้", category: { kind: "existing", id: "grill" } },
    });
  });

  it("accepts a new category name instead of a chosen one", () => {
    expect(parseProductDraft({ ...valid, categoryId: "", newCategoryName: " ของหวาน " })).toEqual({
      ok: true,
      value: { name: "ไส้อั่ว", price: 15, unit: "ไม้", category: { kind: "new", name: "ของหวาน" } },
    });
  });

  it("rejects blank name", () => {
    expect(parseProductDraft({ ...valid, name: "   " })).toEqual({
      ok: false,
      errors: { name: "กรุณาใส่ชื่อสินค้า" },
    });
  });

  it("limits name to 40 characters", () => {
    expect(parseProductDraft({ ...valid, name: "ก".repeat(40) }).ok).toBe(true);
    expect(parseProductDraft({ ...valid, name: "ก".repeat(41) })).toEqual({
      ok: false,
      errors: { name: "ชื่อสินค้ายาวเกิน 40 ตัวอักษร" },
    });
  });

  it("rejects non-digit prices", () => {
    const errors = { price: "ราคาต้องเป็นตัวเลขเท่านั้น" };
    for (const price of ["abc", "1.5", "-5", "1e3", "12 3"]) {
      expect(parseProductDraft({ ...valid, price })).toEqual({ ok: false, errors });
    }
  });

  it("rejects empty price and out-of-range prices", () => {
    expect(parseProductDraft({ ...valid, price: "" })).toEqual({ ok: false, errors: { price: "กรุณาใส่ราคา" } });
    const range = { price: "ราคาต้องอยู่ระหว่าง 1 ถึง 99,999 บาท" };
    expect(parseProductDraft({ ...valid, price: "0" })).toEqual({ ok: false, errors: range });
    expect(parseProductDraft({ ...valid, price: "100000" })).toEqual({ ok: false, errors: range });
    expect(parseProductDraft({ ...valid, price: "99999" }).ok).toBe(true);
    expect(parseProductDraft({ ...valid, price: "1" }).ok).toBe(true);
  });

  it("rejects a unit that is only a number, which would read as a second quantity", () => {
    expect(parseProductDraft({ ...valid, unit: "1" })).toEqual({ ok: false, errors: { unit: "หน่วยต้องเป็นคำ เช่น แก้ว ไม้ ห่อ" } });
    expect(parseProductDraft({ ...valid, unit: "500 ml" }).ok).toBe(true);
  });

  it("limits unit to 12 characters", () => {
    expect(parseProductDraft({ ...valid, unit: "" })).toEqual({ ok: false, errors: { unit: "กรุณาใส่หน่วย" } });
    expect(parseProductDraft({ ...valid, unit: "ก".repeat(13) })).toEqual({
      ok: false,
      errors: { unit: "หน่วยยาวเกิน 12 ตัวอักษร" },
    });
    expect(parseProductDraft({ ...valid, unit: "ก".repeat(12) }).ok).toBe(true);
  });

  it("requires a category or a new category name", () => {
    expect(parseProductDraft({ ...valid, categoryId: "", newCategoryName: "  " })).toEqual({
      ok: false,
      errors: { category: "กรุณาเลือกหมวด หรือตั้งชื่อหมวดใหม่" },
    });
  });

  it("reports every failing field at once", () => {
    expect(parseProductDraft({ name: "", price: "abc", unit: "", categoryId: "" })).toEqual({
      ok: false,
      errors: {
        name: "กรุณาใส่ชื่อสินค้า",
        price: "ราคาต้องเป็นตัวเลขเท่านั้น",
        unit: "กรุณาใส่หน่วย",
        category: "กรุณาเลือกหมวด หรือตั้งชื่อหมวดใหม่",
      },
    });
  });
});
