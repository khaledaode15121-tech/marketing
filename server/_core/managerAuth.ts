import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
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

export const hashManagerPassword = hashPassword;
export const verifyPassword = verifyManagerPassword;

const ENCRYPTION_VERSION = "aes256gcm:v1";

function getEncryptionKey() {
  return createHash("sha256")
    .update(process.env.JWT_SECRET || "local-manager-password-key")
    .digest();
}

/** Stores a reversible, encrypted copy only so authorized managers can view their password. */
export function encryptManagerPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_VERSION}:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptManagerPassword(value: string | null | undefined) {
  if (!value?.startsWith(`${ENCRYPTION_VERSION}:`)) return null;
  const [, , ivHex, tagHex, ciphertextHex] = value.split(":");
  if (!ivHex || !tagHex || !ciphertextHex) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
