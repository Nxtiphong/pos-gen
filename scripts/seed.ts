import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "../src/domain/catalog";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";

const prod = process.argv.includes("--prod");
// Production mode skips .env.development.local, which points everything at the emulators.
loadEnvConfig(process.cwd(), !prod);

const STAFF_EMAIL = "staff@pos.local";
const EMULATOR_DEFAULT_PASSWORD = "changeme123";
const MIN_PASSWORD = 8;

const onEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (onEmulators !== Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) {
  throw new Error("Set both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST, or neither.");
}
if (prod && onEmulators) throw new Error("--prod refuses to run while an *_EMULATOR_HOST variable is set.");

function ask(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function staffPassword(): Promise<string> {
  if (process.env.SEED_STAFF_PASSWORD) return process.env.SEED_STAFF_PASSWORD;
  if (onEmulators) return EMULATOR_DEFAULT_PASSWORD;
  if (!process.stdin.isTTY) throw new Error("Set SEED_STAFF_PASSWORD, or run in a terminal to be asked for it.");
  const first = await ask(`ตั้งรหัสผ่านสำหรับ ${STAFF_EMAIL} (อย่างน้อย ${MIN_PASSWORD} ตัว): `);
  if (first.length < MIN_PASSWORD) throw new Error(`รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร`);
  const again = await ask("พิมพ์รหัสผ่านอีกครั้ง: ");
  if (again !== first) throw new Error("รหัสผ่านสองครั้งไม่ตรงกัน");
  return first;
}

async function main() {
  const target = onEmulators ? `emulators (${process.env.FIRESTORE_EMULATOR_HOST})` : `project ${process.env.FIREBASE_PROJECT_ID}`;
  console.log(`Target: ${target}`);
  const password = await staffPassword();

  const db = adminDb();
  // Re-running must not wipe prices or availability the shop has since edited.
  const hasCatalog = !(await db.collection("products").limit(1).get()).empty;
  if (!hasCatalog) {
    const batch = db.batch();
    for (const { id, ...category } of SEED_CATEGORIES) batch.set(db.doc(`categories/${id}`), category);
    for (const { id, ...product } of SEED_PRODUCTS) batch.set(db.doc(`products/${id}`), product);
    await batch.commit();
  }

  const auth = adminAuth();
  const existing = await auth.getUserByEmail(STAFF_EMAIL).catch(() => null);
  const staff = existing ? await auth.updateUser(existing.uid, { password }) : await auth.createUser({ email: STAFF_EMAIL, password });
  await auth.setCustomUserClaims(staff.uid, { ...staff.customClaims, staff: true });

  const catalog = hasCatalog ? "kept the existing catalog" : `seeded ${SEED_CATEGORIES.length} categories and ${SEED_PRODUCTS.length} products`;
  console.log(`Done: ${catalog}, ${existing ? "updated" : "created"} ${STAFF_EMAIL} (claim staff: true) in ${target}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
