import { describe, expect, it } from "vitest";
import {
  decryptManagerPassword,
  encryptManagerPassword,
  hashManagerPassword,
  verifyManagerPassword,
} from "./_core/managerAuth";

describe("manager password protection", () => {
  it("encrypts and decrypts the authorized display value", () => {
    const password = "TestPass123";
    const encrypted = encryptManagerPassword(password);

    expect(encrypted).not.toContain(password);
    expect(decryptManagerPassword(encrypted)).toBe(password);
    expect(verifyManagerPassword(password, hashManagerPassword(password))).toBe(true);
  });

  it("rejects tampered encrypted values", () => {
    const encrypted = encryptManagerPassword("TestPass123");
    expect(decryptManagerPassword(`${encrypted}00`)).toBeNull();
  });
});
