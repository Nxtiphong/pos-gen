"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getStaffAuth } from "./firebase/auth";

export type StaffSession = "loading" | "signedIn" | "signedOut";

// The rules trust only the `staff` claim. A token minted before the claim was set lacks it, so refresh once.
export async function isStaffUser(user: User): Promise<boolean> {
  if ((await user.getIdTokenResult()).claims.staff === true) return true;
  return (await user.getIdTokenResult(true)).claims.staff === true;
}

export function useStaffSession(): StaffSession {
  const [session, setSession] = useState<StaffSession>("loading");
  useEffect(() => {
    const auth = getStaffAuth();
    let current: User | null = null;
    return onAuthStateChanged(auth, async (user) => {
      current = user;
      if (!user) return setSession("signedOut");
      const staff = await isStaffUser(user).catch(() => false);
      if (current !== user) return;
      if (staff) setSession("signedIn");
      else await signOut(auth);
    });
  }, []);
  return session;
}
