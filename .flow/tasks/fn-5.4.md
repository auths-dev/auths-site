# fn-5.4 Add trust tier breakdown tooltip

## Description
## Add trust tier breakdown tooltip

**Repo:** auths-site
**Depends on:** fn-5.3 (shared TIER_STYLES)

### Problem

Users see "Verified" or "Trusted" badge but don't understand why. The scoring formula (`claims*20 + keys*15 + artifacts*5`) is opaque.

### Changes Required

1. **Add tooltip component** — When user hovers/taps the trust tier badge, show breakdown: "2 platform claims (+40), 1 key (+15), 3 artifacts (+15) = 70/100"
2. **`apps/web/src/lib/api/registry.ts:433-475`** — Extend `computeTrustTier` to also return component scores, not just the final tier string
3. **Update identity-client.tsx** — Add tooltip to the tier badge in identity header
4. **Update org-client.tsx** — Same tooltip on org header tier badge

### Design
- Tooltip: dark bg (zinc-800), white text, rounded-lg, shadow-xl
- Show on hover (desktop) and tap (mobile — use click toggle)
- Format: each factor on its own line, bold score contribution
- Include "How is this calculated?" link text at bottom (can link to docs later)
- Use `motion.div` with fade animation consistent with existing staggered animations (duration: 0.15)

### Accessibility
- Tooltip content readable by screen readers via `aria-describedby`
- Keyboard accessible: tooltip shows on focus of the badge element
## Acceptance
- [ ] `computeTrustTier` returns breakdown scores (claims, keys, artifacts contributions)
- [ ] Trust tier badge shows tooltip on hover (desktop) and tap (mobile)
- [ ] Tooltip displays per-factor score breakdown with total
- [ ] Tooltip is accessible via keyboard focus and screen reader
- [ ] Tooltip appears on both identity and org pages
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
- Created TrustTierBadge component with hover/focus/click tooltip
- Shows claims, keys, artifacts score breakdown
- Applied to identity and org pages
## Evidence
- Commits: 1730e24dd3e6f22b7d5a3e6ad087684a6f78aa82
- Tests:
- PRs: