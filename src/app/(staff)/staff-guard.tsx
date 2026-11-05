"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStaffSession } from "@/lib/staff-session";

export function StaffGuard({ children }: { children: ReactNode }) {
  const session = useStaffSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session === "signedOut") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname]);

  if (session !== "signedIn") return <div aria-busy="true" className="h-dvh bg-ground" />;
  return children;
}
