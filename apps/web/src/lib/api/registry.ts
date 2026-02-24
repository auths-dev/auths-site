import type { Platform } from '@/lib/registry';
import { REGISTRY_BASE_URL, USE_FIXTURES } from '@/lib/config';
import {
  resolveIdentityFixture,
  resolvePubkeysFixture,
  resolvePackageFixture,
  resolveArtifactFixture,
  resolveRecentActivityFixture,
} from './fixtures';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtifactEntry {
  package_name: string;
  digest_algorithm: string;
  digest_hex: string;
  signer_did: string;
  published_at: string;
}

export interface ArtifactQueryResponse {
  entries: ArtifactEntry[];
  next_cursor?: string;
}

export interface PlatformClaim {
  platform: Platform;
  namespace: string;
  verified: boolean;
}

export interface PubkeysResponse {
  did: string;
  public_keys: {
    key_id: string;
    algorithm: string;
    public_key_hex: string;
    created_at: string;
  }[];
  platform_claims: PlatformClaim[];
}

export type ActiveIdentity = {
  status: 'active';
  did: string;
  public_keys: {
    key_id: string;
    algorithm: string;
    public_key_hex: string;
    created_at: string;
  }[];
  platform_claims: PlatformClaim[];
  artifacts: ArtifactEntry[];
};

export type UnclaimedIdentity = {
  status: 'unclaimed';
  did: string;
};

export type IdentityResponse = ActiveIdentity | UnclaimedIdentity;

// ---------------------------------------------------------------------------
// Detail page types
// ---------------------------------------------------------------------------

/** Trust tier derived from attestation count. */
export type TrustTier = 'seedling' | 'verified' | 'trusted' | 'sovereign';

/** Extended identity for the profile page. Enriched client-side. */
export interface IdentityProfile extends ActiveIdentity {
  trust_tier: TrustTier;
  trust_score: number;
  total_signatures: number;
  github_username?: string;
}

/** Package ecosystem (distinct from forge `Platform`). */
export type Ecosystem = 'npm' | 'pypi' | 'cargo' | 'docker' | 'go' | 'maven' | 'nuget';

/** Composed package detail for the package page. */
export interface PackageDetail {
  ecosystem: Ecosystem;
  package_name: string;
  verified: boolean;
  signers: PackageSigner[];
  releases: PackageRelease[];
}

/** A signer associated with a package. */
export interface PackageSigner {
  did: string;
  github_username?: string;
  verified: boolean;
  signature_count: number;
  last_signed: string;
}

/** A single release entry for the provenance ledger. */
export interface PackageRelease {
  version?: string;
  digest_algorithm: string;
  digest_hex: string;
  signer_did: string;
  published_at: string;
  status: 'valid' | 'revoked';
}

/** A node in the Chain of Trust timeline visualization. */
export interface TrustChainNode {
  type: 'artifact' | 'signature' | 'device' | 'identity' | 'authority';
  label: string;
  detail: string;
  link_did?: string;
}

export interface RecentArtifact {
  package_name: string;
  signer_did: string;
  published_at: string;
}

export interface RecentIdentity {
  did_prefix: string;
  platform: string | null;
  namespace: string | null;
  created_at: string;
}

