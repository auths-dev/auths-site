'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Avatar from 'boring-avatars';
import { useQuery } from '@tanstack/react-query';
import { useIdentityProfile, registryKeys } from '@/lib/queries/registry';
import { fetchActivityFeed } from '@/lib/api/registry';
import type { FeedEntry, ArtifactEntry, IdentityProfile } from '@/lib/api/registry';
import { truncateMiddle, formatRelativeTime } from '@/lib/format';
import { BackToRegistry } from '@/components/back-to-registry';
import { CopyButton } from '@/components/copy-button';
import { ACTIVITY_EVENT_CONFIG } from '@/lib/activity-events';
import { entryDetail } from '@/lib/entry-detail';
import { TrustTierBadge } from '@/components/trust-tier-badge';

// ---------------------------------------------------------------------------
// OrgHeader
// ---------------------------------------------------------------------------

function OrgHeader({ profile }: { profile: IdentityProfile }) {

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="shrink-0 overflow-hidden rounded-xl border-2 border-zinc-700">
          <Avatar size={96} name={profile.did} variant="bauhaus" />
        </div>

        <div className="min-w-0 flex-1">
          {profile.github_username && (
            <h1 className="text-xl font-semibold text-white">
              @{profile.github_username}
            </h1>
          )}

          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500">ORG</span>
            <span
              className="truncate font-mono text-sm text-emerald-400"
              title={profile.did}
            >
              {truncateMiddle(profile.did, 48)}
            </span>
            <CopyButton text={profile.did} />
          </div>

          <div className="mt-3">
            <TrustTierBadge
              tier={profile.trust_tier}
              score={profile.trust_score}
              breakdown={profile.trust_breakdown}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// OrgMembers — derived from audit feed
// ---------------------------------------------------------------------------

const INITIAL_CAP = 6;

function OrgMembers({ members }: { members: FeedEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? members : members.slice(0, INITIAL_CAP);
  const hasMore = members.length > INITIAL_CAP;

  if (members.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
          Members
        </h2>
        <p className="py-4 text-center font-mono text-xs text-zinc-600">
          No members found
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
        Members
      </h2>
      <div className="space-y-2">
        {visible.map((entry, i) => {
          const memberDid = entry.metadata.member_did as string | undefined;
          return (
            <div
              key={`${memberDid}-${i}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs hover:bg-zinc-900/60"
            >
              <div className="shrink-0 overflow-hidden rounded-full">
                <Avatar size={24} name={memberDid ?? ''} variant="beam" />
              </div>
              {memberDid ? (
                <Link
                  href={`/registry/identity/${encodeURIComponent(memberDid)}`}
                  className="text-zinc-300 transition-colors hover:text-emerald-400 hover:underline"
                >
                  {truncateMiddle(memberDid, 32)}
                </Link>
              ) : (
                <span className="text-zinc-500">Unknown</span>
              )}
              <span className="ml-auto text-zinc-600">
                {formatRelativeTime(entry.occurred_at)}
              </span>
            </div>
          );
        })}
      </div>
      {hasMore && !showAll && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            View All ({members.length})
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// OrgNamespaces — packages owned by the org
// ---------------------------------------------------------------------------

function parsePackageName(packageName: string): {
  ecosystem: string;
  name: string;
} {
  const idx = packageName.indexOf(':');
  if (idx > 0) {
    return {
      ecosystem: packageName.slice(0, idx),
      name: packageName.slice(idx + 1),
    };
  }
  return { ecosystem: 'unknown', name: packageName };
}

function OrgNamespaces({ artifacts }: { artifacts: ArtifactEntry[] }) {
  const [showAll, setShowAll] = useState(false);

  const uniquePackages = useMemo(() => {
    const seen = new Set<string>();
    return artifacts.filter((a) => {
      if (seen.has(a.package_name)) return false;
      seen.add(a.package_name);
      return true;
    });
  }, [artifacts]);

  const visible = showAll ? uniquePackages : uniquePackages.slice(0, INITIAL_CAP);
  const hasMore = uniquePackages.length > INITIAL_CAP;

  if (uniquePackages.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
          Namespaces
        </h2>
        <p className="py-4 text-center font-mono text-xs text-zinc-600">
          No packages found
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
        Namespaces
      </h2>
      <div className="space-y-1">
        {visible.map((pkg) => {
          const { ecosystem, name } = parsePackageName(pkg.package_name);

          return (
            <Link
              key={pkg.package_name}
              href={`/registry/package/${encodeURIComponent(ecosystem)}/${name.split('/').map(encodeURIComponent).join('/')}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs text-zinc-300 transition-colors hover:bg-zinc-900/60 hover:text-emerald-400"
            >
              <span>{pkg.package_name}</span>
              <span className="ml-auto text-zinc-600">
                {formatRelativeTime(pkg.published_at)}
              </span>
            </Link>
          );
        })}
      </div>
      {hasMore && !showAll && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            View All ({uniquePackages.length})
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// OrgActivity — recent audit log entries for this org
// ---------------------------------------------------------------------------

function OrgActivity({ entries }: { entries: FeedEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
          Recent Activity
        </h2>
        <p className="py-4 text-center font-mono text-xs text-zinc-600">
          No recent activity
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
        Recent Activity
      </h2>
      <div className="relative max-h-[420px] overflow-y-auto">
        <div className="space-y-0.5">
          {entries.map((entry, i) => {
            const config = ACTIVITY_EVENT_CONFIG[entry.entry_type];
            const { didLink, packageLink, text } = entryDetail(entry);
            const hasDetail = didLink || packageLink || text;

            return (
              <div
                key={`${entry.entry_type}-${entry.occurred_at}-${i}`}
                className="flex items-center gap-2 rounded px-2 py-1 font-mono text-xs hover:bg-zinc-900/60"
              >
                <time
                  dateTime={entry.occurred_at}
                  className="w-14 shrink-0 text-zinc-600"
                >
                  {formatRelativeTime(entry.occurred_at)}
                </time>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClass}`}
                />
                <span className="w-20 shrink-0 text-zinc-500">
                  [{config.label}]
                </span>
                {didLink && (
                  <Link
                    href={didLink.href}
                    className="text-zinc-300 transition-colors hover:text-emerald-400 hover:underline"
                  >
                    {didLink.label}
                  </Link>
                )}
                {packageLink && (
                  <Link
                    href={packageLink.href}
                    className="text-zinc-500 transition-colors hover:text-emerald-400 hover:underline"
                  >
                    {packageLink.label}
                  </Link>
                )}
                {text && !didLink && !packageLink && (
                  <span className="text-zinc-500">{text}</span>
                )}
                {!hasDetail && (
                  <span className="truncate text-zinc-600" title={entry.summary}>
                    {entry.summary}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-zinc-700">
                  #{entry.log_sequence}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// OrgClient — main component
// ---------------------------------------------------------------------------

export function OrgClient({ did }: { did: string }) {
  const { data: identity, isLoading, isError, error } = useIdentityProfile(did);

  const { data: activityData } = useQuery({
    queryKey: registryKeys.activityFeed({ actor: did }),
    queryFn: () => fetchActivityFeed({ actor: did }),
    staleTime: 120_000,
  });

  const orgEntries = activityData?.entries ?? [];

  const memberEntries = useMemo(() => {
    return orgEntries.filter((e) => e.entry_type === 'org_add_member');
  }, [orgEntries]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-900/50" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <>
        <BackToRegistry />
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 font-mono text-sm text-red-400">
          <p className="font-semibold">Failed to load organization</p>
          <p className="mt-1 text-red-500/70">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </>
    );
  }

  if (!identity) return null;

  if (identity.status === 'unclaimed') {
    return (
      <>
        <BackToRegistry />
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="overflow-hidden rounded-xl border-2 border-zinc-700 opacity-40">
            <Avatar size={96} name={did} variant="bauhaus" />
          </div>
          <span className="font-mono text-sm text-zinc-500">
            {truncateMiddle(did, 48)}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-500">
            Organization not registered
          </span>
        </div>
      </>
    );
  }

  const profile = identity as IdentityProfile;

  return (
    <>
      <BackToRegistry />
      <div className="space-y-12">
        <OrgHeader profile={profile} />
        <OrgMembers members={memberEntries} />
        <OrgNamespaces artifacts={profile.artifacts} />
        <OrgActivity entries={orgEntries} />
      </div>
    </>
  );
}
