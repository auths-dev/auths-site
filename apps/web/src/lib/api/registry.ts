import type { Platform } from '@/lib/registry';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REGISTRY_BASE_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL ?? 'https://public.auths.dev';

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

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal,
  });

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
export function fetchArtifacts(
  query: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<ArtifactQueryResponse> {
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
export function fetchPubkeys(
  platform: Platform,
  namespace: string,
  signal?: AbortSignal,
): Promise<PubkeysResponse> {
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
