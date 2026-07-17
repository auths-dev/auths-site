# Prompt — Make auths.dev immaculate, end to end

You are a founding design engineer for Auths. The homepage was rewritten to sell one
product (the bounded agent). **The rest of the site was not touched, and it shows.**
Your job: make the *entire* site one coherent, on-message, alive thing — not a homepage
bolted onto two older sites.

The bar is **immaculate**. A visitor should never hit a page that looks like it belongs
to a different company, sells a product we've decided not to lead with, or 404s from a
link we put in our own nav. If you finish and any route still fails the checklist at the
bottom, you are not done.

Repo: `/Users/bordumb/workspace/repositories/auths-base/auths-site`
Run it: `bun run --filter @auths/web dev` → http://localhost:3000
Product source (read-only reference, do not edit): `/Users/bordumb/workspace/repositories/auths-base/auths`
GTM that defines the positioning: `../auths/docs/plans/go_to_market/20260717/go_to_market_2026-07-17.md`

---

## 1. What the site sells (the one thing)

**P1 — the bounded agent.** *Your agent can't exceed its budget, and you can prove it.*
One command in front of any MCP server bounds an AI agent to a scope, a budget, and an
expiry, and leaves a signed receipt anyone can verify offline, without trusting the
operator.

The homepage (`apps/web/src/app/page.tsx` → `components/landing-ledger.tsx`) already does
this and is the **reference for tone, layout, and design**. Every other surface must feel
like it was made by the same hand on the same day.

### The anti-scope — what must NOT appear as a live product yet
The owner has explicitly deferred these. They may exist as code in the repo, but they must
not be sold, linked in primary nav, or presented as available:

- **The witness network** (`/network`) — "do not build the network yet."
- **The hosted registry** (`/registry` and all sub-routes, `/explorer`, and `/community`'s
  "hosted public registry … coming soon" framing). `registry.auths.dev` returns **404** —
  we do not ship a page that sells a service that doesn't exist.
- **Commit-signing / supply-chain as the lead.** It's a real capability and a fine
  *secondary* page (see P2 below), but it is not the pitch. 5.94% of developers have ever
  signed a commit; do not lead with it.

**P2 — the neutral referee** (secondary, allowed): *proof your release/agent's work passed,
that anyone can re-verify offline.* This is the `verify`/`sign` GitHub Actions
(github.com/auths-dev/verify, live on the Marketplace) and `verify-spend`. It earns at most
one clearly-secondary page, styled like the rest.

---

## 2. The current state (audited 2026-07-17 — verify before trusting, it will drift)

Three eras of site are currently glued together, in three different visual styles:

| Route | What it is now | Verdict |
|---|---|---|
| `/` | Bounded-agent landing (the ledger). On-message. | **Keep.** The reference. |
| `/compare` | "How Auths Compares" — **15× sigstore, 15× gpg, 14× ssh**, 2× agent. A commit-signing bake-off. | **Remove or fully rewrite.** It argues on the competitor's axis and sells the dead market. If kept at all, it compares *agent controls* (Okta/Entra/AWS vs Auths), never GPG/SSH. |
| `/network` | Witness-network marketing (`NetworkHero`, `NetworkStats`, …). | **Remove from nav + unpublish.** Anti-scope. |
| `/registry` + `/registry/**` + `/explorer` | Registry browse/identity/org/package + identity explorer. Sells the 404 registry. | **Remove from nav + unpublish.** Anti-scope. |
| `/community` | "A hosted public registry … coming soon." Inconsistent style. | **Remove or rewrite** into a real, on-brand community page (GitHub, discussions) with the ledger design — not a registry teaser. |
| `/blog` + 8 posts | Mostly signing/supply-chain/GPG (`why_not_gpg`, `two-supply-chain-attacks`, `sigstore-without-oidc`, `developer-identity-without-a-ca`, `your-did-is-your-api-key`, `announcing-auths`, `replacing-api-keys`, `how-we-audit-our-code`). | **Keep the blog; triage the posts.** Don't delete history. But the index and any post linked from the homepage/nav must be on-message. Reframe or de-list the signing-era posts; `replacing-api-keys` and `how-we-audit-our-code` are closest to the wedge. |
| `/(content)/[...slug]` → `/docs/intro`, `/docs/how-it-works`, `/docs/getting-started` | In-site MDX docs. | **Duplicate of the live `docs.auths.dev` (mkdocs).** Decide: point the About menu at `docs.auths.dev` and retire these, OR restyle them to the ledger as marketing explainers. Do **not** keep two doc sites in two styles. |
| **`/trust`** | **Does not exist — 404.** | **Broken link:** the About dropdown's "Security Model" points here. Create it (on-brand) or remove the link. |

