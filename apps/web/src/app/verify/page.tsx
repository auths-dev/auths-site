import type { Metadata } from 'next';
import { resolveFromRepo } from '@/lib/resolver';
import { VerifyResult } from './verify-result';

// SSR safety note: resolveFromRepo calls github.ts / gitea.ts which use atob().
// atob() is a Node.js 16+ global — safe in Next.js (requires Node 18+).
// No window, document, DOMParser, or localStorage references in the resolver chain.

type Props = {
  searchParams: Promise<{ repo?: string; commit?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { repo, commit } = await searchParams;

  if (!repo) {
    return {
      title: 'Verify',
      description: 'Verify a commit or repository identity using Auths.',
    };
  }

  let result;
  try {
    result = await resolveFromRepo(`https://${repo}`);
  } catch {
    result = null;
  }

  const valid = result?.bundle != null;
  const signer = result?.bundle?.identity_did ?? 'Unknown';
  const shortCommit = commit ? commit.slice(0, 7) : null;

  // OG title must stay under 60 chars for Slack unfurl
  const ogTitle = valid ? '✅ Verified Identity' : '❌ Identity Not Found';
  const ogDescription = valid
    ? `Signed by ${signer.slice(0, 40)}${shortCommit ? ` · commit ${shortCommit}` : ''}`
    : `No cryptographic identity found for ${repo}.`;

  return {
    title: valid ? '✅ Verified Identity' : '❌ Identity Not Found',
    description: valid
      ? `Identity ${signer} verified via decentralized KERI protocol.`
      : `No cryptographic identity found for ${repo}.`,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
    },
  };
}

export default async function VerifyPage({ searchParams }: Props) {
  const { repo, commit } = await searchParams;

  if (!repo) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-28 pb-20">
        <h1 className="mb-6 text-2xl font-semibold text-white">Verify</h1>
        <p className="text-zinc-400">
          Pass a <span className="font-mono text-zinc-300">?repo=github.com/org/repo</span> parameter
          to verify a repository&apos;s cryptographic identity, or use the{' '}
          <a href="/explorer" className="text-[var(--accent-verified)] hover:underline">
            Identity Explorer
          </a>
          .
        </p>
      </div>
    );
  }

  let result;
  try {
    result = await resolveFromRepo(`https://${repo}`);
  } catch {
    result = { bundle: null, error: 'Resolver error' };
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <h1 className="mb-8 text-2xl font-semibold text-white">Verify</h1>
      <VerifyResult result={result} repo={repo} commit={commit} />
    </div>
  );
}
