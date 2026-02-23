/**
 * Hashes a File locally using the Web Crypto API (SHA-256).
 * The file's bytes never leave the browser — only the hex digest is passed
 * to the WASM verifier engine for signature verification.
 */
export async function hashFileLocal(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
