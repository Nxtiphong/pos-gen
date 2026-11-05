"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getStaffAuth } from "./firebase/auth";

export type StaffSession = "loading" | "signedIn" | "signedOut";

export function useStaffSession(): StaffSession {
  const [session, setSession] = useState<StaffSession>("loading");
  useEffect(
    () => onAuthStateChanged(getStaffAuth(), (user) => setSession(user ? "signedIn" : "signedOut")),
    [],
  );
  return session;
}
