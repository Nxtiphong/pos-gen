"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { CategoryId } from "@/domain/catalog";
import { parseProductDraft, type ProductDraftField } from "@/domain/product-draft";
import { useCatalog, useCatalogActions } from "@/lib/catalog";

type Errors = Partial<Record<ProductDraftField, string>>;

const inputClass =
  "h-14 w-full rounded-[14px] border bg-card px-4 text-[18px] text-ink focus:outline-3 focus:outline-offset-1 focus:outline-[#f4b28c]";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[14px] font-medium text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddProductDialog({ onClose }: { onClose: () => void }) {
  const { categories } = useCatalog();
  const { addProduct } = useCatalogActions();
  const ids = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | "">(categories[0]?.id ?? "");
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const fieldId = (f: string) => `${ids}-${f}`;
  const describe = (f: ProductDraftField) =>
    errors[f] ? { "aria-invalid": true, "aria-describedby": `${fieldId(f)}-error` } : {};
  const borderFor = (f: ProductDraftField) => (errors[f] ? "border-accent" : "border-[#c9ccc5]");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const result = parseProductDraft({
      name,
      price,
      unit,
      categoryId,
      newCategoryName: newCategory ?? undefined,
    });
    if (!result.ok) {
      setErrors(result.errors);
      const first = (["name", "price", "unit", "category"] as const).find((f) => result.errors[f]);
      if (first) {
        const target = first === "category" ? (newCategory !== null ? fieldId("category") : null) : fieldId(first);
        if (target) document.getElementById(target)?.focus();
      }
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await addProduct(result.value, image ?? undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[560px] max-w-[calc(100vw-32px)] rounded-[28px] bg-card p-0 text-ink shadow-[0_24px_64px_rgba(28,29,26,0.3)] backdrop:bg-ink/50"
    >
      <form noValidate onSubmit={submit} className="flex max-h-dvh flex-col gap-5 overflow-auto p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${ids}-title`} className="text-[26px] font-bold">
            เพิ่มสินค้า
          </h2>
          <button
            type="button"
            aria-label="ปิด"
            onClick={() => dialogRef.current?.close()}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] bg-ground text-ink"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <Field id={fieldId("name")} label="ชื่อสินค้า" error={errors.name}>
          <input
            id={fieldId("name")}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ไส้อั่ว"
            className={`${inputClass} ${borderFor("name")}`}
            {...describe("name")}
          />
        </Field>

        <div className="grid grid-cols-2 items-start gap-3.5">
          <Field id={fieldId("price")} label="ราคา (บาท)" error={errors.price}>
            <input
              id={fieldId("price")}
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className={`${inputClass} font-semibold ${borderFor("price")}`}
              {...describe("price")}
            />
          </Field>
          <Field id={fieldId("unit")} label="หน่วย" error={errors.unit}>
            <input
              id={fieldId("unit")}
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="เช่น ไม้ / ห่อ / แก้ว"
              className={`${inputClass} ${borderFor("unit")}`}
              {...describe("unit")}
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 p-0 text-[15px] font-semibold">หมวด</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = newCategory === null && c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setCategoryId(c.id);
                    setNewCategory(null);
                  }}
                  className={`h-11 cursor-pointer rounded-full border px-[18px] text-[16px] font-semibold ${
                    on ? "border-ink bg-ink text-white" : "border-line bg-card text-ink"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={newCategory !== null}
              onClick={() => {
                setCategoryId("");
                setNewCategory("");
              }}
              className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[16px] ${
                newCategory !== null ? "border-solid border-ink bg-ink font-semibold text-white" : "border-dashed border-[#a8ada9] bg-card font-medium text-[#4d514e]"
              }`}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M5 12h14M12 5v14" />
              </svg>
              หมวดใหม่
            </button>
          </div>
          {newCategory !== null && (
            <input
              id={fieldId("category")}
              type="text"
              aria-label="ชื่อหมวดใหม่"
              autoFocus
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="ชื่อหมวดใหม่ เช่น ของหวาน"
              className={`${inputClass} ${borderFor("category")}`}
              {...describe("category")}
            />
          )}
          {errors.category && (
            <p id={`${fieldId("category")}-error`} className="text-[14px] font-medium text-accent-ink">
              {errors.category}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold">
            รูป <span className="font-normal text-ink-2">(ไม่บังคับ)</span>
          </span>
          <div className="flex items-center gap-3">
            {preview && image && (
              // eslint-disable-next-line @next/next/no-img-element -- blob URL preview, next/image cannot optimise it
              <img src={preview} alt="ตัวอย่างรูปสินค้า" className="size-[88px] shrink-0 rounded-[16px] object-cover" />
            )}
            <label className="relative flex h-[88px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-[16px] border-[1.5px] border-dashed border-[#a8ada9] bg-[#fafaf8] text-[16px] font-medium text-[#4d514e] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[#f4b28c]">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="รูปสินค้า"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImage(file);
                  if (!file) setPreview(null);
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h3l2-3h6l2 3h3v11H4V8z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {image ? "เปลี่ยนรูป" : "ถ่ายรูป หรือเลือกจากคลังภาพ"}
            </label>
          </div>
        </div>

        <div className="mt-1 grid grid-cols-[1fr_2fr] gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-[60px] cursor-pointer rounded-[16px] border border-line bg-card text-[18px] font-semibold text-ink"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-[60px] cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-accent text-[18px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
            บันทึกสินค้า
          </button>
        </div>
      </form>
    </dialog>
  );
}
