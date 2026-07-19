/**
 * The witness directory (network Epic J1): the declared facts about each
 * conformant witness — the data a party's `witness_policy` wants when it picks
 * a set that spans distinct operators, jurisdictions, and infrastructure.
 *
 * Entries are checked-in data; liveness is probed at render (see ./live.ts).
 * Listing requires passing the published conformance harness
 * (`cargo xtask witness-conformance`) — a test, not a document.
 */

export interface WitnessEntry {
  /** The public witness name, as carried in its cosignatures. */
  name: string;
  operator: string;
  jurisdiction: string;
  /** Infrastructure class — the diversity axis, e.g. `aws/us-west-2`. */
  infraClass: string;
  /** Roles the node serves: `anchor` (spend anchors), `kel` (receipt witnessing), `cosign` (checkpoint cosigning). */
  roles: readonly string[];
  /**
   * Public base URL, probed for liveness. `null` while the witness is not yet
   * publicly reachable — rendered honestly as “standing up”, never as “up”.
   */
  url: string | null;
  statusPage: string | null;
}

const FIRST_PARTY: readonly WitnessEntry[] = [
  {
    name: 'auths-w1',
    operator: 'Auths (first-party)',
    jurisdiction: 'US',
    infraClass: 'container · digest-pinned',
    roles: ['anchor', 'kel', 'cosign'],
    url: null,
    statusPage: null,
  },
];

/**
 * The directory as rendered: the checked-in entries, plus — when
 * `AUTHS_LOCAL_WITNESS_URL` is set (local development) — the witness node
 * running on this machine, so the local network shows up live on the local
 * page. Server-side only: the env read must never reach the client bundle.
 */
export function witnessDirectory(): WitnessEntry[] {
  const entries = [...FIRST_PARTY];
  const local = process.env.AUTHS_LOCAL_WITNESS_URL;
  if (local) {
    entries.push({
      name: 'local-dev',
      operator: 'you',
      jurisdiction: 'localhost',
      infraClass: 'this machine · dev',
      roles: ['anchor', 'kel', 'cosign'],
      url: local.replace(/\/$/, ''),
      statusPage: null,
    });
  }
  return entries;
}
