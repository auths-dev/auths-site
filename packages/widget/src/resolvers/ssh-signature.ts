/**
 * Extract the Ed25519 public key from an SSH signature PEM string.
 *
 * The SSH signature format (SSHSIG) embeds the signer's public key.
 * Binary layout:
 *   "SSHSIG" (6 bytes) → version (uint32) → public_key_length (uint32)
 *     → key_type_length (uint32) → "ssh-ed25519" (11 bytes)
 *     → key_data_length (uint32) → key_data (32 bytes) ← EXTRACT THIS
 *
 * Returns the 32-byte key as a hex string, or null if parsing fails.
 */
export function extractSignerKeyFromSsh(signaturePem: string): string | null {
  try {
    // Strip PEM header/footer and decode base64
    const b64 = signaturePem
      .replace(/-----BEGIN SSH SIGNATURE-----/, '')
      .replace(/-----END SSH SIGNATURE-----/, '')
      .replace(/\s+/g, '');

    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    // Verify magic bytes "SSHSIG"
    const magic = String.fromCharCode(...raw.slice(0, 6));
    if (magic !== 'SSHSIG') return null;

    let offset = 6;

    // Version (uint32 big-endian)
    const version = readUint32(raw, offset);
    offset += 4;
    if (version !== 1) return null;

    // Public key section length (uint32)
    const pubkeyLen = readUint32(raw, offset);
    offset += 4;

    // Within the public key section: key type string
    const keyTypeLen = readUint32(raw, offset);
    offset += 4;

    const keyType = String.fromCharCode(...raw.slice(offset, offset + keyTypeLen));
    offset += keyTypeLen;

    if (keyType !== 'ssh-ed25519') return null;

    // Key data length (should be 32 for Ed25519)
    const keyDataLen = readUint32(raw, offset);
    offset += 4;

    if (keyDataLen !== 32) return null;

    const keyData = raw.slice(offset, offset + 32);
    return Array.from(keyData)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function readUint32(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] << 24) |
      (buf[offset + 1] << 16) |
      (buf[offset + 2] << 8) |
      buf[offset + 3]) >>>
    0
  );
}
