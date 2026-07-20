/**
 * The exact shell a visitor pastes, in one place.
 *
 * Every copyable `verify-spend` block on the site drives its copy button AND
 * its shown lines from these constants, so the two can never drift and every
 * string survives a literal paste: the real published binary (`npx -y
 * @auths-dev/mcp`) and the real demo identifiers, with no angle-bracket
 * placeholder to trip a shell.
 *
 * The identifiers are the ones the downloadable demo bundle on /trust actually
 * resolves against, so the page's command and the bundle agree.
 */

/** The delegated agent identity the demo bundle's receipts are signed under. */
export const DEMO_AGENT_DID = 'did:keri:EHiKP_2dx1U88s4Upir4BxQ1Qc21203WaW1JfSJvn0i2';

/** The root identity that delegated the demo agent. */
export const DEMO_ROOT_DID = 'did:keri:EF6K8G4ZgfIjt788itIogc8eDXP948mAo1aQgXwQZJa2';

/** Re-derive the spend from the signed receipts — the flagship "verify, don't trust" command. */
export const VERIFY_SPEND_CMD = [
  'npx -y @auths-dev/mcp verify-spend --log spend.jsonl --registry ./registry \\',
  `  --agent ${DEMO_AGENT_DID} \\`,
  `  --root ${DEMO_ROOT_DID}`,
].join('\n');

/** The same command against a tampered log — the variant the audit catches. */
export const VERIFY_TAMPERED_CMD = [
  'npx -y @auths-dev/mcp verify-spend --log tampered.jsonl --registry ./registry \\',
  `  --agent ${DEMO_AGENT_DID} \\`,
  `  --root ${DEMO_ROOT_DID}`,
].join('\n');

/** Unpack the downloadable bundle and verify it — the two lines a skeptic pastes. */
export const DEMO_VERIFY_CMD = [
  'tar xzf demo-bundle.tgz && cd demo-bundle',
  'npx -y @auths-dev/mcp verify-spend --log spend.jsonl --registry ./registry \\',
  `  --agent ${DEMO_AGENT_DID} \\`,
  `  --root ${DEMO_ROOT_DID}`,
].join('\n');

/** Stand up a witness node and prove conformance — the four lines the /network terminal shows. */
export const RUN_WITNESS = [
  'git clone https://github.com/auths-dev/auths',
  'cd auths/deploy/witness',
  'WITNESS_SEED=$(openssl rand -hex 32) docker compose up -d',
  'cargo xtask witness-conformance --url http://127.0.0.1:3333',
].join('\n');
