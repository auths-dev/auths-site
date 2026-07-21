import type { Metadata } from 'next';
import { SectionMark, InkLink } from '@auths/ledger-ui';
import { EvidenceDropzone } from '@/components/evidence-dropzone';
import { OfflineParity } from '@/components/offline-parity';

const DOCS = 'https://docs.auths.dev/witness-network';

export const metadata: Metadata = {
  title: 'Evidence drop-zone',
  description:
    'Drop an evidence pack and verify it entirely in your browser. Nothing is uploaded.',
};

export default function EvidencePage() {
  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          The evidence drop-zone
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Verify a bundle without handing it to anyone.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          The whole thesis, in one interaction: drop an evidence pack, and the verifier recomputes
          it in this browser tab. No server sees the file. The verdict you get is the verdict{' '}
          <span className="font-mono text-base text-ink">auths verify</span> gives — because it is
          the same verifier, compiled to WASM.
        </p>

        <div className="mt-12">
          <EvidenceDropzone />
        </div>

        <div className="mt-16">
          <SectionMark n="01" title="The same check, at a terminal." id="offline" />
          <p className="mt-8 max-w-2xl text-base leading-7 text-ink-soft">
            Prefer not to trust a browser tab either? The published CLI runs the identical
            verification offline — and the same commands re-check anything the explorer shows you:
            a member&rsquo;s key history, a signed commit, or a co-signed anchor.
          </p>
          <div className="mt-6">
            <OfflineParity
              label="the same claims, without this page"
              lines={[
                { comment: 'verify an evidence pack file', cmd: 'auths verify ./bundle.json' },
                { comment: 'verify a signed commit against its pinned root', cmd: 'auths verify <commit>' },
                {
                  comment: 'mirror a witness’s key histories locally',
                  cmd: `git fetch 'https://auths-network.fly.dev' '+refs/auths/kel/*:refs/auths/kel/*'`,
                },
                { comment: 'verify a co-signed anchor', cmd: 'auths anchor verify <seed>' },
              ]}
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <InkLink href={`${DOCS}/users/verify-an-anchored-attestation`}>
              How verifiers read freshness
            </InkLink>
            <InkLink href="https://github.com/auths-dev/auths">The verifier source</InkLink>
          </div>
        </div>
      </div>
    </div>
  );
}