### The nav (`components/site-nav.tsx`) — currently wrong
- Primary: `Overview`, `Compare`, `Network` (+ `Registry` commented out). **Compare and
  Network must go** (or Compare becomes an agent-controls page).
- About dropdown: `Introduction`, `How It Works`, `Getting Started`, `Security Model
  (/trust → 404)`, `Blog`. **Audit every entry**; kill the 404; point docs at the real
  docs or the restyled ones.
- `LIGHT_ROUTES = ['/', '/compare']` — every other route renders **dark chrome**, which is
  why the rest of the site looks like a different product. This is the single biggest
  consistency bug.

---

## 3. The rules (non-negotiable)

### 3a. One design system — the ledger
Defined in `apps/web/src/app/globals.css`. Light, editorial, paper-and-ink:

- `--paper #f6f3ec` background, `--ink #1c1814` text, **one** warm accent `--seal #c2401b`,
  hairline `--rule`. Soft/faint ink for secondary text.
- Fraunces (`--font-display`) for headlines; Geist Sans for body; **mono only** inside
  terminals, code, and small-caps labels.
- Terminals (`#15130f`) are the **only** dark objects on the page — they read like
  photographs tipped into a document.
- Numbered sections (`01`, `02`, …) with a hairline rule and a `SectionMark`. One artifact
  (a terminal, a table, a code pane) per section.
- **One reserved red** (`#c0442e`) for exactly one meaning: a denial. Never decorative.

**Every surviving page uses this system.** No page ships in the old dark chrome. Reuse the
homepage primitives (`SectionMark`, `InkTerminal`, `Prompt`, `Allow`, `Deny`, `InkLink`,
`fadeUp`) — extract them into a shared module if a second page needs them. One shared nav,
one shared footer, applied everywhere. Kill per-page bespoke chrome.

### 3b. Copy rules (I have broken these; do not)
- **Every claim on the page is a command a visitor can actually run.** Pull real strings
  from the product: verdicts are `allowed` / `usage-cap-exceeded` / `outside-agent-scope` /
  `expired` / `revoked` / `proof-unauthentic`; commands are `npx @auths/mcp wrap …`,
  `auths-mcp-gateway verify-spend …`, `auths id agent revoke …`. Invent nothing.
- **Never say** "blockchain", "decentralized", "self-sovereign", or "No CA / No blockchain."
  They file you under a category the buyer has already dismissed. Make positive claims
  instead.
- **Never put** `KERI`, `DID`, `CESR`, or raw `did:keri:…` in visible marketing copy. Use
  `<agent>` / `<root>` placeholders in command examples. Mechanism words ("key event log",
  "delegation", "device-bound key") are allowed **only** in a "How it works" section.
- **Never lead with "offline verification."** Cosign shipped `--offline` in 2023. The honest
  differentiator is *the receipt verifies against the key that signed it, with no trust root
  to refresh* — a claim about long-lived agent/device keys.
- Say **can't / refused / proved / bounded**. Not enables / empowers / leverages / seamless
  / robust. No hedges (just / simply / should / might) except deliberate ones.
