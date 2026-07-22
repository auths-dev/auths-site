/**
 * Pure TypeScript did:key:z... → Ed25519 public key hex extraction.
 *
 * Uses base58btc decoding + multicodec prefix stripping (0xED 0x01).
 * No external dependencies — runs before WASM loads.
 */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Decode a base58btc-encoded string to bytes */
function base58Decode(input: string): Uint8Array {
  const bytes: number[] = [0];
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid base58 character: ${char}`);
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading zeros
  for (const char of input) {
    if (char !== '1') break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

/** Convert a byte array to hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract public key hex from a did:key:z... identifier.
 *
 * Supports Ed25519 (0xED 0x01) and P-256 (0x12 0x00).
 */
export function didKeyToPublicKeyHex(didKey: string): string {
  if (!didKey.startsWith('did:key:z')) {
    throw new Error(`Expected did:key:z... format, got: ${didKey}`);
  }

  // Strip 'did:key:z' — 'z' is the base58btc multibase prefix
  const encoded = didKey.slice('did:key:z'.length);
  const decoded = base58Decode(encoded);

  // Check Ed25519 (0xED 0x01) or P-256 (0x12 0x00) multicodec prefix
  if (decoded.length >= 34 && decoded[0] === 0xed && decoded[1] === 0x01) {
    return bytesToHex(decoded.slice(2, 34));
  } else if (decoded.length >= 35 && decoded[0] === 0x12 && decoded[1] === 0x00) {
    // P-256 compressed public key (33 bytes)
    return bytesToHex(decoded.slice(2, 35));
  }

  throw new Error(
    `Unsupported did:key multicodec prefix: 0x${bytesToHex(decoded.slice(0, 2))}`,
  );
}

/**
 * Sanitize a DID for use in Git ref paths.
 * Matches Rust: layout.rs:247-251 — replace non-alphanumeric with '_'
 */
export function sanitizeDidForRef(did: string): string {
  return did.replace(/[^a-zA-Z0-9]/g, '_');
}
