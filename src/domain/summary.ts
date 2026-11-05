export type SummaryOrder = {
  createdAt: Date;
  total: number;
  itemCount: number;
  lines: readonly { productId: string; name: string; price: number; qty: number }[];
};

export type TopProduct = { productId: string; name: string; qty: number; revenue: number };
export type HourBucket = { hour: number; revenue: number; billCount: number };
export type Summary = {
  revenue: number;
  billCount: number;
  itemCount: number;
  topProducts: TopProduct[];
  hourly: HourBucket[];
};

const TOP_COUNT = 5;
const EMPTY_WINDOW = { first: 6, last: 22 };
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// Asia/Bangkok has no DST, so a fixed +7h shift gives its wall-clock hour.
function bangkokHour(date: Date): number {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).getUTCHours();
}

function rankTop(orders: readonly SummaryOrder[]): TopProduct[] {
  const byId = new Map<string, TopProduct>();
  for (const order of orders) {
    for (const line of order.lines) {
      const entry = byId.get(line.productId) ?? { productId: line.productId, name: line.name, qty: 0, revenue: 0 };
      entry.qty += line.qty;
      entry.revenue += line.price * line.qty;
      byId.set(line.productId, entry);
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue || a.productId.localeCompare(b.productId))
    .slice(0, TOP_COUNT);
}

function bucketByHour(orders: readonly SummaryOrder[]): HourBucket[] {
  const hours = orders.map((o) => bangkokHour(o.createdAt));
  const first = hours.length ? Math.min(...hours) : EMPTY_WINDOW.first;
  const last = hours.length ? Math.max(...hours) : EMPTY_WINDOW.last;
  const buckets: HourBucket[] = [];
  for (let hour = first; hour <= last; hour++) buckets.push({ hour, revenue: 0, billCount: 0 });
  orders.forEach((order, i) => {
    const bucket = buckets[hours[i] - first];
    bucket.revenue += order.total;
    bucket.billCount += 1;
  });
  return buckets;
}

export function summarize(orders: readonly SummaryOrder[]): Summary {
  return {
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
    billCount: orders.length,
    itemCount: orders.reduce((sum, o) => sum + o.itemCount, 0),
    topProducts: rankTop(orders),
    hourly: bucketByHour(orders),
  };
}
