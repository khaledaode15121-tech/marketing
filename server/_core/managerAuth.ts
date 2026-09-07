import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashManagerPassword(password: string) {
  if (password.length < 5) {
    throw new Error("كلمة المرور يجب أن تكون 5 أحرف على الأقل");
  }
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyManagerPassword(
  password: string,
  storedHash: string | null | undefined
) {
  if (!storedHash?.startsWith("scrypt:")) return false;
  const [, salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  try {
    const actual = scryptSync(password, salt, KEY_LENGTH);
    const expected = Buffer.from(expectedHex, "hex");
    return (
      expected.length === actual.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}
