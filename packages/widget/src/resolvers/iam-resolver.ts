/**
 * Browser Auths-Presentation Challenge Resolver.
 */

export interface AuthsPresentationBrowser {
  holder_did: string;
  nonce: string;
  signature_hex: string;
}

export function parseAuthsPresentationHeader(header: string): AuthsPresentationBrowser | null {
  if (!header.startsWith('Auths-Presentation ')) {
    return null;
  }
  try {
    const raw = header.slice('Auths-Presentation '.length);
    const decoded = atob(raw);
    return JSON.parse(decoded) as AuthsPresentationBrowser;
  } catch {
    return null;
  }
}
