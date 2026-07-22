# Architecture Improvement Specs

Written 2026-07-19, distilled from the receipts-portfolio production hardening run:
three releases (v0.1.10–v0.1.12), the first prod-derived proven-live listings on
market.auths.dev, and a real-money agent loop on base-sepolia. Every epic below
traces to a failure or friction actually hit that day — nothing speculative.

| File | Repo | Themes |
|------|------|--------|
| [auths.md](./auths.md) | `auths` | Self-verifying releases, SDK owns the wire, kill version-skew, honest verdicts, seller ergonomics |
| [auths-site-market.md](./auths-site-market.md) | `auths-site/apps/market` | Deterministic SDK loading, attestation freshness, worker scale, RLS discipline, prod-parity testing |
| [auths-mcp.md](./auths-mcp.md) | `auths-mcp` | Distribution automation, wrap lifecycle UX, payment adapter robustness |

Cross-repo work is cross-referenced inline (e.g. the one-command seller journey
spans all three). Read the incident context at the top of each file first — the
epics are ordered by how much production pain each class of problem caused.
