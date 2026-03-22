'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import type { ArtifactEntry } from '@/lib/api/registry';
import { AuthsVerifyWidget } from '@/components/auths-verify-widget';

interface CompletionProps {
  artifact: ArtifactEntry | null;
  redirectTo?: string;
}

function isSameOriginPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function Completion({ artifact, redirectTo }: CompletionProps) {
  const { auth } = useAuth();
  const safeRedirect = redirectTo && isSameOriginPath(redirectTo) ? redirectTo : undefined;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          You&apos;re set up
        </h3>
        <p className="text-sm text-zinc-400">
          Your identity is live and your first artifact is published on the transparency log.
        </p>
      </div>

      {artifact && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
          <h4 className="text-sm font-semibold text-zinc-200 mb-3">Published artifact</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Package</dt>
              <dd className="text-zinc-200 font-mono text-xs">{artifact.package_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Digest</dt>
              <dd className="text-zinc-200 font-mono text-xs">{artifact.digest_hex.slice(0, 16)}...</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Published</dt>
              <dd className="text-zinc-200">{new Date(artifact.published_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
        <h4 className="text-lg font-semibold text-zinc-100 mb-2">Verify in your browser</h4>
        <p className="text-sm text-zinc-400 mb-2">
          Drop any <code className="text-emerald-400">.auths.json</code> attestation file to verify it via WebAssembly.
        </p>
        <p className="text-xs text-zinc-500 mb-4">
          Your .auths.json file is in the same directory as the file you signed.
        </p>
        <AuthsVerifyWidget mode="detail" size="lg" />
      </div>

      <div className="flex gap-4 justify-center">
        {safeRedirect ? (
          <>
            <Link
              href={safeRedirect}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Continue to join org
            </Link>
            <Link
              href="/registry"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Explore the registry
            </Link>
          </>
        ) : (
          <>
            <Link
              href={auth ? `/registry/identity/${encodeURIComponent(auth.did)}` : '/registry'}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Explore the registry
            </Link>
            <Link
              href="/try?flow=org"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Set up an organization
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
