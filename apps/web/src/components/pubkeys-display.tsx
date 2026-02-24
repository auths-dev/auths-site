/**
 * Renders the public keys and platform claims for a resolved identity.
 *
 * Used when an identity search (`@username` or `gitlab:namespace`) returns
 * keys from the registry. Each verified platform claim shows a green badge.
 *
 * @param data - The `PubkeysResponse` from `GET /v1/pubkeys`.
 *
 * @example
 * <PubkeysDisplay data={pubkeysResponse} />
 */

'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { PubkeysResponse } from '@/lib/api/registry';

export function PubkeysDisplay({ data, fromQuery }: { data: PubkeysResponse; fromQuery?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Identity
        </h2>
        <p className="truncate font-mono text-sm text-verified" title={data.did}>
          {data.did}
        </p>
      </div>

      {data.platform_claims.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Platform Claims
          </h3>
          <div className="space-y-2">
            {data.platform_claims.map((claim) => (
              <div
                key={`${claim.platform}-${claim.namespace}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3"
              >
                <span className="text-sm text-zinc-300">{claim.platform}</span>
                <span className="font-mono text-sm text-white">{claim.namespace}</span>
                {claim.verified && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-verified">
                    <span className="h-1.5 w-1.5 rounded-full bg-verified" />
                    Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.public_keys.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Public Keys
          </h3>
          <div className="space-y-2">
            {data.public_keys.map((key) => (
              <div
                key={key.key_id}
                className="rounded-lg border border-border bg-muted-bg px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs text-zinc-400">{key.algorithm}</span>
                  <span className="text-xs text-zinc-600">{key.key_id}</span>
                </div>
                <p
                  className="mt-1 truncate font-mono text-xs text-zinc-300"
                  title={key.public_key_hex}
                >
                  {key.public_key_hex}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/registry/identity/${encodeURIComponent(data.did)}${fromQuery ? `?from_query=${encodeURIComponent(fromQuery)}` : ''}`}
        className="inline-flex items-center gap-1.5 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
      >
        View Full Profile
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </motion.div>
  );
}
