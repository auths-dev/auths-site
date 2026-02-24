# fn-3.5 Implement ClaimIdentityCTA and unclaimed identity funnel

## Description
## Implement ClaimIdentityCTA and unclaimed identity funnel

### What
Build the `ClaimIdentityCTA` component with two distinct variants. Clipboard operations must not crash the component if the browser throws a `DOMException`.

### How
1. **Create** `apps/web/src/components/claim-identity-cta.tsx`:

   **ClaimIdentityCTA component:**
   - Props: `ClaimIdentityProps` from `@/lib/registry`
   - Uses `generateCliInstructions(props)` from `@/lib/registry`

   **Two variants based on props:**

   **Variant 1 — Platform Namespace** (user searched `@torvalds` or `gitlab:torvalds`):
   - Triggered when `platform` and `namespace` are provided
   - Heading: "@{namespace} has not been claimed on {platform}"
   - CLI commands include `auths id attest` step

   **Variant 2 — Raw DID** (user searched a valid KERI prefix, backend returned `status: "unclaimed"`):
   - Triggered when only `did` is provided
   - Heading: "This identity prefix has not been registered"
   - CLI commands omit `auths id attest` step

   **TerminalBlock sub-component:**
   - Dark terminal aesthetic, macOS window chrome (colored dots)
   - Copy button with `navigator.clipboard.writeText()`
   - **Clipboard API robustness**: The entire clipboard action must be wrapped in a try/catch that specifically handles `DOMException` (permission denied, secure context violation). The error boundary must NOT crash the component or propagate to React's error boundary. On failure:
     - Fall back to text selection + "Press Ctrl/Cmd+C" tooltip
     - Never fail silently — always show visual feedback on outcome
   - Visual feedback: icon swaps to checkmark for 2 seconds after success
   - `aria-label="Copy command to clipboard"`

   **Semantic terminal markup:**
   - `select-none` on `$` prompt character
   - `data-clipboard-text` attribute stores clean command text
   - `<pre>` + `<code>` semantic markup
   - Geist Mono font

   **Accessibility:**
   - `aria-live="polite"` region announces copy result
   - Copy button has descriptive aria-label

### Key references
- Registry types: `apps/web/src/lib/registry.ts` (fn-3.2)
- CSS variables: `apps/web/src/app/globals.css`
- Font variable: `--font-geist-mono`
## Implement ClaimIdentityCTA and unclaimed identity funnel

### What
Build the `ClaimIdentityCTA` component with two distinct variants: one for platform+namespace unclaimed identities and one for raw unclaimed DIDs. Wire it into the search flow for unclaimed results from both identity and DID searches.

