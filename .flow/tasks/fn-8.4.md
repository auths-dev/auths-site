# fn-8.4 CopyCommand component

## Description
## What
Create a reusable CLI command display component with copy-to-clipboard.

## Files
- Create: `apps/web/src/components/copy-command.tsx`

## Details
- Displays one or more command lines with `$` prompt prefix
- Copy button with idle/copied/fallback states (follow `onboarding-terminal.tsx` pattern at line 57-71)
- `aria-live="polite"` region for screen reader announcements (follow pattern at line 140-143)
- Multi-line support: `command.split('\n')` renders each line with prompt
- Optional `label` prop for description text above the command block

## Props
- `command: string` — the command(s) to display (newline-separated)
- `label?: string` — optional description above the block

## Styling
- Container: `rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3`
- Command text: `font-mono text-sm text-emerald-400`
- Prompt: `select-none text-zinc-600`
- Copy button: `absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900`
## Acceptance
- [ ] Single and multi-line commands render with `$` prefix
- [ ] Copy button cycles through idle → copied → idle (2s timeout)
- [ ] Fallback state shown when clipboard API unavailable
- [ ] `aria-live="polite"` announces clipboard state to screen readers
- [ ] TypeScript compiles
## Done summary
- Created CopyCommand component with single/multi-line support and $ prefix
- Copy button with idle/copied/fallback state cycle (2s timeout)
- aria-live="polite" region for screen reader announcements
- Verification: pnpm exec tsc --noEmit passes
## Evidence
- Commits: 2cc8be4e0b5d10327ad2cf50dedcdc7bb552c95f
- Tests: pnpm exec tsc --noEmit -p apps/web/tsconfig.json
- PRs: