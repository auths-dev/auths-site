# Witness Network

Your job:

Review these:
- Aspirational paper: /Users/bordumb/workspace/repositories/auths-base/auths-site/docs/papers/accountability-without-consensus.md 
- Feedback: /Users/bordumb/workspace/repositories/auths-base/auths-site/docs/plans/network/feedback.md
- Witness Network Spec: /Users/bordumb/workspace/repositories/auths-base/auths-site/docs/plans/network/initial_spec.md

Review the auths repo

For example, the initial_spec.md says:
LogAppend-only, Merkle-committed; serves inclusion + consistency proofs; never rewrites (I-DEGRADE-3).local file + object store (S3/GCS/Azure Blob), Trillian backend

We have some of these ideas in:
/Users/bordumb/workspace/repositories/auths-base/auths/crates/auths-infra-rekor/src

One might ask: should we abstract auths-infra-rekor into a general LogAppend-only, Merkle-committed log that is vendor agnostic?
We need to answer those sorts of questions 

Your output:
- A robust spec called "final_spec.md"
- Must include overview of the problem
- Split different sections by repo
    - Recommended structure (what goes in auths, separate repo) and recommend filesystem per repo
    - Recommended build/devops to make things efficient / maintainable
- Each repo section should have:
    - Epics
    - subtasks
    - descriptions in plain English - no superfluous prose, cut and dry
    - code snippets to explain things

Constraints:
- We are pre-launch, so it's perfectly fine to refactor violently
- We must adhere to principles in: /Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md
- We must remain an open-core software, with the aim to make profit on some paid tier products. How to gate this is important
- We don't want bloated repos - if you see opportunity to consolidate cleanly, do so

Write your plan here:
/Users/bordumb/workspace/repositories/auths-base/auths-site/docs/plans/network
