import { loadEnvConfig } from "@next/env";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "../src/domain/catalog";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";

loadEnvConfig(process.cwd(), true);

const STAFF_EMAIL = "staff@pos.local";
const EMULATOR_DEFAULT_PASSWORD = "changeme123";

const onEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (onEmulators !== Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) {
  throw new Error("Set both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST, or neither.");
}
const password = process.env.SEED_STAFF_PASSWORD || (onEmulators ? EMULATOR_DEFAULT_PASSWORD : undefined);
if (!password) throw new Error("SEED_STAFF_PASSWORD is required outside the emulators.");

async function main() {
  const db = adminDb();
  const batch = db.batch();
  for (const { id, ...category } of SEED_CATEGORIES) batch.set(db.doc(`categories/${id}`), category);
  for (const { id, ...product } of SEED_PRODUCTS) batch.set(db.doc(`products/${id}`), product);
  await batch.commit();

  const auth = adminAuth();
  const existing = await auth.getUserByEmail(STAFF_EMAIL).catch(() => null);
  const staff = existing ? await auth.updateUser(existing.uid, { password }) : await auth.createUser({ email: STAFF_EMAIL, password });
  await auth.setCustomUserClaims(staff.uid, { ...staff.customClaims, staff: true });

  const target = onEmulators ? `emulators (${process.env.FIRESTORE_EMULATOR_HOST})` : `project ${process.env.FIREBASE_PROJECT_ID}`;
  console.log(`Seeded ${SEED_CATEGORIES.length} categories, ${SEED_PRODUCTS.length} products and ${STAFF_EMAIL} (claim staff: true) into ${target}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
