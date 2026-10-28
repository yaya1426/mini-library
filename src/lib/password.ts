import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

/**
 * Hashes a plain-text password using Node's `crypto.scrypt` with a random 16-byte salt (P001).
 * Format: `scrypt$<saltHex>$<derivedKeyHex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plain-text password against a stored `scrypt$<saltHex>$<derivedKeyHex>` hash
 * in constant time using `timingSafeEqual` (P001, P002).
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const [, saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    if (salt.length === 0 || expectedKey.length !== KEY_LENGTH) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}
