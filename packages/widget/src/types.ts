// Re-export types (vendored locally for CI compatibility — no file: sibling dep needed)
export type {
  VerificationResult,
  VerificationReport,
  VerificationStatus,
  ChainLink,
  Attestation,
} from './vendor-types';

/** Visual state of the <auths-verify> component */
export type ComponentState =
  | 'idle'
  | 'loading'
  | 'verified'
  | 'invalid'
  | 'expired'
  | 'revoked'
  | 'error';

/** Display mode */
export type DisplayMode = 'badge' | 'detail' | 'tooltip';

/** Badge size */
export type BadgeSize = 'sm' | 'md' | 'lg';

/** Label text for each component state */
export const STATE_LABELS: Record<ComponentState, string> = {
  idle: 'Not verified',
  loading: 'Verifying\u2026',
  verified: 'Verified',
  invalid: 'Invalid',
  expired: 'Expired',
  revoked: 'Revoked',
  error: 'Error',
};
