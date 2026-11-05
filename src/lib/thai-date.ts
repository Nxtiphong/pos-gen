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
