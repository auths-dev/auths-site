import type { Metadata } from 'next';
import { Hero } from '@/components/hero';
import { resolveFromRepo } from '@/lib/resolver';
import { VerifyResult } from './verify-result';

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

  const ogTitle = valid ? '\u2705 Verified Identity' : '\u274C Identity Not Found';
  const ogDescription = valid
    ? `Signed by ${signer.slice(0, 40)}${shortCommit ? ` \u00b7 commit ${shortCommit}` : ''}`
    : `No cryptographic identity found for ${repo}.`;

  return {
    title: valid ? '\u2705 Verified Identity' : '\u274C Identity Not Found',
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

  // Deep-link with ?repo= param — SSR verification result
  if (repo) {
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

  // Default: marketing framing + interactive Hero widget
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <h1 className="text-base font-semibold leading-7 text-blue-400">
              Local WASM Engine
            </h1>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl font-mono">
              Don&apos;t trust. Verify.
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Drop an artifact hash below. Our in-browser WebAssembly engine
              reconstructs the cryptographic chain of trust without ever pinging
              a server.
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-md">
              <Hero />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
