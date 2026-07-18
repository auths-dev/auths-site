// env.mjs — path resolution + the headless env recipe that ARMS in-process signing.
//
// The single most important thing for throughput: unless AUTHS_PASSPHRASE is set with a
// FILE keychain backend, every brokered call falls back to the git-subprocess signing
// ceremony (`git init` + `git commit` + `auths sign HEAD`) — "seconds per call" per the
// gateway's own inproc_sign.rs note. This recipe pins the file keychain + a fixed test
// passphrase so `chain.sign_call` takes the fast in-process SSHSIG path. Copied in spirit
// from tests/e2e/fleet-throughput.mjs and auths-mcp/run.sh.

import { resolve } from 'node:path';

const HERE = import.meta.dirname;
export const SITE = resolve(HERE, '../../..');          // .../auths-site
export const REPOS = resolve(SITE, '..');               // .../auths-base

/** The release gateway binary (rebuilt fresh for these runs). Override with GATEWAY_BIN. */
export const GATEWAY_BIN =
  process.env.GATEWAY_BIN ?? resolve(REPOS, 'auths/target/release/auths-mcp-gateway');

/** The `auths` CLI next to the gateway — used for `id show` and (via gateway) verify-spend. */
export const AUTHS_CLI =
  process.env.AUTHS_CLI ?? resolve(REPOS, 'auths/target/release/auths');

/** The hermetic x402 adapter (downstream MCP server). No wallet ⇒ deterministic, no chain. */
export const X402_ADAPTER =
  process.env.X402_ADAPTER ??
  resolve(REPOS, 'auths-mcp/examples/payments/adapters/x402-adapter/server.mjs');

/** A test passphrase — any value; it only unlocks the local file keychain for signing. */
export const TEST_PASSPHRASE = 'Perf-Throughput-1!';

/**
 * The per-agent environment. `label` distinguishes delegations under one shared root, so a
 * whole fleet delegates under a single identity (fleet mode) or each stands alone (solo).
 *
 *   lab      — an isolated HOME (keychain + gitconfig live here)
 *   liveDir  — AUTHS_MCP_LIVE_DIR: chain + registry + spend-log are written here
 *   treasury — { url, fleet } to bind the fleet-wide cap; omit for solo mode
 */
export function agentEnv({ lab, liveDir, keyfile, label, treasury }) {
  const env = {
    ...process.env,
    HOME: lab,
    AUTHS_HOME: resolve(liveDir, 'registry'),
    AUTHS_REPO: resolve(liveDir, 'registry'),
    AUTHS_KEYCHAIN_BACKEND: 'file',
    AUTHS_KEYCHAIN_FILE: keyfile,
    AUTHS_PASSPHRASE: TEST_PASSPHRASE,      // ← arms in-process SSHSIG signing (the fast path)
    AUTHS_MCP_LIVE_DIR: liveDir,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: resolve(lab, '.gitconfig'),
    GIT_AUTHOR_NAME: 'perf', GIT_AUTHOR_EMAIL: 'perf@auths.dev',
    GIT_COMMITTER_NAME: 'perf', GIT_COMMITTER_EMAIL: 'perf@auths.dev',
  };
  if (label) env.AUTHS_MCP_AGENT_LABEL = label;
  if (treasury) { env.TREASURY_URL = treasury.url; env.TREASURY_FLEET = treasury.fleet; }
  return env;
}
