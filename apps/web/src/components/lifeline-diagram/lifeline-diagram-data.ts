/**
 * Variant configuration data for the lifeline sequence diagram.
 *
 * Each variant defines the actors (column headers), steps (arrow rows),
 * a chrome-bar title, and color tokens for one signing or verification flow.
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
  title: string;
  colors: FlowColors;
}

// ---------------------------------------------------------------------------
// Shared color palette — the ledger's single warm accent over dark paper
// ---------------------------------------------------------------------------

const LEDGER: FlowColors = {
  accent: 'text-[#e8845c]',
  accentBg: 'bg-[#e8845c]',
  accentFill: 'fill-[#e8845c]',
  accentBorder: 'border-[#e8845c]',
  border: 'border-[#e8845c]/25',
  line: 'bg-white/10',
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
    title: 'sequence — gpg sign',
    colors: LEDGER,
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
    title: 'sequence — gpg verify',
    colors: LEDGER,
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
    title: 'sequence — sigstore sign',
    colors: LEDGER,
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
    title: 'sequence — sigstore verify',
    colors: LEDGER,
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
    title: 'sequence — auths sign',
    colors: LEDGER,
  },
  'auths-sigstore-sign': {
    actors: [
      { name: 'Developer', iconId: 'user' },
      { name: 'Auths CLI', iconId: 'terminal' },
      { name: 'OS Keychain', iconId: 'lock' },
      { name: 'Rekor', iconId: 'database' },
    ],
    steps: [
      { from: 0, to: 1, label: 'auths artifact sign --log sigstore-rekor file.tar.gz' },
      { from: 1, to: 2, label: 'sign attestation with device key' },
      { from: 2, to: 2, label: 'unlock P-256 key (passphrase or cached)' },
      { from: 2, to: 1, label: 'attestation signature + DSSE signature' },
      { from: 1, to: 1, label: 'build DSSE envelope (payload + signature + PEM key)' },
      { from: 1, to: 3, label: 'POST /api/v1/log/entries (DSSE entry)' },
      { from: 3, to: 3, label: 'verify signature, append to Merkle tree' },
      { from: 3, to: 1, label: 'inclusion proof + signed checkpoint' },
      { from: 1, to: 1, label: 'embed transparency section in .auths.json' },
      { from: 1, to: 0, label: 'file.tar.gz.auths.json written (logged at index N)' },
    ],
    title: 'sequence — auths + sigstore sign',
    colors: LEDGER,
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
      { from: 2, to: 2, label: 'replay log: inception → rotations → pre-rotation → current key' },
      { from: 2, to: 2, label: 'verify commit signature against derived key' },
      { from: 2, to: 0, label: 'GOOD (+ full key history chain)' },
    ],
    title: 'sequence — auths verify',
    colors: LEDGER,
  },
};