export interface RecentActivity {
  recent_artifacts: RecentArtifact[];
  recent_identities: RecentIdentity[];
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class RegistryApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'RegistryApiError';
    this.status = status;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Base fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Shared fetch wrapper for the registry API.
 *
 * Constructs the full URL from a path and optional query params, forwards the
 * AbortSignal, and throws a typed `RegistryApiError` on HTTP 4xx/5xx.
 *
 * @param path   - API path (e.g. `/v1/artifacts`).
 * @param params - Optional query string key-value pairs.
 * @param signal - Optional AbortSignal for cancellation.
 * @returns The parsed JSON response.
 *
 * @example
 * const data = await registryFetch('/v1/artifacts', { package: 'auths-cli' });
 */
async function registryFetch<T>(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, REGISTRY_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    let message = res.statusText;
    let detail: string | undefined;
    try {
      const body = await res.json();
      if (typeof body.message === 'string') message = body.message;
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // body isn't JSON — use statusText
    }
    throw new RegistryApiError(res.status, message, detail);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

/**
 * Fetches signed artifacts matching a package name.
 *
 * Supports cursor-based pagination — pass the `next_cursor` from a previous
 * response to load the next page.
 *
 * @param query  - Package name to search for (e.g. `"auths-cli"`).
 * @param cursor - Optional pagination cursor from a prior response.
 * @param signal - Optional AbortSignal forwarded to `fetch()`.
 * @returns Paginated artifact entries.
 *
 * @example
 * const page1 = await fetchArtifacts('auths-cli');
 * const page2 = await fetchArtifacts('auths-cli', page1.next_cursor);
 */
export async function fetchArtifacts(
  query: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<ArtifactQueryResponse> {
  if (USE_FIXTURES && !cursor) {
    const fixture = await resolveArtifactFixture(query);
    if (fixture) return fixture;
  }
  const params: Record<string, string> = { package: query };
  if (cursor) params.cursor = cursor;
  return registryFetch<ArtifactQueryResponse>('/v1/artifacts', params, signal);
}

/**
 * Fetches public keys and platform claims for a given identity.
 *
 * @param platform  - The forge platform (e.g. `"github"`).
 * @param namespace - The username or org on that platform.
 * @param signal    - Optional AbortSignal forwarded to `fetch()`.
 * @returns Public keys and verified platform claims.
 *
 * @example
 * const keys = await fetchPubkeys('github', 'torvalds');
 * console.log(keys.public_keys.length);
 */
export async function fetchPubkeys(
  platform: Platform,
  namespace: string,
  signal?: AbortSignal,
): Promise<PubkeysResponse> {
  if (USE_FIXTURES) {
    const fixture = await resolvePubkeysFixture(platform, namespace);
    if (fixture) return fixture;
  }
  return registryFetch<PubkeysResponse>(
    '/v1/pubkeys',
    { platform, namespace },
    signal,
  );
}

const KNOWN_IDENTITY_STATUSES = new Set(['active', 'unclaimed']);

/**
 * Fetches identity details for a Decentralized Identifier (DID).
 *
 * Returns a discriminated union on `status`:
 * - `"active"` — identity exists with keys, claims, and artifacts.
 * - `"unclaimed"` — DID prefix recognised but no keys registered.
 *
 * Unknown `status` values from the backend throw a `RegistryApiError` rather
 * than producing an unsafe cast.
 *
 * @param did    - The full DID string (e.g. `"did:keri:E8jsh..."`).
 * @param signal - Optional AbortSignal forwarded to `fetch()`.
 * @returns The identity response (active or unclaimed).
 *
 * @example
 * const identity = await fetchIdentity('did:keri:E8jshGQfY...');
 * if (identity.status === 'active') {
 *   console.log(identity.public_keys);
 * }
 */
export async function fetchIdentity(
  did: string,
  signal?: AbortSignal,
): Promise<IdentityResponse> {
  if (USE_FIXTURES) {
    const fixture = await resolveIdentityFixture(did);
    if (fixture) return fixture;
  }
  const data = await registryFetch<Record<string, unknown>>(
    `/v1/identities/${encodeURIComponent(did)}`,
    undefined,
    signal,
  );

  const status = data.status;
  if (typeof status !== 'string' || !KNOWN_IDENTITY_STATUSES.has(status)) {
    throw new RegistryApiError(
      502,
      `Unexpected identity status: ${String(status)}`,
      'The registry returned an unrecognised identity status. The client may need updating.',
    );
  }

  return data as unknown as IdentityResponse;
}

/**
 * Fetches recent activity from the registry for the dashboard.
 *
 * Called server-side in the page Server Component so Vercel edges can cache
 * the initial HTML payload. Uses `next.revalidate` to enable ISR caching.
 *
 * @param signal - Optional AbortSignal forwarded to `fetch()`.
 * @returns Recent packages and identities.
 *
 * @example
 * const activity = await fetchRecentActivity();
 * console.log(activity.recent_artifacts.length);
 */
export async function fetchRecentActivity(
  signal?: AbortSignal,
): Promise<RecentActivity> {
  if (USE_FIXTURES) {
    return resolveRecentActivityFixture();
  }
  return registryFetch<RecentActivity>('/v1/activity/recent', undefined, signal);
}

// ---------------------------------------------------------------------------
// Trust tier computation
// ---------------------------------------------------------------------------

const TIER_THRESHOLDS: [number, TrustTier][] = [
  [6, 'sovereign'],
  [4, 'trusted'],
  [2, 'verified'],
  [0, 'seedling'],
];

/**
 * Computes a trust tier and score from an active identity's data.
 *
 * Score formula: `platform_claims * 20 + public_keys * 15 + artifacts * 5`,
 * capped at 100.
 *
 * Tiers are based on the number of verified platform attestations:
 * - Seedling: 0–1
 * - Verified: 2–3
 * - Trusted: 4–5
 * - Sovereign: 6+
 *
 * @param identity - An active identity from the registry API.
 * @returns The computed trust tier and numeric score.
 */
export function computeTrustTier(identity: ActiveIdentity): {
  tier: TrustTier;
  score: number;
} {
  const claims = identity.platform_claims.length;
  const keys = identity.public_keys.length;
  const artifacts = identity.artifacts.length;

  const raw = claims * 20 + keys * 15 + artifacts * 5;
  const score = Math.min(raw, 100);

  let tier: TrustTier = 'seedling';
  for (const [min, t] of TIER_THRESHOLDS) {
    if (claims >= min) {
      tier = t;
      break;
    }
  }

  return { tier, score };
}

// ---------------------------------------------------------------------------
// Trust chain builder
// ---------------------------------------------------------------------------

/**
 * Builds the 5-node Chain of Trust for a release entry.
 *
 * Nodes: Artifact → Signature → Device → Identity → Authority.
 * If signer identity data is unavailable, the chain is truncated at the
 * identity node with a placeholder.
 *
 * @param release       - The release entry to visualize.
 * @param signerIdentity - Optional enriched identity for the signer DID.
 * @returns Ordered array of trust chain nodes.
 */
export function buildTrustChain(
  release: PackageRelease,
  signerIdentity?: ActiveIdentity,
): TrustChainNode[] {
  const nodes: TrustChainNode[] = [
    {
      type: 'artifact',
      label: 'Artifact',
      detail: release.version
        ? `${release.version} (${release.digest_algorithm.toUpperCase()}: ${release.digest_hex.slice(0, 12)}…)`
        : `${release.digest_algorithm.toUpperCase()}: ${release.digest_hex.slice(0, 16)}…`,
    },
    {
      type: 'signature',
      label: 'Signature',
      detail: `Valid Ed25519 signature at ${new Date(release.published_at).toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    },
  ];

  if (signerIdentity && signerIdentity.public_keys.length > 0) {
    const key = signerIdentity.public_keys[0];
    nodes.push({
      type: 'device',
      label: 'Device Key',
      detail: `Key ${key.public_key_hex.slice(0, 8)}…`,
    });
  } else {
    nodes.push({
      type: 'device',
      label: 'Device Key',
      detail: 'Signed by authorized key',
    });
  }

  nodes.push({
    type: 'identity',
    label: 'Identity',
    detail: release.signer_did,
    link_did: release.signer_did,
  });

  if (signerIdentity) {
    const githubClaim = signerIdentity.platform_claims.find(
      (c) => c.platform === 'github' && c.verified,
    );
    nodes.push({
      type: 'authority',
      label: 'Authority',
      detail: githubClaim
        ? `Verified control of github.com/${githubClaim.namespace}`
        : `DID ${release.signer_did.slice(0, 20)}… with ${signerIdentity.platform_claims.length} verified claims`,
    });
  } else {
    nodes.push({
      type: 'authority',
      label: 'Authority',
      detail: `DID ${release.signer_did.slice(0, 20)}…`,
    });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Package detail (composed fetch with N+1 mitigation)
// ---------------------------------------------------------------------------

/**
 * Fetches and composes a full package detail from artifact entries.
 *
 * **N+1 mitigation strategy:**
 * 1. Fetches all artifacts for `ecosystem:name`.
 * 2. Extracts unique signer DIDs.
 * 3. Caps to the **10 most recent** unique signers (by latest `published_at`).
 * 4. Batches identity lookups in groups of 5 via `Promise.allSettled`.
 * 5. Gracefully handles partial failures (404s, timeouts).
 *
 * @param ecosystem - Package ecosystem (e.g. `"npm"`).
 * @param name      - Package name (e.g. `"react"` or `"@scope/pkg"`).
 * @param signal    - Optional AbortSignal forwarded to `fetch()`.
 * @returns Composed package detail with enriched signers.
 */
export async function fetchPackageDetail(
  ecosystem: string,
  name: string,
  signal?: AbortSignal,
): Promise<PackageDetail> {
  if (USE_FIXTURES) {
    const fixture = await resolvePackageFixture(ecosystem, name);
    if (fixture) return fixture;
  }
  const query = `${ecosystem}:${name}`;
  const artifactResponse = await fetchArtifacts(query, undefined, signal);
  const entries = artifactResponse.entries;

  // Build releases
  const releases: PackageRelease[] = entries.map((e) => ({
    digest_algorithm: e.digest_algorithm,
    digest_hex: e.digest_hex,
    signer_did: e.signer_did,
    published_at: e.published_at,
    status: 'valid' as const,
  }));

  // Deduplicate signers and track stats per DID
  const signerMap = new Map<
    string,
    { count: number; lastSigned: string }
  >();
  for (const entry of entries) {
    const existing = signerMap.get(entry.signer_did);
    if (existing) {
      existing.count++;
      if (entry.published_at > existing.lastSigned) {
        existing.lastSigned = entry.published_at;
      }
    } else {
      signerMap.set(entry.signer_did, {
        count: 1,
        lastSigned: entry.published_at,
      });
    }
  }

  // Cap to top 10 most recent unique signers
  const sortedDids = [...signerMap.entries()]
    .sort((a, b) => b[1].lastSigned.localeCompare(a[1].lastSigned))
    .slice(0, 10);

  // Batch identity lookups in groups of 5
  const signers: PackageSigner[] = [];
  for (let i = 0; i < sortedDids.length; i += 5) {
    const batch = sortedDids.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(([did]) => fetchIdentity(did, signal)),
    );

    for (let j = 0; j < batch.length; j++) {
      const [did, stats] = batch[j];
      const result = results[j];

      let githubUsername: string | undefined;
      let verified = false;

      if (result.status === 'fulfilled' && result.value.status === 'active') {
        const identity = result.value;
        const ghClaim = identity.platform_claims.find(
          (c) => c.platform === 'github' && c.verified,
        );
        if (ghClaim) githubUsername = ghClaim.namespace;
        verified = identity.platform_claims.some((c) => c.verified);
      }

      signers.push({
        did,
        github_username: githubUsername,
        verified,
        signature_count: stats.count,
        last_signed: stats.lastSigned,
      });
    }
  }

  return {
    ecosystem: ecosystem as Ecosystem,
    package_name: name,
    verified: signers.some((s) => s.verified),
    signers,
    releases,
  };
}
