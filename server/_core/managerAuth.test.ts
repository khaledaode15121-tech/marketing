import { describe, expect, it } from "vitest";
import { verifyManagerPassword } from "./managerAuth";

const DEMO_ADMIN_HASH =
  "scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7";

describe("verifyManagerPassword", () => {
  it("accepts the seeded demo admin password with the exclamation mark", () => {
    expect(verifyManagerPassword("Demo1234!", DEMO_ADMIN_HASH)).toBe(true);
  });

  it("rejects the older demo password without the exclamation mark", () => {
    expect(verifyManagerPassword("Demo1234", DEMO_ADMIN_HASH)).toBe(false);
  });
});
