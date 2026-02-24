'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import Avatar from 'boring-avatars';
import { QRCodeSVG } from 'qrcode.react';
import { useIdentityProfile } from '@/lib/queries/registry';
import { truncateMiddle } from '@/lib/format';
import { ClaimIdentityCTA } from '@/components/claim-identity-cta';
import { BackToRegistry } from '@/components/back-to-registry';
import { PlatformPassport } from '@/components/platform-passport';
import { KeyDisplay } from '@/components/key-display';
import { ArtifactPortfolio } from '@/components/artifact-portfolio';
import type { TrustTier, IdentityProfile } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Trust tier styling
// ---------------------------------------------------------------------------

const TIER_STYLES: Record<TrustTier, { color: string; label: string }> = {
  seedling: { color: 'text-zinc-500 border-zinc-700 bg-zinc-900', label: 'Seedling' },
  verified: { color: 'text-blue-400 border-blue-800 bg-blue-950', label: 'Verified' },
  trusted: { color: 'text-emerald-400 border-emerald-800 bg-emerald-950', label: 'Trusted' },
  sovereign: { color: 'text-amber-400 border-amber-800 bg-amber-950', label: 'Sovereign' },
};

// ---------------------------------------------------------------------------
// CopyButton (reusable clipboard pattern)
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      aria-label="Copy to clipboard"
    >
      {copied ? <span className="text-green-400">Copied!</span> : 'Copy'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Identity Header (Zone A)
// ---------------------------------------------------------------------------

function IdentityHeader({ profile }: { profile: IdentityProfile }) {
  const tierStyle = TIER_STYLES[profile.trust_tier];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.github_username ? (
            <img
              src={`https://github.com/${profile.github_username}.png?s=128`}
              alt={profile.github_username}
              width={96}
              height={96}
              className="rounded-full border-2 border-zinc-700"
            />
          ) : (
            <div className="overflow-hidden rounded-full border-2 border-zinc-700">
              <Avatar size={96} name={profile.did} variant="beam" />
            </div>
          )}
        </div>

        {/* Identity info */}
        <div className="min-w-0 flex-1">
          {profile.github_username && (
            <h1 className="text-xl font-semibold text-white">
              @{profile.github_username}
            </h1>
          )}

          {/* DID with copy */}
          <div className="mt-1 flex items-center gap-2">
            <span
              className="truncate font-mono text-sm text-emerald-400"
              title={profile.did}
            >
              {truncateMiddle(profile.did, 48)}
            </span>
            <CopyButton text={profile.did} />
          </div>

          {/* Trust tier badge */}
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tierStyle.color}`}
            >
              {tierStyle.label}
            </span>
            <span className="text-xs text-zinc-500">
              Trust Score: {profile.trust_score}/100
            </span>
          </div>

          {/* Stats */}
          <div className="mt-3 flex gap-6 text-xs text-zinc-500">
            <span>
              <strong className="text-zinc-300">{profile.platform_claims.length}</strong>{' '}
              attestation{profile.platform_claims.length !== 1 ? 's' : ''}
            </span>
            <span>
              <strong className="text-zinc-300">{profile.public_keys.length}</strong>{' '}
              key{profile.public_keys.length !== 1 ? 's' : ''}
            </span>
            <span>
              <strong className="text-zinc-300">{profile.total_signatures}</strong>{' '}
              signature{profile.total_signatures !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 rounded-lg border border-zinc-800 bg-white p-2">
          <QRCodeSVG value={profile.did} size={96} />
        </div>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Unclaimed Identity Header
// ---------------------------------------------------------------------------

function UnclaimedHeader({ did }: { did: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="opacity-40">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0 overflow-hidden rounded-full border-2 border-zinc-700">
            <Avatar size={96} name={did} variant="beam" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="truncate font-mono text-sm text-zinc-500"
                title={did}
              >
                {truncateMiddle(did, 48)}
              </span>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-500">
                Unregistered
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ClaimIdentityCTA did={did} />
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// IdentityClient — shell for all four zones
// ---------------------------------------------------------------------------

export function IdentityClient({ did }: { did: string }) {
  const { data, isLoading, isError, error } = useIdentityProfile(did);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted-bg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <>
        <BackToRegistry />
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 font-mono text-sm text-red-400">
          <p className="font-semibold">Failed to load identity</p>
          <p className="mt-1 text-red-500/70">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </>
    );
  }

  if (!data) return null;

  if (data.status === 'unclaimed') {
    return (
      <>
        <BackToRegistry />
        <UnclaimedHeader did={did} />
      </>
    );
  }

  // Active identity — render all zones
  const profile = data as IdentityProfile;

  return (
    <>
      <BackToRegistry />
      <div className="space-y-12">
        {/* Zone A: Identity Header */}
        <IdentityHeader profile={profile} />

        {/* Zone B: Platform Passport */}
        <PlatformPassport claims={profile.platform_claims} />

        {/* Zone C: Key Display */}
        <KeyDisplay publicKeys={profile.public_keys} />

        {/* Zone D: Artifact Portfolio */}
        <ArtifactPortfolio artifacts={profile.artifacts} />
      </div>
    </>
  );
}
