/**
 * Pure builders for the buyer integration snippets. A downstream a buyer cannot
 * fetch is a dead stop on paste — so a bare, non-self-fetching stdio command is
 * never emitted as if runnable; the caller gets an install hint instead. A URL
 * transport is always self-fetching via mcp-remote and passes through clean.
 */

import type { Listing } from '@/lib/listings';

/**
 * A stdio command is runnable on paste only when it fetches its own binary —
 * an npx/uvx/pnpm-dlx/bunx invocation, or an explicit path. Anything else is a
 * binary the buyer must install first.
 */
export const SELF_FETCHING = /^(npx|npx -y|uvx|pnpm dlx|bunx|\/|\.\/)/;

/**
 * Whether the listing's downstream fetches itself. URL transports always do
 * (mcp-remote); stdio only when the command is self-fetching.
 *
 * Args:
 * * `listing`: the listing whose endpoint is being wrapped.
 *
 * Usage:
 * ```ignore
 * if (!isSelfFetching(listing)) showInstallHint();
 * ```
 */
export function isSelfFetching(listing: Listing): boolean {
  if (listing.endpoint.transport !== 'stdio') return true;
  return SELF_FETCHING.test(listing.endpoint.command ?? '');
}

/**
 * The raw runnable token embedded after `--` in a wrap invocation. Never the
 * install hint — this keeps the generated mcp.json / CLI well-formed even when
 * the downstream needs a separate install step (surfaced by the caller).
 *
 * Args:
 * * `listing`: the listing whose endpoint is being wrapped.
 *
 * Usage:
 * ```ignore
 * const token = downstreamToken(listing);
 * ```
 */
export function downstreamToken(listing: Listing): string {
  return listing.endpoint.transport === 'stdio'
    ? (listing.endpoint.command ?? '<command>')
    : `npx -y mcp-remote ${listing.endpoint.url}`;
}

/**
 * The display form of the downstream. A URL is self-fetching via mcp-remote; a
 * self-fetching stdio command passes through; a bare stdio binary a buyer
 * cannot obtain returns an install hint instead of a line that dies on paste.
 *
 * Args:
 * * `listing`: the listing whose endpoint is being wrapped.
 *
 * Usage:
 * ```ignore
 * const shown = endpointCommand(listing);
 * ```
 */
export function endpointCommand(listing: Listing): string {
  if (listing.endpoint.transport !== 'stdio') {
    return `npx -y mcp-remote ${listing.endpoint.url}`;
  }
  const cmd = listing.endpoint.command ?? '<command>';
  return SELF_FETCHING.test(cmd)
    ? cmd
    : `# install the server first (see the listing's docs link), then run it here:\n  ${cmd}`;
}

/** The standing honesty note for a sandbox test-mode integration. */
export const TEST_MODE_NOTE =
  'sandbox rails; settlements are recorded fixtures unless a funded wallet + facilitator are supplied — not a real on-chain settle';

/**
 * Build the wrap invocation the API detail projection serves for a listing.
 *
 * Args:
 * * `rail`: the payment rail (`x402` | `stripe`).
 * * `downstream`: the runnable downstream token.
 * * `testMode`: whether to append `--test-mode`.
 *
 * Usage:
 * ```ignore
 * const cmd = wrapCommand('x402', downstream, true);
 * ```
 */
export function wrapCommand(rail: string, downstream: string, testMode: boolean): string {
  return `npx -y @auths-dev/mcp wrap --scope paid.call --budget '$1' --ttl 30m --rail ${rail}${
    testMode ? ' --test-mode' : ''
  } -- ${downstream}`;
}
