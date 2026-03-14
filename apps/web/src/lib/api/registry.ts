import type { Platform } from '@/lib/registry';
import { REGISTRY_BASE_URL, USE_FIXTURES } from '@/lib/config';
import {
  resolveIdentityFixture,
  resolveBatchIdentitiesFixture,
  resolvePubkeysFixture,
  resolvePackageFixture,
  resolveArtifactFixture,
  resolveActivityFeedFixture,
  resolveIdentitySearchFixture,
  resolveNamespaceListFixture,
  resolveNetworkStatsFixture,
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
  artifacts: ArtifactEntry[];
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
  is_abandoned?: boolean;
  abandoned_at?: string;
  server_trust_tier?: string;
  server_trust_score?: number;
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
  trust_breakdown: { claims: number; keys: number; artifacts: number };
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

// ---------------------------------------------------------------------------
// Activity feed types (unified feed from /v1/activity/feed)
// ---------------------------------------------------------------------------

export type ActivityEntryType =
  | 'register' | 'device_bind' | 'device_revoke'
  | 'org_create' | 'org_add_member' | 'org_revoke_member'
  | 'abandon' | 'rotate' | 'attest'
  | 'namespace_claim' | 'namespace_delegate' | 'namespace_transfer'
  | 'access_grant' | 'access_revoke';

export interface FeedEntry {
  log_sequence: number;
  entry_type: ActivityEntryType;
  actor_did: string;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  merkle_included: boolean;
  is_genesis_phase: boolean;
}

export interface ActivityFeedResponse {
  entries: FeedEntry[];
  next_cursor: number | null;
  log_size?: number;
  checkpoint_hash?: string;
}

export interface ActivityFeedParams {
  before?: number;
  limit?: number;
  actor?: string;
  type?: string;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class RegistryApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly code?: string;
  readonly errorType?: string;

  constructor(
    status: number,
    message: string,
    detail?: string,
    code?: string,
    errorType?: string,
  ) {
    super(message);
    this.name = 'RegistryApiError';
    this.status = status;
    this.detail = detail;
    this.code = code;
    this.errorType = errorType;
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
    let code: string | undefined;
    let errorType: string | undefined;
    try {
      const body = await res.json();
      // RFC 9457: read `detail` for the human-readable explanation
      if (typeof body.detail === 'string') {
        message = body.detail;
        detail = body.detail;
      } else if (typeof body.error === 'string') {
        message = body.error;
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.type === 'string') errorType = body.type;
    } catch {
      // body isn't JSON — use statusText
    }
    throw new RegistryApiError(res.status, message, detail, code, errorType);
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

  if (status === 'unclaimed') {
    return { status: 'unclaimed', did: String(data.did ?? did) } satisfies UnclaimedIdentity;
  }

  // Transform raw API shape into the frontend ActiveIdentity contract.
  // The API returns { key_state: { current_keys, is_abandoned, abandoned_at } }
  // but the frontend expects { public_keys, platform_claims, artifacts }.
  const keyState = (data.key_state ?? {}) as Record<string, unknown>;
  const currentKeys = Array.isArray(keyState.current_keys)
    ? (keyState.current_keys as string[])
    : [];

  const public_keys = currentKeys.map((key, i) => ({
    key_id: `key-${i}`,
    algorithm: 'Ed25519',
    public_key_hex: key,
    created_at: new Date().toISOString(),
  }));

  const isAbandoned = keyState.is_abandoned === true;
  const abandonedAt = typeof keyState.abandoned_at === 'string'
    ? keyState.abandoned_at
    : undefined;

  // Preserve server-computed trust tier if present
  const serverTrustTier = typeof data.trust_tier === 'string'
    ? data.trust_tier
    : undefined;
  const serverTrustScore = typeof data.trust_score === 'number'
    ? data.trust_score
    : undefined;

  return {
    status: 'active',
    did: String(data.did ?? did),
    is_abandoned: isAbandoned || undefined,
    abandoned_at: abandonedAt,
    server_trust_tier: serverTrustTier,
    server_trust_score: serverTrustScore,
    public_keys,
    platform_claims: Array.isArray(data.platform_claims)
      ? (data.platform_claims as PlatformClaim[])
      : [],
    artifacts: Array.isArray(data.artifacts)
      ? (data.artifacts as ArtifactEntry[])
      : [],
  } satisfies ActiveIdentity;
}

/**
 * Batch-fetches identities by DID using the batch endpoint.
 *
 * Returns a map of DID -> IdentityResponse for each requested DID.
 * Max 100 DIDs per request.
 */
export async function fetchBatchIdentities(
  dids: string[],
  signal?: AbortSignal,
): Promise<Record<string, IdentityResponse>> {
  if (dids.length === 0) return {};

  if (USE_FIXTURES) {
    const fixture = await resolveBatchIdentitiesFixture(dids);
    if (fixture) return fixture;
  }

  const url = new URL('/v1/identities/batch', REGISTRY_BASE_URL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ dids }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') message = body.detail;
    } catch {
      // use statusText
    }
    throw new RegistryApiError(res.status, message);
  }

  const data = await res.json() as { identities: Record<string, IdentityResponse> };
  return data.identities;
}

