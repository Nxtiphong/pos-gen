const format = new Intl.DateTimeFormat("th-TH", {
  weekday: "narrow",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

export function formatThaiDate(date: Date): string {
  return format
    .formatToParts(date)
    .map((part) => (part.type === "weekday" ? part.value + "." : part.value))
    .join("");
}

const billDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Bangkok",
});

export function formatClock(date: Date): string {
  return clock.format(date);
}

export function formatBillDateTime(date: Date): string {
  return `${billDate.format(date)} · ${formatClock(date)}`;
}
