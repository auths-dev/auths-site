# Hyperlink audit — every link on auths.dev, what it actually resolves to, and what's wrong

Scope: every `href` reachable from the live site (`apps/web`) — nav, footer, homepage,
`/verify`, `/trust`, `/blog` index, and all 8 blog posts. For each link I followed it (GitHub
API, npm/crates registries, `curl`, or a fetch of the rendered page) and recorded what a real
visitor would actually land on. This is a research/audit doc — it does not propose page copy.
Another pass decides content; this one just lists what's broken, misleading, or missing.

---

## 0. The one finding that undermines most of the site — UPDATE: half-fixed, one gap remains

**Update (same day):** `auths-dev/auths-mcp` has been made **public**. Re-checked via the
GitHub API — `isPrivate: false`, and the README is now readable by anyone. That resolves half
of the original problem: a visitor who clicks through can now actually read the code and the
design behind the wrap/gateway flow, instead of hitting a 404/access wall.

**What's still broken, re-verified just now:**

- The hero's headline command is `npx @auths/mcp wrap --budget '$20' --ttl 30m -- my-mcp-server`.
  The code comment above it says *"Every command on this page is one a visitor can actually
  run."* `@auths/mcp` is **still not published to npm** — `registry.npmjs.org/@auths/mcp`
  still returns `"error":"Not found"`, and the repo's own `package.json` still has
  `"private": true` and `"version": "0.0.0"`. A visitor who copies the hero command still gets
  a 404 from npx.
- More importantly, **the now-public README says so itself.** It has a `## Status` section
  reading, verbatim: *"**Scaffold.** The product isn't built yet... Every step fails today
  because the gateway is a stub."* It also flags the example scenarios and recorded transcript
  as placeholders. So the ideal link target — the repo that actually documents the exact
  install command shown on the homepage, under a `## Install (the one line)` heading — now
  also candidly tells the visitor the thing doesn't work yet.
- `auths-mcp-gateway verify-spend` — the second command in the hero, and the subject of section
  01 ("Don't trust us. Check.") — is still not documented on `docs.auths.dev`. The full CLI
  reference at `docs.auths.dev/cli/commands/primary/` lists `init`, `sign`, `verify`, `status`,
  `whoami`, `pair`, `trust`, `doctor`, `config` — no `wrap`, no `verify-spend`.
- The repo that most of the site's "learn more" links actually point to,
  `github.com/auths-dev/auths` (the core identity repo, *not* `auths-mcp`), still has a README
  that's entirely about commit signing and never mentions MCP, agents, budgets, or wrapping a
  server. The links are pointed at the wrong repo regardless of the `auths-mcp` status.

**Revised net effect:** there is now a real, public, on-topic destination
(`github.com/auths-dev/auths-mcp`) that none of the current links use — every "How the audit
works" / "Read the quickstart" link on the homepage still points at the *other*, unrelated
repo (§2). But pointing them at the correct repo today would trade one problem for a sharper
one: instead of "this link explains nothing," it becomes "this link takes you to the maintainers
saying, in their own words, that the thing the homepage just showed you doesn't work yet." A
visitor who reads `## Status` right after the hero's confident "Your agent can't exceed its
budget. And you can prove it." is going to notice the contradiction.

This is a launch-sequencing decision, not a copy fix: either (a) publish `@auths/mcp` to npm
and clear/update the `## Status` section before pointing homepage CTAs at `auths-mcp`, or (b)
keep the current repo-root links as an interim state but stop implying (via "how it works" /
"quickstart" link text) that they lead to a working quickstart, since none of the real
candidates — `auths` or `auths-mcp` — currently deliver one.

---

## 1. Global chrome (nav + footer — present on every page)

