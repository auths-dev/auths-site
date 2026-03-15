# fn-8.10 Join page (/join/[code])

## Description
## What
Create the `/join/[code]` route for org invite links.

## Files
- Create: `apps/web/src/app/join/[code]/page.tsx` — server component
- Create: `apps/web/src/app/join/[code]/join-client.tsx` — client component

## page.tsx
- `constructMetadata({ title: 'Join Organization | Auths' })`
- Async: `const { code } = await params`
- Suspense + skeleton fallback

## JoinClient
- Uses `useQuery` with `registryKeys.invite(code)` to fetch invite details
- Loading: skeleton placeholders
- Error states:
  - Network error: "Connection error, try again" with retry button (gap fix: distinguish from 404)
  - 404: "Invalid invite code"
  - Expired: "Invite expired on {date}"
- Success: "You've been invited to join **{org name}** as a **{role}**"
- Primary CTA: `auths org join --code {CODE}` via `CopyCommand`
- "Don't have Auths yet?" → link to `/try?flow=individual&redirect=/join/{code}`

## Styling
- Center-aligned card layout
- Error cards: yellow border for expired, red border for invalid
## Acceptance
- [ ] Invite details fetched and displayed
- [ ] Network error distinguished from 404 (gap fix)
- [ ] Expired invite shows expiry date
- [ ] Join command shown via CopyCommand
- [ ] "Don't have Auths yet?" links to `/try?flow=individual&redirect=/join/{code}`
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
