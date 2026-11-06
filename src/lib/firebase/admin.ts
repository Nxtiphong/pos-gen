import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

// Dashboards and .env files store the PEM differently: wrapped in quotes, with literal \n, or with real newlines.
export function normalizePrivateKey(raw: string): string {
  const quoted = raw.trim().match(/^(['"])([\s\S]*)\1$/);
  return (quoted ? quoted[2] : raw).replace(/\\n/g, "\n");
}

function adminApp(): App {
  if (getApps().length > 0) return getApp();
  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  if (process.env.FIRESTORE_EMULATOR_HOST) return initializeApp({ projectId });
  return initializeApp({
    projectId,
    credential: cert({
      projectId,
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: normalizePrivateKey(requireEnv("FIREBASE_PRIVATE_KEY")),
    }),
  });
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
