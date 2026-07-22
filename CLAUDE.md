# auths-site

Monorepo for the Auths marketing surfaces. Two Next.js 16 apps share one design
system (`@auths/ledger-ui`) and deploy as separate Vercel projects.

## Layout

| Path | What | Domain |
|---|---|---|
| `apps/web` | Marketing site | auths.dev |
| `apps/market` | Paid-MCP marketplace | market.auths.dev |
| `packages/ledger-ui` | Shared UI, design tokens, footer | — |
| `packages/widget` | `auths-verify` embed widget | — |

bun workspaces · Tailwind v4 · TypeScript.

## Commands

| Command | Does |
|---|---|
| `bun run --filter @auths/web dev` | Web dev server (:3000) |
| `bun run --filter @auths/market dev` | Market dev server (:3002) |
| `bun run --filter @auths/<app> build` | Production build |
| `bun run --filter @auths/<app> typecheck` | `tsc --noEmit` |
| `bun run typecheck` | Typecheck every workspace |
| `bun run lint` | ESLint + CLI-drift check |

## Good to know

- **Shared chrome + tokens** live in `packages/ledger-ui`: `styles.css` (the
  `paper`/`ink`/`seal` palette, `font-display` = Fraunces) and `ledger.tsx` (the
  shared `LedgerFooter`). Edit once, both apps update.
- **Auth fence** (`apps/market/eslint.config.mjs`): nothing outside
  `src/lib/auth` or `src/lib/supabase` may import `@supabase/*` — everything goes
  through the AuthPort.
- **Spend/earnings figures** must come only from `verify-spend` re-derivation,
  never gateway- or seller-reported.
- **Cited quotes in MDX** (`apps/web/content`) use the `<Quote text="…" name="…"
  org="…" link="…" />` component — never markdown `>` blockquotes (Tailwind
  Typography doubles the quote marks). `text` is required; `name`/`org`/`link` are
  optional and `link` points at the `org` if given, else the `name`.

## Wrapping up a PR merge

Builds pile up fast on this machine, so reclaim the npm cache after a merge:

| Step | Command |
|---|---|
| Clear the npm cache | `npm cache clean --force` |

Safe to run — npm re-downloads packages on the next install.
