# Demo bundle

The `/trust` page offers a downloadable `demo-bundle.tgz` so a skeptic can
re-derive an agent's spend on their own machine with one command:

```
tar xzf demo-bundle.tgz && cd demo-bundle
npx -y @auths-dev/mcp verify-spend --log spend.jsonl --registry ./registry \
  --agent did:keri:EHiKP_2dx1U88s4Upir4BxQ1Qc21203WaW1JfSJvn0i2 \
  --root did:keri:EF6K8G4ZgfIjt788itIogc8eDXP948mAo1aQgXwQZJa2
# → consistent — 3 call(s), $0.00 re-derived from signed costs
```

The tarball must contain a real signed `spend.jsonl` plus a materialized
`registry/` (the identity history the signatures verify against, already
checked out — no manual git fetch required), so that the command above prints
`consistent` on a first paste.

`demo-bundle.tgz` is **not** generated here. It is produced from the signed
end-to-end fixture in the `auths` repository and dropped into this directory
before release. Do not commit a hand-made or unsigned bundle: a bundle that
fails `verify-spend` is worse than no bundle. The identifiers baked into the
site's commands live in `apps/web/src/lib/demo-commands.ts` and must match the
bundle exactly.
