'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Avatar from 'boring-avatars';
import { truncateMiddle } from '@/lib/format';
import type { PackageSigner } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Signer Card
// ---------------------------------------------------------------------------

function SignerCard({
  signer,
  index,
  ghost,
}: {
  signer: PackageSigner;
  index: number;
  ghost?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      className={`rounded-lg border px-4 py-3 ${
        ghost
          ? 'border-dashed border-border bg-muted-bg opacity-40'
          : 'border-border bg-muted-bg'
      }`}
    >
      <Link
        href={`/registry/identity/${encodeURIComponent(signer.did)}`}
        className="flex items-center gap-3 group"
      >
        {/* Avatar */}
        <div className="shrink-0">
          {signer.github_username ? (
            <img
              src={`https://github.com/${signer.github_username}.png?s=64`}
              alt={signer.github_username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="overflow-hidden rounded-full">
              <Avatar size={40} name={signer.did} variant="beam" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
              {signer.github_username
                ? `@${signer.github_username}`
                : truncateMiddle(signer.did, 20)}
            </p>
            {signer.verified && !ghost && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            )}
            {ghost && (
              <span className="text-xs text-zinc-600">Unprotected</span>
            )}
          </div>
          {!ghost && (
            <p className="text-xs text-zinc-500">
              {signer.signature_count} signature{signer.signature_count !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AuthorizedSigners
// ---------------------------------------------------------------------------

export function AuthorizedSigners({
  signers,
  packageUrl,
}: {
  signers: PackageSigner[];
  packageUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    try {
      const url = typeof window !== 'undefined'
        ? window.location.origin + packageUrl
        : packageUrl;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [packageUrl]);

  if (signers.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Authorized Signers
        </h2>
        <p className="text-sm text-zinc-500">No registered signers.</p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
    >
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Authorized Signers
        </h2>
        <span className="text-xs text-zinc-600">
          {signers.length} registered signer{signers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {signers.map((signer, i) => (
          <SignerCard key={signer.did} signer={signer} index={i} />
        ))}
      </div>

      {/* Invite CTA */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-zinc-700 px-4 py-3">
        <p className="text-sm text-zinc-500">
          Know other maintainers? Share this link to secure their publishing rights.
        </p>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="shrink-0 rounded px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <span className="text-green-400">Copied!</span> : 'Copy Link'}
        </button>
      </div>
    </motion.section>
  );
}
