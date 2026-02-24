// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Platform = 'github' | 'gitlab' | 'gitea' | 'radicle';

export type SearchQueryType = 'package' | 'repo' | 'identity' | 'did' | 'unknown';

export type ParsedPackageQuery = {
  type: 'package';
  raw: string;
  normalized: string;
};

export type ParsedRepoQuery = {
  type: 'repo';
  raw: string;
  normalized: string;
  platform: Platform;
};

export type ParsedIdentityQuery = {
  type: 'identity';
  raw: string;
  normalized: string;
  platform: Platform;
  namespace: string;
};

export type ParsedDidQuery = {
  type: 'did';
  raw: string;
  normalized: string;
  platform?: Platform;
  namespace?: string;
};

export type ParsedUnknownQuery = {
  type: 'unknown';
  raw: string;
  normalized: string;
};

export type ParsedSearchQuery =
  | ParsedPackageQuery
  | ParsedRepoQuery
  | ParsedIdentityQuery
  | ParsedDidQuery
  | ParsedUnknownQuery;

export interface ClaimIdentityProps {
  platform?: Platform;
  namespace?: string;
  did?: string;
}

// ---------------------------------------------------------------------------
// Parser helpers
// ---------------------------------------------------------------------------

const PLATFORM_HOSTS: Record<string, Platform> = {
  'github.com': 'github',
  'gitlab.com': 'gitlab',
};

/**
 * Extracts an explicit platform prefix from the input string.
 *
 * Recognises `gitlab:`, `radicle:`, `gitea:`, and `github/` prefixes.
 *
 * @param input - The raw search string.
 * @returns The detected platform and the remaining string, or `null`.
 *
 * @example
 * extractPlatformPrefix('gitlab:torvalds')
 * // → { platform: 'gitlab', remainder: 'torvalds' }
 *
 * @example
 * extractPlatformPrefix('github/auths/auths')
 * // → { platform: 'github', remainder: 'auths/auths' }
 */
export function extractPlatformPrefix(
  input: string,
): { platform: Platform; remainder: string } | null {
  if (input.startsWith('github/')) {
    return { platform: 'github', remainder: input.slice('github/'.length) };
  }

  const colonPrefixes: Platform[] = ['gitlab', 'radicle', 'gitea'];
  for (const p of colonPrefixes) {
    if (input.startsWith(`${p}:`)) {
      return { platform: p, remainder: input.slice(p.length + 1) };
    }
  }

  return null;
}

/**
 * Detects a full URL and extracts the platform and path.
 *
 * Supports `https://github.com/...` and `https://gitlab.com/...` as well as
 * bare `github.com/org/repo` forms (without the protocol).
 *
 * @param input - The raw search string.
 * @returns The platform and path segments, or `null`.
 *
 * @example
 * detectUrl('https://gitlab.com/org/repo')
 * // → { platform: 'gitlab', path: 'org/repo' }
 *
 * @example
 * detectUrl('github.com/auths/auths')
 * // → { platform: 'github', path: 'auths/auths' }
 */
