# fn-7.5 Add badge embed section to package pages

## Description
## Add badge embed section to package pages

Add a section to the package detail page showing embeddable badge URLs and markdown/HTML snippets that users can copy for their READMEs.

### Changes
1. Create `components/badge-embed.tsx` — shows the badge image preview and copy-able snippets
2. Badge URL: `{REGISTRY_BASE_URL}/v1/badges/{ecosystem}/{package}`
3. Markdown snippet: `[![Auths Verified](URL)](package_page_url)`
4. HTML snippet: `<a href="..."><img src="..." alt="Auths Verified" /></a>`
5. Each snippet has a `CopyButton` next to it
6. Add to `package-client.tsx` after AuthorizedPublishers

### Design
- Section title: "Embed Badge" with a code icon
- Badge preview: actual `<img>` loading from the badge endpoint
- Two snippet boxes: Markdown and HTML, with copy buttons
- Use `TerminalBlock` component style for snippets
## Acceptance
- [ ] Package page shows "Embed Badge" section
- [ ] Badge preview renders from real endpoint
- [ ] Markdown and HTML snippets are copyable
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
