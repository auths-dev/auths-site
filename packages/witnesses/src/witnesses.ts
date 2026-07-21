/**
 * The witness directory (network Epic J1): the declared facts about each
 * conformant witness — the data a party's `witness_policy` wants when it picks
 * a set that spans distinct operators, jurisdictions, and infrastructure.
 *
 * Entries are checked-in data; liveness is probed at render (see ./live.ts).
 * Listing requires passing the published conformance harness
 * (`cargo xtask witness-conformance`) — a test, not a document.
 *
 * This is the single source of truth for the explorer (`explorer.auths.dev`) —
 * the network directory surface — so a witness added here shows up there without
 * a second edit.
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
   * The witness's member key is NOT checked in here — it is a property of the
   * running node (derived from its seed), read live from `/health` at probe
   * time (see `live.ts`), so the directory can never advertise a stale key.
   */
  url: string | null;
  statusPage: string | null;
}

/**
 * The first-party witnesses. Their public URLs live HERE, in version control —
 * not in a deploy-time env var. A hidden `AUTHS_W1_URL` env is exactly how the
 * directory silently drifted from reality (unset → `url: null` → "standing up"
 * forever): this file is the single reviewable source of truth, so moving a
 * first-party host is an honest, tracked commit. (Local dev can still add a node
 * via `AUTHS_LOCAL_WITNESS_URL` below.)
 */
function firstParty(): WitnessEntry[] {
  return [
    {
      name: 'network.auths.dev',
      operator: 'Auths (first-party)',
      jurisdiction: 'UK',
      infraClass: 'fly.io · lhr',
      roles: ['anchor', 'kel', 'cosign', 'registry'],
      url: 'https://network.auths.dev',
      statusPage: null,
    },
    {
      name: 'auths-w1',
      operator: 'Auths (first-party)',
      jurisdiction: 'UK',
      infraClass: 'fly.io · lhr',
      roles: ['anchor', 'kel', 'cosign'],
      url: 'https://auths-w1.fly.dev',
      statusPage: null,
    },
  ];
}

// Guard against the drift that broke the directory: every first-party witness
// must carry a concrete, version-controlled URL. A null here means someone
// reintroduced a hidden env-var indirection — fail loudly at build/boot instead
// of shipping a witness that renders "standing up" forever.
for (const w of firstParty()) {
  if (!w.url) {
    throw new Error(
      `witness directory: first-party '${w.name}' has no URL — hardcode it here, never behind an env var`,
    );
  }
}

/**
 * The directory as rendered: the checked-in entries, plus — when
 * `AUTHS_LOCAL_WITNESS_URL` is set (local development) — the witness node
 * running on this machine, so the local network shows up live on the local
 * page. Server-side only: the env read must never reach the client bundle.
 */
export function witnessDirectory(): WitnessEntry[] {
  const entries = firstParty();
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

/**
 * Look up a single directory entry by its public name. Returns `undefined` for
 * an unknown name — the explorer's witness-scoped routes 404 on that.
 */
export function witnessByName(name: string): WitnessEntry | undefined {
  return witnessDirectory().find((w) => w.name === name);
}
