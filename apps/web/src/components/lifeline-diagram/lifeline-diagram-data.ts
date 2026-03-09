/**
 * Variant configuration data for the lifeline sequence diagram.
 *
 * Each variant defines the actors (column headers), steps (arrow rows),
 * and color tokens for one signing or verification flow.
 *
 * Icon references use string IDs resolved at render time by the icon module,
 * keeping this file free of React imports.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Actor {
  name: string;
  iconId: string;
}

export interface Step {
  from: number;
  to: number;
  label: string;
}

export interface FlowColors {
  accent: string;
  accentBg: string;
  accentFill: string;
  accentBorder: string;
  border: string;
  line: string;
}

export interface FlowConfig {
  actors: Actor[];
  steps: Step[];
  colors: FlowColors;
}

// ---------------------------------------------------------------------------
// Shared color palettes
// ---------------------------------------------------------------------------

const AMBER: FlowColors = {
  accent: 'text-amber-400',
  accentBg: 'bg-amber-400',
  accentFill: 'fill-amber-400',
  accentBorder: 'border-amber-400',
  border: 'border-amber-500/20',
  line: 'bg-amber-500/20',
};

const SKY: FlowColors = {
  accent: 'text-sky-400',
  accentBg: 'bg-sky-400',
  accentFill: 'fill-sky-400',
  accentBorder: 'border-sky-400',
  border: 'border-sky-500/20',
  line: 'bg-sky-500/20',
};

const EMERALD: FlowColors = {
  accent: 'text-emerald-400',
  accentBg: 'bg-emerald-400',
  accentFill: 'fill-emerald-400',
  accentBorder: 'border-emerald-400',
  border: 'border-emerald-500/20',
  line: 'bg-emerald-500/20',
};

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

export const VARIANTS: Record<string, FlowConfig> = {
  'gpg-sign': {
    actors: [
      { name: 'Developer', iconId: 'user' },
      { name: 'Git', iconId: 'git' },
      { name: 'GPG Agent', iconId: 'key' },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit -S -m "fix"' },
      { from: 1, to: 2, label: 'sign payload' },
      { from: 2, to: 2, label: 'decrypt private key (passphrase prompt or cached)' },
      { from: 2, to: 1, label: 'return signature' },
      { from: 1, to: 0, label: 'commit stored (signature in header)' },
    ],
    colors: AMBER,
  },
  'gpg-verify': {
    actors: [
      { name: 'Verifier', iconId: 'user' },
      { name: 'Git', iconId: 'git' },
      { name: 'GPG Keyring', iconId: 'key' },
    ],
    steps: [
      { from: 0, to: 1, label: 'git verify-commit <SHA>' },
      { from: 1, to: 2, label: 'lookup public key' },
      { from: 2, to: 2, label: 'key found? verify signature, check trust level' },
      { from: 1, to: 0, label: 'GOOD / WARNING / BAD / "no public key"' },
    ],
    colors: AMBER,
  },
  'sigstore-sign': {
    actors: [
      { name: 'Developer', iconId: 'user' },
      { name: 'Gitsign', iconId: 'terminal' },
      { name: 'Fulcio', iconId: 'shield' },
      { name: 'OIDC', iconId: 'globe' },
      { name: 'Rekor', iconId: 'database' },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit' },
      { from: 1, to: 1, label: 'generate ephemeral keypair' },
      { from: 1, to: 2, label: 'request certificate' },
      { from: 2, to: 3, label: 'verify OIDC token (browser opens)' },
      { from: 3, to: 2, label: 'token valid' },
      { from: 2, to: 1, label: 'short-lived certificate' },
      { from: 1, to: 1, label: 'sign commit with ephemeral key' },
      { from: 1, to: 4, label: 'record in transparency log' },
      { from: 1, to: 1, label: 'discard key' },
      { from: 1, to: 0, label: 'commit stored' },
    ],
    colors: SKY,
  },
  'sigstore-verify': {
    actors: [
      { name: 'Verifier', iconId: 'user' },
      { name: 'Git', iconId: 'git' },
      { name: 'Rekor', iconId: 'database' },
      { name: 'Fulcio Root', iconId: 'shield' },
    ],
    steps: [
      { from: 0, to: 1, label: 'git verify-commit <SHA>' },
      { from: 1, to: 2, label: 'lookup entry in Rekor' },
      { from: 2, to: 1, label: 'entry + certificate' },
      { from: 1, to: 3, label: 'verify cert chain to root' },
      { from: 3, to: 1, label: 'valid' },
      { from: 1, to: 1, label: 'verify signature with cert key' },
      { from: 1, to: 0, label: 'GOOD' },
    ],
    colors: SKY,
  },
  'auths-sign': {
    actors: [
      { name: 'Developer', iconId: 'user' },
      { name: 'Git', iconId: 'git' },
      { name: 'OS Keychain', iconId: 'lock' },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit -m "fix"' },
      { from: 1, to: 2, label: 'sign payload' },
      { from: 2, to: 2, label: 'unlock key (biometric or cached session)' },
      { from: 2, to: 1, label: 'signature' },
      { from: 1, to: 0, label: 'commit stored' },
    ],
    colors: EMERALD,
  },
  'auths-verify': {
    actors: [
      { name: 'Verifier', iconId: 'user' },
      { name: 'Git', iconId: 'git' },
      { name: 'Auths Verifier', iconId: 'shield' },
    ],
    steps: [
      { from: 0, to: 1, label: 'auths verify <SHA>' },
      { from: 1, to: 2, label: 'read KEL from refs/did/keri/' },
      { from: 2, to: 2, label: 'replay log: inception \u2192 rotations \u2192 pre-rotation \u2192 current key' },
      { from: 2, to: 2, label: 'verify commit signature against derived key' },
      { from: 2, to: 0, label: 'GOOD (+ full key history chain)' },
    ],
    colors: EMERALD,
  },
};
