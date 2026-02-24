'use client';

import { motion } from 'motion/react';
import { usePackageDetail } from '@/lib/queries/registry';
import { BackToRegistry } from '@/components/back-to-registry';
import { EcosystemIcon } from '@/components/icons/ecosystem-icon';
import { TerminalBlock } from '@/components/terminal-block';
import { ChainOfTrust } from '@/components/chain-of-trust';
import { AuthorizedSigners } from '@/components/authorized-signers';
import { ProvenanceLedger } from '@/components/provenance-ledger';
import { buildTrustChain } from '@/lib/api/registry';
import type { Ecosystem } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Install command generation
// ---------------------------------------------------------------------------

const INSTALL_COMMANDS: Record<string, (name: string) => string> = {
  npm: (name) => `npm install ${name}`,
  pypi: (name) => `pip install ${name}`,
  cargo: (name) => `cargo add ${name}`,
  docker: (name) => `docker pull ${name}`,
  go: (name) => `go get ${name}`,
  maven: (name) => `mvn dependency:get -Dartifact=${name}`,
  nuget: (name) => `dotnet add package ${name}`,
};

function getInstallCommand(ecosystem: string, name: string): string {
  const gen = INSTALL_COMMANDS[ecosystem.toLowerCase()];
  return gen ? gen(name) : `${ecosystem} install ${name}`;
}

// ---------------------------------------------------------------------------
// Verification badge
// ---------------------------------------------------------------------------

function VerificationBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-800/30 bg-emerald-950/30 px-4 py-1.5 text-sm font-medium text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Cryptographically Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-500">
      Unverified
    </span>
  );
}

// ---------------------------------------------------------------------------
// Not Found state
// ---------------------------------------------------------------------------

function PackageNotFound({
  ecosystem,
  name,
}: {
  ecosystem: string;
  name: string;
}) {
  const commands = `auths artifact sign --package ${ecosystem}:${name}\nauths artifact publish`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-lg border border-dashed border-border p-8 text-center"
    >
      <h2 className="mb-2 text-xl font-semibold text-white">
        No cryptographic signatures found
      </h2>
      <p className="mb-6 text-muted">
        This package has no cryptographic signatures on the Auths Registry.
        Be the first to sign it:
      </p>
      <TerminalBlock commands={commands} />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Package Header (Zone A)
// ---------------------------------------------------------------------------

function PackageHeader({
  ecosystem,
  name,
  verified,
}: {
  ecosystem: string;
  name: string;
  verified: boolean;
}) {
  const installCmd = getInstallCommand(ecosystem, name);
  const verifyCmd = `auths artifact verify --package ${ecosystem}:${name}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Ecosystem icon + package name */}
      <div className="flex items-center gap-3">
        <EcosystemIcon ecosystem={ecosystem} size={32} className="text-zinc-300" />
        <h1 className="font-mono text-2xl font-bold text-white">
          {ecosystem}:{name}
        </h1>
      </div>

      {/* Verification badge */}
      <div className="mt-4">
        <VerificationBadge verified={verified} />
      </div>

      {/* Terminal blocks: install + verify */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Install
          </p>
          <TerminalBlock commands={installCmd} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Verify
          </p>
          <TerminalBlock commands={verifyCmd} />
        </div>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// PackageClient — shell for all four zones
// ---------------------------------------------------------------------------

export function PackageClient({
  ecosystem,
  name,
}: {
  ecosystem: string;
  name: string;
}) {
  const { data, isLoading, isError, error } = usePackageDetail(ecosystem, name);

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
          <p className="font-semibold">Failed to load package</p>
          <p className="mt-1 text-red-500/70">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </>
    );
  }

  if (!data || (data.releases.length === 0 && data.signers.length === 0)) {
    return (
      <>
        <BackToRegistry />
        <PackageNotFound ecosystem={ecosystem} name={name} />
      </>
    );
  }

  return (
    <>
    <BackToRegistry />
    <div className="space-y-12">
      {/* Zone A: Package Header */}
      <PackageHeader
        ecosystem={ecosystem}
        name={name}
        verified={data.verified}
      />

      {/* Zone B: Chain of Trust Timeline */}
      {data.releases.length > 0 && (
        <ChainOfTrust nodes={buildTrustChain(data.releases[0])} />
      )}

      {/* Zone C: Authorized Signers */}
      <AuthorizedSigners
        signers={data.signers}
        packageUrl={`/registry/package/${encodeURIComponent(ecosystem)}/${name.split('/').map(encodeURIComponent).join('/')}`}
      />

      {/* Zone D: Provenance Ledger */}
      <ProvenanceLedger releases={data.releases} />
    </div>
    </>
  );
}