- The hero must show a **refusal**, not a success. Everyone claims their agent is safe;
  almost nobody shows theirs saying *no* with a receipt. Keep that discipline on every page:
  lead each proof with the objection it answers.

### 3c. Consistency invariants
- Homepage share card (OG/Twitter) already overridden to the bounded agent. **Do the same
  for every surviving page** — none may inherit the old "sign npm/PyPI/Cargo/Docker" default
  from `lib/metadata.ts`. Audit `constructMetadata()` and every page's `metadata`.
- Every internal link resolves (no 404s from our own nav/footer). Every external link is a
  real URL (check with `curl -sI`).
- No route in the anti-scope is reachable from any nav, footer, or homepage link. If you
  leave the pages in the repo, at minimum unlink them and set them to `noindex`; preferably
  remove them.

---

## 4. Route-by-route action plan (the default; deviate only with a reason)

1. **Nav** (`site-nav.tsx`): primary = `Product` (`/`), `Verify` (P2 page or the Action),
   `Docs` (→ `docs.auths.dev`), `Blog`, `GitHub`. Drop Compare, Network, Registry. Fix or
   remove the About dropdown; if kept, every entry resolves and points at real, on-brand
   content. Make `LIGHT_ROUTES` cover **every** surviving marketing route (or invert the
   default to light).
2. **`/network`, `/registry`, `/registry/**`, `/explorer`**: remove from nav + footer;
   unpublish (delete, or gate behind a flag + `noindex` + a redirect to `/`). None may be
   sold.
3. **`/compare`**: remove, or rewrite as *"Auths vs the agent-identity incumbents"* — the
   table already on the homepage's §02 axis (AWS/Entra/Okta authenticate the agent; none of
   them bound it). Never a GPG/SSH/Sigstore bake-off.
4. **`/community`**: rewrite to a real community page in the ledger style (GitHub, issues,
   discussions, contributing), or remove and link GitHub directly.
5. **Blog**: restyle the index + post layout to the ledger. Triage posts: reframe the
   signing-era ones toward the wedge or move them under an "Essays / archive" heading; keep
   `replacing-api-keys` and `how-we-audit-our-code` prominent. No post linked from primary
   surfaces may lead with commit signing.
6. **Docs**: point the About/nav "Docs" at `https://docs.auths.dev/`. Retire the in-site
   `/docs/*` MDX **or** restyle it to the ledger — never both styles live.
7. **`/trust`**: create an on-brand "How we're trustworthy" page (what a relying party
   checks, `verify-spend`, the audit, the crypto audit status), or delete the About link.
8. **P2 page** (optional, `/verify`): if you build it, one hero — *"Proof your work passed,
   that anyone can re-verify offline"* — plus the `verify`/`sign` Actions and `verify-spend`,
   in the ledger style. Otherwise link the live Action and don't ship a stub.

---

## 5. Make it feel alive (the user asked for this — be tasteful, not a demo reel)

The ledger is calm and editorial; motion should feel like *evidence arriving*, not a
carousel. Concrete, in priority order:

1. **The hero terminal earns its keynote.** It already streams line by line. Make the
   **denial land**: when `usage-cap-exceeded` appears, one beat of the red line flashing or
   a subtle 2px shake, then settle. The refusal is the product — give it the pause a punch
   line gets. Then the `verify-spend` line resolves green. Loop it slowly (or replay on
   scroll-into-view), respecting `prefers-reduced-motion` (no motion → show the final
   frame).
2. **An interactive denial.** In §02 or the hero, a small budget control: drag it past the
   cap and the live verdict flips from `allowed` (seal) to `usage-cap-exceeded` (red), with
   the receipt id updating. The visitor *causes* the refusal. This is the single most
   memorable thing you can build — the page does the thing it claims.