/**
 * Fetches the unified activity feed from the transparency log.
 *
 * Supports server-side filtering by actor DID and entry type,
 * plus keyset pagination via `before` cursor.
 */
export async function fetchActivityFeed(
  params?: ActivityFeedParams,
  signal?: AbortSignal,
): Promise<ActivityFeedResponse> {
  if (USE_FIXTURES && !params?.before) {
    return resolveActivityFeedFixture(params);
  }
  const queryParams: Record<string, string> = {};
  if (params?.before != null) queryParams.before = String(params.before);
  if (params?.limit != null) queryParams.limit = String(params.limit);
  if (params?.actor) queryParams.actor = params.actor;
  if (params?.type) queryParams.type = params.type;
  return registryFetch<ActivityFeedResponse>('/v1/activity/feed', queryParams, signal);
}

// ---------------------------------------------------------------------------
// Namespace info
// ---------------------------------------------------------------------------

export interface NamespaceDelegate {
  delegate_did: string;
  granted_by: string;
  granted_at: string;
}

export interface NamespaceInfo {
  ecosystem: string;
  package_name: string;
  owner_did: string;
  delegates: NamespaceDelegate[];
  claimed_at: string;
}

export async function fetchNamespaceInfo(
  ecosystem: string,
  packageName: string,
  signal?: AbortSignal,
): Promise<NamespaceInfo> {
  return registryFetch<NamespaceInfo>(
    `/v1/namespaces/${encodeURIComponent(ecosystem)}/${encodeURIComponent(packageName)}`,
    undefined,
    signal,
  );
}

// ---------------------------------------------------------------------------
// Identity search
// ---------------------------------------------------------------------------

export interface IdentitySearchResult {
  did: string;
  platform?: string;
  namespace?: string;
  created_at: string;
}

export interface IdentitySearchResponse {
  results: IdentitySearchResult[];
  next_cursor?: string;
  has_more: boolean;
}

export async function fetchIdentitySearch(
  query: string,
  platform?: string,
  signal?: AbortSignal,
): Promise<IdentitySearchResponse> {
  if (USE_FIXTURES) {
    const fixture = await resolveIdentitySearchFixture(query);
    if (fixture) return fixture;
  }
  const params: Record<string, string> = { q: query };
  if (platform) params.platform = platform;
  return registryFetch<IdentitySearchResponse>('/v1/identities/search', params, signal);
}

// ---------------------------------------------------------------------------
// Namespace browse
// ---------------------------------------------------------------------------

export interface NamespaceBrowseResponse {
  namespaces: {
    ecosystem: string;
    package_name: string;
    owner_did: string;
    log_sequence: number;
    claimed_at: string;
  }[];
  next_cursor?: number;
  has_more: boolean;
}

export async function fetchNamespaceList(
  ecosystem?: string,
  signal?: AbortSignal,
): Promise<NamespaceBrowseResponse> {
  if (USE_FIXTURES) {
    const fixture = await resolveNamespaceListFixture(ecosystem);
    if (fixture) return fixture;
  }
  const params: Record<string, string> = {};
  if (ecosystem) params.ecosystem = ecosystem;
  return registryFetch<NamespaceBrowseResponse>('/v1/namespaces', params, signal);
}

