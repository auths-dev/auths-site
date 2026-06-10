import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Auths vs. GPG vs. SSH vs. Sigstore | Auths',
  description:
    'A fair comparison of code-signing and identity approaches — including where the alternatives win.',
});

type Cell = { mark: 'yes' | 'no' | 'partial' | 'none'; text: string };

interface Row {
  feature: string;
  auths: Cell;
  gpg: Cell;
  ssh: Cell;
  sigstore: Cell;
}

const GENERAL: Row[] = [
  {
    feature: 'Setup time',
    auths: { mark: 'none', text: '10 seconds' },
    gpg: { mark: 'none', text: '15+ minutes' },
    ssh: { mark: 'none', text: '5 minutes' },
    sigstore: { mark: 'none', text: '2 minutes' },
  },
  {
    feature: 'Key rotation',
    auths: { mark: 'none', text: 'Pre-rotation built in' },
    gpg: { mark: 'none', text: 'Manual ceremony' },
    ssh: { mark: 'none', text: 'Manual replacement' },
    sigstore: { mark: 'none', text: 'Ephemeral keys' },
  },
  {
    feature: 'Works offline',
    auths: { mark: 'yes', text: 'Yes' },
    gpg: { mark: 'yes', text: 'Yes' },
    ssh: { mark: 'yes', text: 'Yes' },
    sigstore: { mark: 'no', text: 'Requires internet' },
  },
  {
    feature: 'Multi-device',
    auths: { mark: 'none', text: 'QR code pairing' },
    gpg: { mark: 'none', text: 'Export/import keys' },
    ssh: { mark: 'none', text: 'Copy key files' },
    sigstore: { mark: 'none', text: 'Via OIDC provider' },
  },
  {
    feature: 'Agent delegation',
    auths: { mark: 'none', text: 'Scoped + revocable' },
    gpg: { mark: 'no', text: 'Not supported' },
    ssh: { mark: 'no', text: 'Not supported' },
    sigstore: { mark: 'no', text: 'Not supported' },
  },
  {
    feature: 'Revocation',
    auths: { mark: 'none', text: 'Signed event in Git' },
    gpg: { mark: 'none', text: 'Keyserver dependent' },
    ssh: { mark: 'none', text: 'Delete from GitHub' },
    sigstore: { mark: 'none', text: 'Certificate expiry' },
  },
  {
    feature: 'GitHub "Verified" badge',
    auths: { mark: 'partial', text: 'Not yet' },
    gpg: { mark: 'yes', text: 'Yes' },
    ssh: { mark: 'yes', text: 'Yes' },
    sigstore: { mark: 'partial', text: 'Not yet' },
  },
  {
    feature: 'Ecosystem adoption',
    auths: { mark: 'no', text: 'New — pre-launch' },
    gpg: { mark: 'yes', text: 'Decades of use' },
    ssh: { mark: 'yes', text: 'Ubiquitous' },
    sigstore: { mark: 'yes', text: 'npm, PyPI, Kubernetes…' },
  },
];

const ATTACK: Row[] = [
  {
    feature: 'Survives stolen CI token (Axios/LiteLLM attacks)',
    auths: { mark: 'yes', text: 'Yes — key is hardware-bound' },
    gpg: { mark: 'no', text: 'No' },
    ssh: { mark: 'no', text: 'No' },
    sigstore: { mark: 'no', text: 'No' },
  },
  {
    feature: 'Offline / air-gapped verification',
    auths: { mark: 'yes', text: 'Yes — WASM, no server' },
    gpg: { mark: 'yes', text: 'Yes' },
    ssh: { mark: 'yes', text: 'Yes' },
    sigstore: { mark: 'no', text: 'Requires Rekor network call' },
  },
  {
    feature: 'Persistent maintainer identity',
    auths: { mark: 'yes', text: 'Lifelong key history' },
    gpg: { mark: 'partial', text: 'Manual key management' },
    ssh: { mark: 'partial', text: 'No history model' },
    sigstore: { mark: 'no', text: 'Ephemeral — no persistent identity' },
  },
  {
    feature: 'AI agent identity delegation',
    auths: { mark: 'yes', text: 'Scoped + revocable' },
    gpg: { mark: 'no', text: 'Not supported' },
    ssh: { mark: 'no', text: 'Not supported' },
    sigstore: { mark: 'no', text: 'Not supported' },
  },
];

function Mark({ cell }: { cell: Cell }) {
  const tone =
    cell.mark === 'yes'
      ? 'text-seal-deep'
      : cell.mark === 'no'
        ? 'text-ink-faint line-through decoration-rule'
        : cell.mark === 'partial'
          ? 'text-ink-soft'
          : 'text-ink-soft';
  return <span className={`font-mono text-sm ${tone}`}>{cell.text}</span>;
}

function CompareTable({ rows, caption }: { rows: Row[]; caption: string }) {
  return (
    <div className="mt-12 overflow-x-auto">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-seal">{caption}</p>
      <table className="mt-4 w-full min-w-[640px]">
        <thead>
          <tr className="border-b-2 border-ink/80 text-left">
            <th className="py-3 pr-4 font-display text-base font-medium text-ink">Feature</th>
            <th className="py-3 pr-4 font-display text-base font-medium text-seal-deep">Auths</th>
            <th className="py-3 pr-4 font-display text-base font-medium text-ink">GPG</th>
            <th className="py-3 pr-4 font-display text-base font-medium text-ink">SSH</th>
            <th className="py-3 font-display text-base font-medium text-ink">Sigstore</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-rule align-top">
              <td className="py-4 pr-4 text-base text-ink">{row.feature}</td>
              <td className="py-4 pr-4"><Mark cell={row.auths} /></td>
              <td className="py-4 pr-4"><Mark cell={row.gpg} /></td>
              <td className="py-4 pr-4"><Mark cell={row.ssh} /></td>
              <td className="py-4"><Mark cell={row.sigstore} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-5xl px-6 pt-36 pb-24">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          The honest version
        </p>
        <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
          Auths vs. GPG vs. SSH vs. Sigstore
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-soft">
          A fair comparison — including where the alternatives win. Sigstore has the
          ecosystem and the SLSA story. GPG and SSH work offline and light up GitHub&apos;s
          Verified badge today. Auths is the column where offline verification, persistent
          identity, agent delegation, and clean revocation all hold at once.
        </p>

        <CompareTable rows={GENERAL} caption="General" />
        <CompareTable rows={ATTACK} caption="Supply-chain attack scenarios" />

        <div className="mt-16 border-t border-rule pt-8">
          <p className="max-w-2xl text-base leading-7 text-ink-soft">
            Want the long-form reasoning? Read{' '}
            <a href="/blog/why_not_gpg" className="border-b border-seal/40 text-seal hover:border-seal">
              The Three Paths to Signing a Commit
            </a>{' '}
            and{' '}
            <a href="/blog/sigstore-without-oidc" className="border-b border-seal/40 text-seal hover:border-seal">
              Sigstore&apos;s Public Ledger, Without the Login Screen
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
