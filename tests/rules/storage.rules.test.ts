import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, describe, it } from "vitest";

let env: RulesTestEnvironment;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pos-gen-rules",
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), "products/p1/a.png"), PNG, { contentType: "image/png" });
  });
});

afterAll(async () => {
  await env.cleanup();
});

const staff = () => env.authenticatedContext("staff-uid", { staff: true }).storage();
const stranger = () => env.authenticatedContext("stranger-uid", {}).storage();
const anon = () => env.unauthenticatedContext().storage();

describe("product images", () => {
  it("staff with the claim can upload and read", async () => {
    await assertSucceeds(uploadBytes(ref(staff(), "products/p2/b.png"), PNG, { contentType: "image/png" }));
    await assertSucceeds(getBytes(ref(staff(), "products/p1/a.png")));
  });

  it("a signed-in user without the claim cannot upload or read", async () => {
    await assertFails(uploadBytes(ref(stranger(), "products/p3/c.png"), PNG, { contentType: "image/png" }));
    await assertFails(getBytes(ref(stranger(), "products/p1/a.png")));
  });

  it("an anonymous user cannot upload", async () => {
    await assertFails(uploadBytes(ref(anon(), "products/p4/d.png"), PNG, { contentType: "image/png" }));
  });
});
