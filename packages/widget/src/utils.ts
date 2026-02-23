import type { VerificationStatus, ComponentState } from './types';

/**
 * Truncate a DID for display, keeping prefix and last chars.
 * e.g. did:keri:abcdef...uvwxyz
 */
export function truncateDid(did: string, maxLen = 24): string {
  if (did.length <= maxLen) return did;
  const prefixEnd = did.indexOf(':', did.indexOf(':') + 1) + 1; // after second ':'
  const prefix = did.slice(0, prefixEnd);
  const remaining = maxLen - prefix.length - 3; // 3 for '...'
  if (remaining <= 0) return did.slice(0, maxLen - 3) + '...';
  const tail = Math.floor(remaining / 2);
  const head = remaining - tail;
  const id = did.slice(prefixEnd);
  return prefix + id.slice(0, head) + '\u2026' + id.slice(-tail);
}

/**
 * Format an ISO timestamp to a human-readable date string.
 */
export function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Map a VerificationStatus from the Rust/WASM layer to a ComponentState.
 */
export function statusToState(status: VerificationStatus): ComponentState {
  switch (status.type) {
    case 'Valid':
      return 'verified';
    case 'Expired':
      return 'expired';
    case 'Revoked':
      return 'revoked';
    case 'InvalidSignature':
      return 'invalid';
    case 'BrokenChain':
      return 'invalid';
    default:
      return 'error';
  }
}