export function detectUrl(
  input: string,
): { platform: Platform; path: string } | null {
  const stripped = input.replace(/^https?:\/\//, '');

  for (const [host, platform] of Object.entries(PLATFORM_HOSTS)) {
    if (stripped.startsWith(`${host}/`)) {
      const path = stripped.slice(host.length + 1).replace(/\/$/, '');
      if (path) return { platform, path };
    }
  }

  return null;
}

/**
 * Detects a Decentralized Identifier (DID) string.
 *
 * Matches `did:<method>:<identifier>` patterns such as `did:key:z6Mk...`
 * or `did:keri:E8jsh...`.
 *
 * @param input - The raw search string.
 * @returns The DID method and full DID, or `null`.
 *
 * @example
 * detectDid('did:key:z6MkTest')
 * // → { didMethod: 'key', fullDid: 'did:key:z6MkTest' }
 */
export function detectDid(
  input: string,
): { didMethod: string; fullDid: string } | null {
  const match = input.match(/^did:([a-z]+):.+$/i);
  if (match) {
    return { didMethod: match[1], fullDid: input };
  }
  return null;
}

/**
 * Detects the `@username` identity shorthand.
 *
 * The `@` prefix defaults to GitHub as the platform.
 *
 * @param input - The raw search string.
 * @returns The platform and namespace, or `null`.
 *
 * @example
 * detectIdentityShorthand('@torvalds')
 * // → { platform: 'github', namespace: 'torvalds' }
 */
export function detectIdentityShorthand(
  input: string,
): { platform: Platform; namespace: string } | null {
  if (input.startsWith('@') && input.length > 1) {
    const namespace = input.slice(1);
    if (/^[a-zA-Z0-9_-]+$/.test(namespace)) {
      return { platform: 'github', namespace };
    }
  }
  return null;
}

/**
 * Detects a bare `owner/repo` pattern (no dots, no protocol).
 *
 * Assumes GitHub when no other platform context is available.
 *
 * @param input - The raw search string.
 * @returns The platform and normalised URL, or `null`.
 *
 * @example
 * detectRepoPattern('auths/auths')
 * // → { platform: 'github', normalized: 'https://github.com/auths/auths' }
 */
export function detectRepoPattern(
  input: string,
): { platform: Platform; normalized: string } | null {
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(input) && !input.includes('.')) {
    return {
      platform: 'github',
      normalized: `https://github.com/${input}`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Classifies a raw omni-search input into a typed query object.
 *
 * Supports explicit prefixes (`npm:`, `gitlab:`, `github/`, `@`) as well as
 * automatic detection of full URLs, raw DIDs, and `owner/repo` patterns.
 *
 * @param input - The raw search string entered by the user.
 * @returns A strictly-typed `ParsedSearchQuery` discriminated union.
 *
 * @example
 * parseSearchQuery('npm:auths-cli')
 * // → { type: 'package', raw: 'npm:auths-cli', normalized: 'auths-cli' }
 *
 * @example
 * parseSearchQuery('@bordumb')
 * // → { type: 'identity', raw: '@bordumb', ..., platform: 'github', namespace: 'bordumb' }
 */
export function parseSearchQuery(input: string): ParsedSearchQuery {
  const raw = input;
  const trimmed = input.trim();

  if (!trimmed) {
    return { type: 'unknown', raw, normalized: '' };
  }

  // npm: prefix → package
  if (trimmed.startsWith('npm:')) {
    return { type: 'package', raw, normalized: trimmed.slice(4) };
  }

  // Explicit platform prefix (gitlab:, radicle:, gitea:, github/)
  const prefixed = extractPlatformPrefix(trimmed);
  if (prefixed) {
    const did = detectDid(prefixed.remainder);
    if (did) {
      return {
        type: 'did',
        raw,
        normalized: did.fullDid,
        platform: prefixed.platform,
        namespace: did.fullDid,
      };
    }
    // If the remainder looks like owner/repo, treat as repo
    if (prefixed.remainder.includes('/')) {
      return {
        type: 'repo',
        raw,
        normalized: `https://${prefixed.platform === 'github' ? 'github.com' : prefixed.platform === 'gitlab' ? 'gitlab.com' : prefixed.platform + '.example.com'}/${prefixed.remainder}`,
        platform: prefixed.platform,
      };
    }
    // Otherwise it's an identity
    return {
      type: 'identity',
      raw,
      normalized: prefixed.remainder,
      platform: prefixed.platform,
      namespace: prefixed.remainder,
    };
  }

  // Full URL (https://github.com/org/repo or github.com/org/repo)
  const url = detectUrl(trimmed);
  if (url) {
    return {
      type: 'repo',
      raw,
      normalized: `https://${url.platform === 'github' ? 'github.com' : 'gitlab.com'}/${url.path}`,
      platform: url.platform,
    };
  }

  // Raw DID (did:key:..., did:keri:...)
  const did = detectDid(trimmed);
  if (did) {
    return { type: 'did', raw, normalized: did.fullDid };
  }

  // @username shorthand
  const identity = detectIdentityShorthand(trimmed);
  if (identity) {
    return {
      type: 'identity',
      raw,
      normalized: identity.namespace,
      platform: identity.platform,
      namespace: identity.namespace,
    };
  }

  // Bare owner/repo
  const repo = detectRepoPattern(trimmed);
  if (repo) {
    return {
      type: 'repo',
      raw,
      normalized: repo.normalized,
      platform: repo.platform,
    };
  }

  return { type: 'unknown', raw, normalized: trimmed };
}

// ---------------------------------------------------------------------------
// CLI instruction generation
// ---------------------------------------------------------------------------

const REGISTRY_URL = 'https://public.auths.dev';

/**
 * Generates tailored CLI commands for claiming an identity.
 *
 * Three variants:
 * 1. Platform + namespace (e.g. GitHub username) — includes `auths id attest`
 * 2. Raw DID (no platform) — omits `auths id attest`
 * 3. Radicle DID — uses `--did` flag instead of `--username`
 *
 * @param props - The identity claim parameters.
 * @returns Multi-line CLI command string.
 *
 * @example
 * generateCliInstructions({ platform: 'github', namespace: 'torvalds' })
 * // → "auths id create\nauths id attest github --username torvalds\nauths id register --registry https://public.auths.dev"
 *
 * @example
 * generateCliInstructions({ did: 'did:keri:E8jsh...' })
 * // → "auths id create\nauths id register --registry https://public.auths.dev"
 */
export function generateCliInstructions(props: ClaimIdentityProps): string {
  const lines: string[] = ['auths id create'];

  if (props.platform && props.namespace) {
    if (props.platform === 'radicle') {
      lines.push(`auths id attest radicle --did ${props.namespace}`);
    } else {
      lines.push(
        `auths id attest ${props.platform} --username ${props.namespace}`,
      );
    }
  }

  lines.push(`auths id register --registry ${REGISTRY_URL}`);
  return lines.join('\n');
}
