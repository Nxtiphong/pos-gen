import { browserLocalPersistence, connectAuthEmulator, initializeAuth, type Auth } from "firebase/auth";
import firebaseJson from "../../../firebase.json";
import { emulatorHost, firebaseApp, useEmulators } from "./client";

let auth: Auth | undefined;

export function getStaffAuth(): Auth {
  if (!auth) {
    auth = initializeAuth(firebaseApp(), { persistence: browserLocalPersistence });
    if (useEmulators) connectAuthEmulator(auth, `http://${emulatorHost}:${firebaseJson.emulators.auth.port}`, { disableWarnings: true });
  }
  return auth;
}