3. **The tamper animation** in §01 (Don't trust us. Check.): show the signed proof, flip one
   byte to red on scroll, and the verdict beneath it turns from `consistent` to
   `tampered-proof`. Proof you can watch break.
4. **Copyable commands.** Every command block gets a hover copy button (there's already a
   `copy-button.tsx`). A visitor should be able to lift `npx @auths/mcp wrap …` in one click.
5. **Scroll-choreographed sections** — you already have `fadeUp`; make it uniform: section
   number ticks in, rule draws left-to-right, headline rises, artifact fades up. Same beat
   every section, so the page has rhythm.
6. **Restraint.** One accent, one red, hairline rules, generous whitespace, real monospace
   in terminals. A subtle paper grain or a hairline caret is welcome; parallax, gradients,
   glassmorphism, and floating blobs are not. Everything must degrade to a clean static page
   with motion off and must not shift layout (no CLS) or drop below 60fps.

Performance/accessibility are part of "immaculate": Lighthouse ≥95 on the homepage, all
interactive elements keyboard-reachable and labeled, color-contrast AA, `prefers-reduced-
motion` honored everywhere.

---

## 6. Guardrails

- **Do not touch the product** (`../auths`). This is a site-only task. Read it to source
  real command strings; never edit it.
- **Do not publish or deploy.** Push to the `gtm-landing-revamp` branch (PR #19) or a
  follow-up branch; the owner merges and Vercel deploys. `npm publish` / tags are not yours.
- **Do not invent product capability.** If a claim isn't backed by a runnable command or a
  real repo/URL, cut it.
- **Delete carefully.** Removing a route is fine (pre-launch, git keeps history), but confirm
  nothing else imports its components first (`grep -rn <Component>`), and update nav/footer/
  sitemap/redirects so nothing dangles.
- Work in small commits with real messages. Run `bun run --filter @auths/web typecheck` and
  `… build` after each surface; both must stay green.

---

## 7. Definition of done — the whole-site checklist (this is the part I skipped)

Do not report success until **every** line is true. Verify each by loading the route and by
`curl`, not by assumption.

- [ ] **Every** route renders in the **ledger** style (paper/ink/seal). No dark-chrome
      marketing page survives. Screenshot each and compare to `/`.
- [ ] No anti-scope surface (network, registry, explorer, registry-as-community) is
      reachable from any nav, footer, or link. `curl` each old path → 404/redirect, and
      `grep` the nav/footer for their hrefs → none.
- [ ] Every internal link in the nav, About dropdown, footer, and homepage resolves (no
      404). Script it: extract every `href`, `curl -o /dev/null -w "%{http_code}"` each.
      `/trust` in particular is fixed or gone.
- [ ] The whole site passes the copy audit — run these greps across `apps/web/src` and
      `apps/web/content` and get **zero** hits in visible copy:
      `blockchain|decentraliz|self-sovereign|No CA`, `\bKERI\b|\bCESR\b|did:keri`,
      `enabl|empower|leverage|seamless|robust`, `fingerprint|Sign code with your fingerprint`.
- [ ] `/compare` is gone or is an agent-controls comparison with **zero** GPG/SSH/Sigstore
      bake-off framing.
- [ ] Blog index + post layout are in the ledger style; no primary-surface post leads with
      commit signing.
- [ ] Docs resolve to one place, one style (`docs.auths.dev`, or restyled in-site — not
      both).
- [ ] OG/Twitter share cards on every surviving page reflect the bounded agent, not the old
      supply-chain default.
- [ ] The hero shows a refusal and it *lands*; at least one section is genuinely
      interactive (the budget flip or the tamper animation); everything degrades cleanly
      with `prefers-reduced-motion`.
- [ ] `bun run --filter @auths/web typecheck` and `… build` both clean. Homepage Lighthouse
      ≥95.
- [ ] You have loaded **every** surviving route in the browser and looked at it. Not grepped
      — looked.

If you can't tick a box, say which and why, in the open. A site that lies about being done
is worse than one that's honestly half-finished.
