import type { FeedEntry } from '@/lib/api/registry';
import { truncateMiddle, splitPackageName } from '@/lib/format';

export function entryDetail(entry: FeedEntry): {
  didLink?: { href: string; label: string };
  packageLink?: { href: string; label: string };
  text?: string;
} {
  const meta = entry.metadata;

  const targetDid =
    (meta.member_did as string | undefined) ??
    (meta.device_did as string | undefined) ??
    (meta.subject_did as string | undefined) ??
    (meta.delegate_did as string | undefined) ??
    (meta.new_owner_did as string | undefined);
  const didLink = targetDid
    ? { href: `/registry/identity/${encodeURIComponent(targetDid)}`, label: truncateMiddle(targetDid, 24) }
    : undefined;

  const rawPackageName = meta.package_name as string | undefined;
  let packageLink: { href: string; label: string } | undefined;
  if (rawPackageName) {
    const { ecosystem: eco, name } = splitPackageName(rawPackageName);
    packageLink = {
      href: `/registry/package/${encodeURIComponent(eco)}/${name.split('/').map(encodeURIComponent).join('/')}`,
      label: `${eco}:${name}`,
    };
  }

  const displayName = meta.display_name as string | undefined;
  const tier = meta.tier as string | undefined;
  const reason = meta.reason as string | undefined;
  const text = displayName ?? (tier ? `tier: ${tier}` : undefined) ?? reason ?? undefined;

  return { didLink, packageLink, text };
}
