import { describe, expect, it } from "vitest";
import { normalizePrivateKey } from "./admin";

const pem = "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n";
const escaped = "-----BEGIN PRIVATE KEY-----\\nABC\\nDEF\\n-----END PRIVATE KEY-----\\n";

describe("normalizePrivateKey", () => {
  it("accepts the key however a dashboard or .env file stored it", () => {
    expect(normalizePrivateKey(escaped)).toBe(pem);
    expect(normalizePrivateKey(`"${escaped}"`)).toBe(pem);
    expect(normalizePrivateKey(`'${escaped}'`)).toBe(pem);
    expect(normalizePrivateKey(pem)).toBe(pem);
    expect(normalizePrivateKey(`  "${pem}"  `)).toBe(pem);
  });
});
