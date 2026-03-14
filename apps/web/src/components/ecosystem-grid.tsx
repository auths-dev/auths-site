'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from 'boring-avatars';
import { motion } from 'motion/react';
import { EcosystemIcon } from '@/components/icons/brand-icon';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

interface EcosystemDef {
  name: string;
  key: string;
  query: string;
}

const ECOSYSTEMS: EcosystemDef[] = [
  { name: 'npm', key: 'npm', query: 'npm:' },
  { name: 'PyPI', key: 'pypi', query: 'pypi:' },
  { name: 'Cargo', key: 'cargo', query: 'cargo:' },
  { name: 'Docker', key: 'docker', query: 'docker:' },
  { name: 'Go', key: 'go', query: 'go:' },
  { name: 'Maven', key: 'maven', query: 'maven:' },
  { name: 'NuGet', key: 'nuget', query: 'nuget:' },
];

const FEATURED_PACKAGES = [
  { label: 'npm:react', ecosystem: 'npm' },
  { label: 'cargo:serde', ecosystem: 'cargo' },
  { label: 'npm:auths-cli', ecosystem: 'npm' },
];

const FEATURED_ORGS = [
  { name: 'Linux Kernel Project', did: 'did:keri:ELinux_Kernel_Project_Organization_0001' },
];

export function EcosystemGrid() {
  const router = useRouter();

  function navigateToSearch(query: string) {
    router.push(`/registry?q=${encodeURIComponent(query)}`);
  }

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Browse Ecosystems
      </h2>

      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        {ECOSYSTEMS.map((eco) => (
          <motion.button
            key={eco.name}
            type="button"
            variants={staggerItem}
            onClick={() => router.push(`/registry/browse/${eco.key}`)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted-bg p-4 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <EcosystemIcon ecosystem={eco.key} size={40} className="text-zinc-300" />
            <span className="text-xs text-zinc-400">{eco.name}</span>
          </motion.button>
        ))}
      </motion.div>

      <div className="mt-6">
        <p className="mb-3 text-xs text-zinc-600">Featured packages</p>
        <div className="flex flex-wrap gap-2">
          {FEATURED_PACKAGES.map((pkg) => (
            <button
              key={pkg.label}
              type="button"
              onClick={() => navigateToSearch(pkg.label)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted-bg px-3 py-2 font-mono text-xs text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
            >
              <EcosystemIcon ecosystem={pkg.ecosystem} size={14} className="text-zinc-500" />
              {pkg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs text-zinc-600">Organizations</p>
        <div className="flex flex-wrap gap-2">
          {FEATURED_ORGS.map((org) => (
            <Link
              key={org.did}
              href={`/registry/org/${encodeURIComponent(org.did)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted-bg px-3 py-2 font-mono text-xs text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
            >
              <div className="shrink-0 overflow-hidden rounded-full">
                <Avatar size={14} name={org.did} variant="bauhaus" />
              </div>
              {org.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
