"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePreparingQueue, useToday } from "@/lib/orders";

export type StaffSection = "/sell" | "/orders" | "/summary" | "/products";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const NAV_ITEMS: { href: StaffSection; label: string; icon: ReactNode }[] = [
  {
    href: "/sell",
    label: "ขาย",
    icon: (
      <Icon>
        <path d="M6 7h12l-1 13H7L6 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </Icon>
    ),
  },
  {
    href: "/orders",
    label: "ออเดอร์",
    icon: (
      <Icon>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6M9 12h6" />
      </Icon>
    ),
  },
  {
    href: "/summary",
    label: "สรุปยอด",
    icon: (
      <Icon>
        <path d="M4 20h16" />
        <path d="M7 16v-5M12 16V6M17 16v-8" />
      </Icon>
    ),
  },
  {
    href: "/products",
    label: "สินค้า",
    icon: (
      <Icon>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </Icon>
    ),
  },
];

export function StaffNav() {
  const pathname = usePathname();
  const preparing = usePreparingQueue(useToday()).length;
  return (
    <nav aria-label="เมนูหลัก" className="flex w-[88px] shrink-0 flex-col items-center gap-2 border-r border-line bg-card py-5">
      <div aria-hidden="true" className="mb-4 flex size-12 items-center justify-center rounded-[14px] bg-ink text-white">
        <Icon>
          <path d="M4 9l1.5-5h13L20 9" />
          <path d="M4 9h16" />
          <path d="M5 9v11h14V9" />
          <path d="M10 20v-5h4v5" />
        </Icon>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const badge = item.href === "/orders" ? preparing : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex w-[72px] flex-col items-center gap-1 rounded-[14px] py-2.5 text-[13px] ${
              active ? "bg-accent-soft font-semibold text-accent-ink" : "font-medium text-ink-2"
            }`}
          >
            {item.icon}
            {item.label}
            {badge ? (
              <span className="absolute top-1 right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-[5px] text-xs font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