| Text | Destination | Verdict | Note |
|---|---|---|---|
| Logo / "Auths" | `/` | OK | |
| "Product" | `/` | OK | |
| "Verify" | `/verify` | OK | |
| "Blog" | `/blog` | OK | |
| "Docs" | `https://docs.auths.dev/` | OK | Real, populated MkDocs site — getting-started, concepts, guides, CLI reference, architecture, error codes. This is a good link; see §0 and §4 for where it *should* be used but isn't. |
| GitHub icon (aria-only, no visible label) | `https://github.com/auths-dev/auths` | OK, resolves | Icon-only link with no visible text — fine for an icon button, but confirm the aria-label ("GitHub") is the only accessible name; it is. |
| Footer: "Check it" / "What it bounds" / "Wrap a server" / "Revoke" / "How it works" | `/#audit` `/#bound` `/#wrap` `/#revoke` `/#how` | OK | All five anchors exist as real section ids on `/`. |
| Footer: "Verify a release" | `/verify` | OK | |
| Footer: "Blog" | `/blog` | OK | |
| Footer: "Security" | `/trust` | OK | |
| Footer: "Docs" | `https://docs.auths.dev/` | OK | |
| Footer: "GitHub" | `https://github.com/auths-dev/auths` | OK, resolves | Same repo-root pattern as above. |

No social links anywhere on the site (no Twitter/X, LinkedIn, Discord, Mastodon). Not
necessarily wrong, but worth a deliberate decision rather than an omission — there's currently
no lower-commitment way to follow the project than "star/watch a GitHub repo."

---

## 2. Homepage (`/`, via `landing-ledger.tsx`)

