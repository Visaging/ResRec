import crypto from "crypto";

/**
 * Computes a standard SHA-256 hex digest of a string or Buffer.
 */
export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Computes a multihash-formatted SHA-256 string `mh:sha256:<hex>`.
 */
export function sha256Multihash(data: string | Buffer): string {
  return `mh:sha256:${sha256Hex(data)}`;
}

/**
 * Deterministically computes a commitment multihash for an arbitrary JSON payload.
 */
export function jsonCommitment(obj: unknown): string {
  const serialized = JSON.stringify(obj, Object.keys(obj as object).sort());
  return sha256Multihash(serialized);
}

/**
 * Computes salted commitment mh:sha256(salt || data) matching CooL SDK specification.
 */
export function saltedCommit(saltHex: string, data: string | Buffer): string {
  const cleanHex = saltHex.startsWith("hex:") ? saltHex.slice(4) : saltHex;
  const saltBuf = Buffer.from(cleanHex, "hex");
  const dataBuf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return sha256Multihash(Buffer.concat([saltBuf, dataBuf]));
}

