import crypto from "crypto";

const KEY_LEN = 64;

/**
 * Hashes a plain password using cryptographic scrypt with a random 32-byte salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(32).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Constant-time comparison to verify a password against its stored scrypt hash and salt.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) {
    return false;
  }
  try {
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    const storedBuffer = Buffer.from(storedHash, "hex");
    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}