| Section | Text | Destination | Verdict |
|---|---|---|---|
| Hero | "Bound an agent in 5 minutes" | `#wrap` (in-page anchor) | OK — jumps to §03, which shows the config snippet. Note the button *promises a task* ("bound an agent") but the destination is a read-a-snippet section, not a guided flow. Borderline — the anchor works, but nothing past that point actually walks you through doing it end to end (see §0: the walkthrough would live off-site, and off-site doesn't exist publicly). |
| Hero | "See a stranger verify it" | `#audit` (in-page anchor) | OK |
| §01 "Don't trust us. Check." | "How the audit works" | `https://github.com/auths-dev/auths` | **Wrong repo.** Points at the core identity repo, which has nothing on `verify-spend` or the receipt model this section just demonstrated. The correct repo now exists and is public (`github.com/auths-dev/auths-mcp`) but its own README currently self-flags the gateway as a stub — see §0 before relinking here. |
| §03 "Works with what you have." | "Read the quickstart" | `https://github.com/auths-dev/auths` | **Wrong repo, and the right one isn't launch-ready either.** `auths-mcp`'s README has an `## Install (the one line)` section with this exact command — the natural link target — and it's now public. But see §0: that same README says the gateway is a scaffold/stub today, so relinking here surfaces a "doesn't work yet" admission right under a "read the quickstart" CTA. `docs.auths.dev`'s "Getting Started" (`getting-started/install/`) is a third option but documents commit signing, not the MCP wrap flow, so it doesn't fit either as-is. |
| CTA (bottom) | "Read the docs" | `https://docs.auths.dev/` | OK — correct destination, and notably this is the *only* place on the whole site that actually links to the real docs site instead of the GitHub repo for a "learn more" CTA. Section 01 and 03 above should probably follow this pattern once/if the underlying content exists. |
| CTA (bottom) | "github.com/auths-dev/auths" (link text is the literal URL) | `https://github.com/auths-dev/auths` | OK — this one makes no promise beyond "here's the repo," so the mismatch problem doesn't apply. Honest link. |

---

## 3. `/verify`

| Text | Destination | Verdict |
|---|---|---|
| "auths-dev/verify" | `https://github.com/auths-dev/verify` | OK, resolves. Real, public GH Action repo, matches the page's own embedded YAML example. |
| "auths-dev/sign" | `https://github.com/auths-dev/sign` | OK, resolves. Real, public GH Action repo. |
| "The bounded agent, in full" | `/#audit` | OK — internal anchor back to the homepage's audit section. |

This page is the cleanest on the site — every link's destination matches what the link text
promises, and both external repos are real and public.

---

## 4. `/trust`

| Text | Destination | Verdict |
|---|---|---|
| `security@auths.dev` | `mailto:security@auths.dev` | Unverified (can't confirm inbox exists/is monitored from here) but consistent with the domain — flag to confirm deliverability before this page gets real traffic, since it's the disclosure contact for security researchers. |
| "Read the source" | `https://github.com/auths-dev/auths` | OK — text says "read the source," destination is source. No mismatch (contrast with §01/§03 on the homepage, which promise an *explanation*, not source). |
| "How we audit our code" | `/blog/how-we-audit-our-code` | OK, internal, resolves. |

Also worth noting: this page states *"the implementation has not yet had an independent
cryptographic audit. When it has, the report will be linked here."* — correctly, there's no
placeholder/dead link for that yet. Fine as-is, just flagging so whoever ships the audit report
later knows this is the page that promised it.

---

## 5. `/blog` index

`Link` to each post resolves via the same `[...slug]` route; no issues. The two "lead" posts
(`replacing-api-keys`, `how-we-audit-our-code`) and the "archive" section both render real,
existing MDX files. No broken post links.

---

## 6. Blog post outbound links

### `replacing-api-keys.mdx`
| Text | Destination | Verdict |
|---|---|---|
| "Read the code" → `github.com/auths-dev/auths` | same repo-root pattern as §0 | Same caveat — fine for "read the code" framing (honest), but if this post ever discusses the MCP/agent-bounding side, the same public/private gap applies. |
| 3 related-post links | internal `/blog/...` | OK, all resolve |

### `how-we-audit-our-code.mdx`
| Text | Destination | Verdict |
|---|---|---|
| "capsec" (first mention) | `https://github.com/bordumb/capsec` | **Stale org.** This repo now lives at `auths-dev/capsec` — GitHub 301-redirects `bordumb/capsec` → `auths-dev/capsec`, so it still resolves, but every mention on this page uses the personal-account URL instead of the org. Cosmetic/branding issue, not a broken link, but odd for a page about how "we" (the org) audit "our" code to point at a personal account. |
| "runtime capability control" | `https://github.com/bordumb/capsec#runtime-capability-control` | Same stale-org issue; anchor itself is valid (confirmed the `## Runtime Capability Control` heading exists in the README). |
| "formally verified" | `https://github.com/bordumb/capsec/tree/main/proofs` | Same stale-org issue; `proofs/` directory does exist. |
| "Code: github.com/bordumb/capsec" | same | Same stale-org issue. |
| "Lean 4" | `https://lean-lang.org/` | OK |

### `two-supply-chain-attacks.mdx`
| Text | Destination | Verdict |
|---|---|---|
| "Axios was hijacked" | stepsecurity.io blog post | OK, resolves |
| "LiteLLM was backdoored" | endorlabs.com article | OK, resolves |
| "Auths" | `github.com/auths-dev/auths` | Same repo-root-as-explainer pattern; this post is about signing/supply chain, which the repo *does* cover, so no mismatch here. |
| "sign releases" / "verify commits" (two separate link texts) | **both** point to `github.com/auths-dev/auths` | **Mismatch.** These two distinct capabilities are two distinct, real, public Action repos (`auths-dev/sign` and `auths-dev/verify`, both confirmed public) — but the post links both phrases to the generic core repo instead of the specific Action repos, which exist and would be more precise/useful destinations. |
| "Rust crate" | `crates.io/crates/auths-verifier` | OK, confirmed live on crates.io (13 published versions, latest 0.1.3). |
| "WASM module" | `npmjs.com/package/@auths-dev/verifier` | OK, confirmed live on npm (latest 0.1.3). |
| "open an issue" | `github.com/auths-dev/auths/issues` | OK |
| "PEP 740" (×2) | peps.python.org | OK, resolves |
| "Sigstore" | sigstore.dev | OK, resolves |

### `sigstore-without-oidc.mdx`
| Text | Destination | Verdict |
|---|---|---|
| "The Three Paths to Signing a Commit" | `/blog/why_not_gpg` | OK, internal |
| "search.sigstore.dev/?logIndex=…" | live Rekor search deep link | OK, resolves, returns real data |
| "github.com/auths-dev/auths" | repo root | OK for "the code is at" framing |
| Plain text (not a link): `docs/design/transparency-log-port.md` | — | **Missed opportunity, not a broken link.** This is written as an inline code path, not a hyperlink, so a reader can't reach it at all without cloning the repo. |
| Plain text (not a link): "ADR-007" | — | **Missed opportunity.** Also not linked — and unlike the design doc, this one has a real, live public destination already: `docs.auths.dev/architecture/ADRs/007-agent-identity-via-delegation/` exists on the docs site right now and could be linked directly. |

### `why_not_gpg.mdx`, `your-did-is-your-api-key.mdx`, `announcing-auths.mdx`,
`developer-identity-without-a-ca.mdx`
All outbound links (HN comments, IETF Blake3 draft, `github.com/auths-dev/auths`, internal
`/blog/...` cross-links) resolve correctly and match their link text. No issues found in these
four posts.

---

## 7. Cross-cutting patterns worth fixing as a batch, not one link at a time

1. **The "explain X" vs. "here's the repo" conflation.** Nine separate links across the site
   use link text that promises an *explanation* — "How the audit works," "Read the quickstart"
   — but all resolve to the same GitHub repo root, which is not an explanation, it's source
   code, and (for the two homepage MCP-related links) the *wrong* repo besides — the real one,
   `auths-mcp`, is public now but self-describes as an unfinished scaffold (§0). Meanwhile the
   one link on the whole site with a genuinely explanatory, navigable destination
   (`docs.auths.dev`) is used exactly once. This is the pattern you flagged in the original ask,
   and it's systemic, not a one-off.
2. **Repo-root vs. specific-repo.** In three places (two in `two-supply-chain-attacks.mdx`, one
   implicitly on `/verify` where it's actually done correctly) the copy names a specific,
   real, public sub-repo (`auths-dev/sign`, `auths-dev/verify`) but links to the generic
   `auths-dev/auths` core repo instead. `/verify` gets this right; the blog post doesn't.
3. **Personal-account vs. org URLs.** All `capsec` references in one blog post use
   `github.com/bordumb/capsec`; the real, current home is `github.com/auths-dev/capsec`. GitHub's
   redirect saves it from being "broken," but it's a stale/inconsistent brand reference on a
   page specifically about organizational engineering practice.
4. **Prose file paths and doc-IDs that could be real links and aren't.** At least two references
   (a design-doc path, an ADR number) are written as plain text even though a live, linkable
   destination exists for at least one of them (`docs.auths.dev/architecture/ADRs/...`).

---

## 8. New pages likely needed (not scoping content — just flagging the gap)

- `auths-mcp` being public removes the *access* blocker, but not the *readiness* one: its
  README's own `## Status` section says the gateway is a stub today. Either that page needs to
  reach "this actually works" before homepage CTAs point at it, or something that lets a
  visitor see "how the audit works" / "the quickstart" **without** implying it's runnable
  today is needed — a page on this site, or new content on `docs.auths.dev`, scoped once the
  npm publish + stub-replacement work in §0 lands.
- No dedicated landing exists yet for the two GitHub Actions (`auths-dev/sign`,
  `auths-dev/verify`) beyond what's embedded in `/verify`'s copy — worth deciding whether the
  blog's "sign releases"/"verify commits" mentions should point at that in-site page, the docs
  site, or the Action repos directly (right now they default to the generic core repo, per §6).

---

## 9. What's *not* wrong (confirmed working, no action needed)

`/verify` and `/trust` are both internally consistent — every link's promise matches its
destination. All internal anchor links (`#audit`, `#bound`, `#wrap`, `#revoke`, `#how`) resolve
to real section ids. All internal blog cross-links resolve. All non-Auths external citations
(HN, IETF, PEP 740, Sigstore, Lean, StepSecurity, EndorLabs, crates.io, npm) are live and
correct. The `docs.auths.dev` site itself is real, populated, and well-organized — it's simply
under-linked-to from the marketing site.
