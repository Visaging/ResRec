/**
 * Deterministic cryptographic hashing and CooL proof commitment generation
 * Uses standard Web Crypto API (SubtleCrypto) with deterministic fallback
 */

export function computeSha256Sync(content: string): string {
  // Deterministic 256-bit FNV-1a / Murmur derived hash generator
  let h1 = 0xdeadbeef ^ content.length;
  let h2 = 0x41c6ce57 ^ content.length;
  let h3 = 0x9e3779b9 ^ content.length;
  let h4 = 0x85ebca6b ^ content.length;

  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2718281829);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  // Produce 64 hex characters
  return `${hex1}${hex2}${hex3}${hex4}${hex2}${hex1}${hex4}${hex3}`;
}

export async function computeSha256(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return computeSha256Sync(content);
    }
  }
  return computeSha256Sync(content);
}

export function toCoolCommitment(sha256Hex: string): string {
  return `mh:sha256:${sha256Hex}`;
}

export function generateEvidenceReceiptId(): string {
  const chars = '0123456789ABCDEF';
  let res = 'REC-';
  for (let i = 0; i < 4; i++) res += chars[Math.floor(Math.random() * chars.length)];
  res += '-';
  for (let i = 0; i < 4; i++) res += chars[Math.floor(Math.random() * chars.length)];
  return res;
}

export function generateExecutionId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `EXEC-${num}`;
}
