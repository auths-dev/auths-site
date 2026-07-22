// chain.mjs — adversarial spend-log chain integrity under concurrency.
//
// The spend log is a signed hash chain: each record's `Auths-Prev` links to the prior one, and
// `verify-spend` re-derives the whole spend by replaying it. If concurrent calls both read the
// same chain head and both link to it, the log FORKS and the audit can no longer re-derive it.
//
// This scenario is the reproducer + regression test: each agent PIPELINES many concurrent calls
// (send all, await none, then collect), which is exactly what breaks a chain that advances its
// head non-atomically. It asserts every chain re-derives `consistent` AND has exactly the
// expected number of records (no forks, no drops). Pre-fix this fails (verify-spend 0/1);
// post-fix (the head held atomically across sign→append→advance) it passes.

import { makeLab, spawnAgents, paidCall, verifySpend } from '../lib/fleet.mjs';

export async function runChainConcurrency({ agents = 4, pipelineDepth = 60, log = console.log }) {
  const lab = makeLab('chain');
  log(`  spawning ${agents} agents…`);
  const { agents: fleet, failures } = await spawnAgents(lab, { n: agents });
  if (fleet.length === 0) throw new Error(`no agents came up (${failures} failed)`);

  // One warm-up call per agent (arms in-process signing), then the adversarial storm.
  await Promise.all(fleet.map((a) => paidCall(a.mcp)));

  log(`  ADVERSARIAL: each agent fires ${pipelineDepth} concurrent (pipelined) calls…`);
  const perAgentGranted = await Promise.all(fleet.map(async (a) => {
    // Send all at once, await none individually — genuine in-flight concurrency on one chain.
    const results = await Promise.all(
      Array.from({ length: pipelineDepth }, () => paidCall(a.mcp)),
    );
    return results.filter((r) => r.verdict === 'granted').length;
  }));
  const totalGranted = perAgentGranted.reduce((a, b) => a + b, 0);

  for (const a of fleet) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 800));
  const verify = verifySpend(fleet);

  // Each granted call + each warm-up is exactly one chained record. A fork/drop shows up as an
  // inconsistent log OR a re-derived count that doesn't match what we actually drove.
  const expected = totalGranted + fleet.length;
  const allConsistent = verify.consistent === verify.logs;
  const countMatches = verify.rederivedCalls === expected;
  const chainIntact = allConsistent && countMatches;

  log(`  ${fleet.length} agents × ${pipelineDepth} pipelined calls → ${totalGranted} granted`);
  log(`  verify-spend: ${verify.consistent}/${verify.logs} chains consistent, `
    + `${verify.rederivedCalls} records re-derived (expected ${expected}) → `
    + `${chainIntact ? 'CHAIN INTACT ✓' : 'CHAIN POLLUTED ✗ (fork/drop under concurrency)'}`);

  return {
    scenario: 'chain', agents: fleet.length, pipeline_depth: pipelineDepth,
    total_granted: totalGranted, expected_records: expected,
    verify, all_consistent: allConsistent, count_matches: countMatches, chain_intact: chainIntact,
  };
}
