export type BusinessDate = string & { readonly __brand: "BusinessDate" };

const bangkokDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function businessDate(now: Date): BusinessDate {
  return bangkokDate.format(now) as BusinessDate;
}

export function shiftDate(date: BusinessDate, days: number): BusinessDate {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10) as BusinessDate;
}

export function startOfBusinessDate(date: BusinessDate): Date {
  return new Date(`${date}T00:00:00+07:00`);
}
