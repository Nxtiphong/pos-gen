import type { Order, OrderLine, OrderStatus } from "./order";

export function queueTabs(orders: readonly Order[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = { preparing: 0, notified: 0, picked_up: 0 };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

type OrderIn<S extends OrderStatus> = Extract<Order, { status: S }>;

const ORDERING: { [S in OrderStatus]: (a: OrderIn<S>, b: OrderIn<S>) => number } = {
  preparing: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  notified: (a, b) => b.notifiedAt.getTime() - a.notifiedAt.getTime(),
  picked_up: (a, b) => b.pickedUpAt.getTime() - a.pickedUpAt.getTime(),
};

export function ordersForTab<S extends OrderStatus>(orders: readonly Order[], status: S): OrderIn<S>[] {
  const inTab = orders.filter((order): order is OrderIn<S> => order.status === status);
  return inTab.sort(ORDERING[status] as (a: OrderIn<S>, b: OrderIn<S>) => number);
}

export function itemsSummary(lines: readonly Pick<OrderLine, "name" | "qty">[]): string {
  return lines.map((line) => `${line.name} × ${line.qty}`).join(" · ");
}