### How
1. **Create** `apps/web/src/components/claim-identity-cta.tsx`:

   **ClaimIdentityCTA component:**
   - Props: `ClaimIdentityProps` from `@/lib/registry` — `{ platform?: Platform; namespace?: string; did?: string }`
   - Uses `generateCliInstructions(props)` from `@/lib/registry`

   **Two variants based on props:**

   **Variant 1 — Platform Namespace** (user searched `@torvalds` or `gitlab:torvalds`):
   - Triggered when `platform` and `namespace` are provided
   - Heading: "@{namespace} has not been claimed on {platform}"
   - CLI commands include `auths id attest` step:
     ```
     auths id create
     auths id attest github --username torvalds
     auths id register --registry https://public.auths.dev
     ```

   **Variant 2 — Raw DID** (user searched a valid KERI prefix that isn't registered, backend returned `status: "unclaimed"`):
   - Triggered when only `did` is provided (no platform/namespace)
   - Heading: "This identity prefix has not been registered"
   - CLI commands omit the `auths id attest` step:
     ```
     auths id create
     auths id register --registry https://public.auths.dev
     ```

   **TerminalBlock sub-component** (inline or co-located):
   - Dark background terminal aesthetic
   - Terminal header with red/yellow/green dots (macOS window chrome)
   - Copy button with `navigator.clipboard.writeText()`
   - **Clipboard fallback**: if Clipboard API unavailable or blocked, fall back to text selection + "Press Ctrl/Cmd+C" tooltip. Never fail silently.
   - Visual feedback: icon swaps to checkmark for 2 seconds after copy, or shows error state on failure
   - `aria-label="Copy command to clipboard"` on the copy button

   **Semantic terminal markup:**
   - `select-none` on `$` prompt character
   - `data-clipboard-text` attribute stores clean command text (no prompt chars, trailing spaces, or formatting artifacts)
   - `<pre>` + `<code>` semantic markup
   - Geist Mono font

   **Accessibility:**
   - `aria-live="polite"` region announces copy result
   - Copy button has descriptive aria-label

   **Styling:**
   - CSS variables for the outer card (`var(--border)`, `var(--muted-bg)`)
   - Terminal block: dark bg (gray-950), green-400 text
   - `motion.div` entry animation

### Key references
- Registry types: `apps/web/src/lib/registry.ts` (Platform, ClaimIdentityProps from fn-3.2)
- CSS variables: `apps/web/src/app/globals.css`
- Font variable: `--font-geist-mono` (set in layout.tsx)
## Implement ClaimIdentityCTA and unclaimed identity funnel

### What
Build the `ClaimIdentityCTA` component per the spec and a terminal-style code block with robust copy-to-clipboard (including fallback). Wire it into the search flow for unclaimed identity results.

### How
1. **Create** `apps/web/src/components/claim-identity-cta.tsx`:

   **ClaimIdentityCTA component:**
   - Props: `{ platform: Platform; namespace: string }` (using `Platform` type and `namespace` instead of `username` to support Radicle DIDs and other non-username identifiers)
   - Uses `generateCliInstructions(platform, namespace)` from `@/lib/registry`
   - Renders:
     - Heading: "@{namespace} has not been claimed on {platform}" (or appropriate phrasing for DID-based namespaces)
     - Description text explaining the value proposition
     - Terminal-style code block with the CLI commands

   **TerminalBlock sub-component** (inline or co-located):
   - Dark background terminal aesthetic matching existing dark code blocks in the site
   - Terminal header with red/yellow/green dots (macOS window chrome)
   - Copy button in terminal header that calls `navigator.clipboard.writeText()`
   - **Clipboard fallback**: `navigator.clipboard.writeText()` requires a secure context (HTTPS) and user activation. If the Clipboard API is unavailable or blocked by browser permissions, fall back gracefully:
     - Primary: `navigator.clipboard.writeText(text)`
     - Fallback: programmatically select the text content and show a tooltip "Press Ctrl+C to copy" (or Cmd+C on macOS)
     - Never fail silently — always provide visual feedback on the outcome
   - Visual feedback: button text/icon swaps to checkmark for 2 seconds after successful copy, or shows error state on failure
   - `aria-label="Copy command to clipboard"` on the copy button

   **Semantic terminal markup for clean copying:**
   - `select-none` on the `$` prompt character so it's excluded from manual text selection
   - Store the raw command text (without prompt characters, trailing spaces, or formatting artifacts) in a `data-clipboard-text` attribute on the copy button, ensuring programmatic copy always uses clean text
   - Wrap the actual command lines in semantic `<code>` elements within `<pre>`
   - Use Geist Mono font (`font-[family-name:var(--font-geist-mono)]`)

   **Accessibility:**
   - `<pre>` + `<code>` semantic markup for CLI commands
   - `aria-live="polite"` region announces "Copied to clipboard" (or fallback message) on copy action
   - Copy button has descriptive aria-label

   **Styling:**
   - Use CSS variables: `var(--border)`, `var(--muted-bg)` for the outer card
   - Terminal block: dark bg (gray-950), green-400 text for commands
   - `motion.div` entry animation consistent with other result types

### Key references
- Spec: ClaimIdentityProps and generateCliInstructions in the original request
- CSS variables: `apps/web/src/app/globals.css`
- Font variable: `--font-geist-mono` (set in layout.tsx)
- Explorer verified badge pattern: `apps/web/src/app/explorer/explorer-client.tsx`
- Registry types: `apps/web/src/lib/registry.ts` (Platform, ClaimIdentityProps from fn-3.2)
## Implement ClaimIdentityCTA and unclaimed identity funnel

### What
Build the `ClaimIdentityCTA` component per the spec and a terminal-style code block with copy-to-clipboard. Wire it into the search flow for unclaimed identity results.

### How
1. **Create** `apps/web/src/components/claim-identity-cta.tsx`:

   **ClaimIdentityCTA component:**
   - Props: `{ platform: 'github' | 'gitlab' | 'gitea'; username: string }`
   - Uses `generateCliInstructions(platform, username)` from `@/lib/registry`
   - Renders:
     - Heading: "@{username} has not been claimed on {platform}"
     - Description text explaining the value proposition
     - Terminal-style code block with the CLI commands

   **TerminalBlock sub-component** (inline or co-located):
   - Dark background terminal aesthetic matching existing dark code blocks in the site
   - Terminal header with red/yellow/green dots (macOS window chrome)
   - Copy button in terminal header that calls `navigator.clipboard.writeText()`
   - Visual feedback: button text/icon swaps to checkmark for 2 seconds after copy
   - `aria-label="Copy command to clipboard"` on the copy button
   - `select-none` on the `$` prompt character so it's excluded from manual text selection
   - Use Geist Mono font (`font-[family-name:var(--font-geist-mono)]`)

   **Accessibility:**
   - `<pre>` + `<code>` semantic markup for CLI commands
   - `aria-live="polite"` region announces "Copied to clipboard" on copy
   - Copy button has descriptive aria-label

   **Styling:**
   - Use CSS variables: `var(--border)`, `var(--muted-bg)` for the outer card
   - Terminal block: dark bg (gray-950), green-400 text for commands
   - `motion.div` entry animation consistent with other result types

### Key references
- Spec: ClaimIdentityProps and generateCliInstructions in the original request
- CSS variables: `apps/web/src/app/globals.css`
- Font variable: `--font-geist-mono` (set in layout.tsx)
- Explorer verified badge pattern: `apps/web/src/app/explorer/explorer-client.tsx`
## Acceptance
- [ ] **Platform Namespace variant**: `<ClaimIdentityCTA platform="github" namespace="torvalds" />` renders with attest step
- [ ] **Raw DID variant**: `<ClaimIdentityCTA did="did:keri:E8jsh..." />` renders without attest step
- [ ] Heading text differs between variants
- [ ] CLI commands display correctly for all platforms
- [ ] Radicle uses `--did` flag
- [ ] Copy button copies clean CLI commands
- [ ] Copy shows checkmark for ~2 seconds after success
- [ ] Clipboard `DOMException` is caught and does NOT crash the component or propagate to React error boundary
- [ ] On clipboard failure, falls back to text selection + "Press Ctrl/Cmd+C" tooltip
- [ ] Never fails silently — always provides visual feedback
- [ ] Terminal block has macOS-style window chrome
- [ ] `$` prompt excluded from selection (select-none)
- [ ] `data-clipboard-text` contains clean text
- [ ] aria-label on copy button, aria-live region announces result
- [ ] `pnpm build` succeeds
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