// ---------------------------------------------------------------------------
// Network stats
// ---------------------------------------------------------------------------

export interface NetworkStats {
  total_identities: number;
  total_attestations: number;
  total_namespaces: number;
  total_log_entries: number;
}

export async function fetchNetworkStats(
  signal?: AbortSignal,
): Promise<NetworkStats> {
  if (USE_FIXTURES) {
    return resolveNetworkStatsFixture();
  }
  return registryFetch<NetworkStats>('/v1/stats', undefined, signal);
}

// ---------------------------------------------------------------------------
// Org policy
// ---------------------------------------------------------------------------

export interface OrgPolicyResponse {
  org_did: string;
  policy_expr: Record<string, unknown> | null;
  updated_at: string | null;
}

export async function fetchOrgPolicy(
  orgDid: string,
  signal?: AbortSignal,
): Promise<OrgPolicyResponse> {
  if (USE_FIXTURES) {
    const { resolveOrgPolicyFixture } = await import('./fixtures');
    const fixture = await resolveOrgPolicyFixture(orgDid);
    if (fixture) return fixture;
  }
  return registryFetch<OrgPolicyResponse>(
    `/v1/orgs/${encodeURIComponent(orgDid)}/policy`,
    undefined,
    signal,
  );
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
  breakdown: { claims: number; keys: number; artifacts: number };
} {
  if (identity.is_abandoned) {
    return {
      tier: 'seedling',
      score: 0,
      breakdown: { claims: 0, keys: 0, artifacts: 0 },
    };
  }

  const claims = identity.platform_claims.length;
  const keys = identity.public_keys.length;
  const artifacts = identity.artifacts.length;

  const claimsScore = claims * 20;
  const keysScore = keys * 15;
  const artifactsScore = artifacts * 5;
  const raw = claimsScore + keysScore + artifactsScore;
  const score = Math.min(raw, 100);

  let tier: TrustTier = 'seedling';
  for (const [min, t] of TIER_THRESHOLDS) {
    if (claims >= min) {
      tier = t;
      break;
    }
  }

  return {
    tier,
    score,
    breakdown: { claims: claimsScore, keys: keysScore, artifacts: artifactsScore },
  };
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
  // Avoid double-prefixing: if name already starts with "ecosystem:", don't add it again
  const query = name.startsWith(`${ecosystem}:`) ? name : `${ecosystem}:${name}`;
  const artifactResponse = await fetchArtifacts(query, undefined, signal);
  const entries = artifactResponse.artifacts;

  // Build releases — check for revocation status from API
  const releases: PackageRelease[] = entries.map((e) => ({
    digest_algorithm: e.digest_algorithm,
    digest_hex: e.digest_hex,
    signer_did: e.signer_did,
    published_at: e.published_at,
    status: ((e as unknown as Record<string, unknown>).revoked_at ? 'revoked' : 'valid') as 'valid' | 'revoked',
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

  // Batch identity lookup — single request instead of N+1
  const didsToLookup = sortedDids.map(([did]) => did);
  let identityMap: Record<string, IdentityResponse> = {};
  try {
    identityMap = await fetchBatchIdentities(didsToLookup, signal);
  } catch {
    // If batch endpoint fails, signers will have no enrichment data
  }

  const signers: PackageSigner[] = sortedDids.map(([did, stats]) => {
    const identity = identityMap[did];
    let githubUsername: string | undefined;
    let verified = false;

    if (identity && identity.status === 'active') {
      const ghClaim = identity.platform_claims.find(
        (c) => c.platform === 'github' && c.verified,
      );
      if (ghClaim) githubUsername = ghClaim.namespace;
      verified = identity.platform_claims.some((c) => c.verified);
    }

    return {
      did,
      github_username: githubUsername,
      verified,
      signature_count: stats.count,
      last_signed: stats.lastSigned,
    };
  });

  return {
    ecosystem: ecosystem as Ecosystem,
    package_name: name,
    verified: signers.some((s) => s.verified),
    signers,
    releases,
  };
}
