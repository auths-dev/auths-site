# fn-7.1 Add network stats widget to dashboard

## Description
## Add network stats widget to dashboard

Add a stats bar to `registry-dashboard.tsx` showing total identities, attestations, namespaces, and log entries using the existing `fetchNetworkStats()` function and `registryKeys.networkStats()` key.

### Changes
1. Create `components/network-stats-bar.tsx` — client component using `useQuery` with `registryKeys.networkStats()` and `fetchNetworkStats()`
2. Display as a horizontal stat bar with 4 numbers: identities, attestations, namespaces, log entries
3. Add to `registry-dashboard.tsx` above `EcosystemGrid`
4. Animated counter on mount (count up from 0)
5. `staleTime: 60_000` (stats don't change fast)

### Design
- Full-width row of 4 stat cards
- Each: large number (zinc-100, font-mono) + label below (zinc-500, text-xs uppercase)
- Skeleton: 4 animated pulse boxes matching card shape
## Acceptance
- [ ] Stats bar renders on dashboard with 4 metrics
- [ ] Uses `fetchNetworkStats` and `registryKeys.networkStats`
- [ ] Shows skeleton while loading
- [ ] `pnpm typecheck` passes
## Done summary
- All 7 frontend tasks implemented in single commit
- Stats widget, identity search, namespace browse, server trust tier, badge embed, org policy, fixtures
## Evidence
- Commits: 1f5827c5af7b5007332b95e86895a8021cacee07
- Tests: pnpm typecheck
- PRs: