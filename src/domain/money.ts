export type Baht = number & { readonly __brand: "Baht" };

export function baht(amount: number): Baht {
  return amount as Baht;
}

export function formatBaht(amount: Baht): string {
  return "฿" + amount.toLocaleString("en-US");
}
