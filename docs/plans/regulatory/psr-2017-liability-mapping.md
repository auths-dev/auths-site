# Mapping plan — Auths evidence ↔ UK Payment Services Regulations 2017 (agentic-payment liability)

**Status:** STUB · 2026-07-19 · **engineering→legal mapping for counsel review — NOT legal advice.**
**Trigger:** HM Treasury's consultation on modernising payments regulation for agentic AI, its
financial-services AI adoption plan (agentic-payments "trust framework" = **high** priority), and
the FCA/BoE commentary (Sheldon Mills' review; Governor Bailey's Mansion House remarks). See the
"Market & regulatory signal" section of [`../tools/auths-receipts.md`](../tools/auths-receipts.md).
**Scope:** how the Auths delegation + `EvidenceBundle` + anchored verdict answer the *legal* question
the regulator says must be answered first. **Not** a legal opinion — every regulation reference below
is to be confirmed by qualified counsel (e.g. a payments/AI-law firm).

> **The one thesis.** Auths turns *"did the agent exceed the authority conferred by the payer?"* — the
> question the Treasury/BoE say must be resolved **before** liability can be allocated — into a
> **cryptographic, re-derivable fact**, trusting no vendor. That is the precondition for any liability
> regime other than the fallback Governor Bailey fears: *the principal is fully liable at all times.*

---

## 1. The legal question, in the regulator's words

- **Malcolm Dowden (Pinsent Masons, AI law):** *"The core issue … is determining when a payment
  effected by agentic AI exceeds authority given by the payer, whether through hallucination or
  goal-oriented behaviour."* And: *"it would first be necessary to work out whether the system has
  exceeded the authority conferred on it by the payer before being able to address allocation of
  liability."*
- **Andrew Bailey (Governor, Bank of England):** *"a principal becomes responsible for an agent
  while the agent operates within the remit given to it by the principal. If the agent goes beyond
  that remit … it becomes responsible."* — but with no legal persona, *"does that leave the principal
  responsible at all times? If so, principals may need to constrain agents in ways that cut against
  … innovation."*

Both reduce to the same primitive: a **machine-enforceable, provable remit**, and a way to decide
**within-remit vs. exceeded-remit** after the fact. That is precisely an Auths scoped delegation +
an anchored `EvidenceBundle` verdict.

## 2. Dowden's three PSR-2017 provision clusters → Auths

Dowden identifies the interaction of three provision clusters under the PSR 2017. *(Exact regulation
numbers to be confirmed by counsel — the mapping is by legal concept.)*

| PSR-2017 provision cluster (Dowden) | The legal concept | Auths artifact that evidences it |
|---|---|---|
| Rules establishing **consent / authority** | Was the transaction authorised by the payer? | The **signed delegation** (scope, cap, currency, time window, **counterparty policy**) — the payer's key-signed mandate, anchored in the KEL. Consent is a signature, not an assertion. |
| Rules requiring the payer to act **within the issuer's terms & conditions** | Did the agent stay inside the granted envelope? | The **anchored call verdict** re-derived by `verify-spend` / `judgeCall`: `authorized` iff *within* scope ∧ counterparty policy ∧ budget ∧ time; else the specific breach (`out-of-scope` / `out-of-counterparty` / `over-budget` / `expired`). |
| Rules allocating **liability for unauthorised payments** | Who bears the loss? | The `EvidenceBundle` — a portable, offline-re-derivable record that *proves* within-remit vs. exceeded-remit **as of head H**, so liability can attach to the correct party instead of defaulting to the principal. |

## 3. Why this changes the liability default (the value, stated plainly)

Bailey's fork: an agent is either **a tool** (principal fully liable for everything) or **an agent**
(liable itself once it exceeds its remit). The *agent* regime — the one that lets autonomy exist
without making the human liable for every hallucinated purchase — is only operable if
**"exceeded the remit" is a provable fact.** Today it is not, so the law tends to the *tool* default.

Auths supplies the missing fact:
- the **remit** is the signed delegation (constrainable precisely: scope, cap, time, **counterparty**);
- **within-vs-exceeded** is the re-derived verdict;
- the proof is **checkable by a court/regulator trusting no vendor** — which a centralized "trust our
  registry" control plane (Skyfire, Visa/Mastercard agent rails) cannot offer, and which is the exact
  property a legal-grade / admissible artifact needs.

And it goes one step past proof: Auths is the **reversal *authority*, not the reversal *rail*.** For
the consumer-protection "reverse / redress" duties (Breeden; the Mills review), Auths re-derives the
parties (via the org delegation chain-walk), the transaction, whether authority was exceeded, and the
**amount owed**, and emits a signed `ReversalDetermination` the rail (Stripe / x402 / an escrow)
executes — Auths never moves or holds the money (`../tools/auths-receipts.md` RC-E3.5). On an
irreversible rail the determination degrades to a *proven claim*, which is why a pre-hold (escrow) is
the companion primitive. Auths makes the repayment **decidable and computable**; it does not
custody funds and does not invent the apportionment rule.

## 4. Counterparty-binding completes "the remit"

A remit that constrains *what* and *how much* but not *whom the agent may pay* is not a meaningful
constraint — a prompt-injected, in-scope, under-cap agent can still pay an attacker. The
**`counterpartyPolicy` port** (`AllowAll` default | `AllowList` | `Predicate`), **signed into the
grant** and re-derived as `out-of-counterparty`, is what makes the remit legally complete and gives a
regulated principal a constraint it can *prove* held. See §2.4 / RC-E1.4 / RC-E2.2 / RC-E5.2 (rows
20–21) in [`../tools/auths-receipts.md`](../tools/auths-receipts.md).

## 5. Treasury's three framework focus areas → Auths surfaces

| Treasury focus area | Auths |
|---|---|
| clear legal constructs + **dispute mechanisms** to **assign accountability** | `auths-receipts` (Portfolio 1) — `EvidenceBundle`, `dispute_evidence`, non-custodial escrow |
| **standardised identity & verification** for AI / autonomous agents | Auths delegation, DID/KERI agent identity, delegation anchoring |
| interoperable standards for trusted **machine-to-machine authentication** | `Auths-Presentation` agent passport + x402 auth |

"Industry should lead on the development of these new standards" — the opening to position the
**re-derivable, non-custodial** primitive as the neutral substrate a standard can adopt.

## 6. Honest caveats

- **Not legal advice; consultation, not law.** UK-specific, early-stage; regulation numbers and legal
  conclusions require counsel. Timelines run in years.
- **Standards race.** "Industry should lead" invites well-funded incumbents; winning is a
  distribution/alliance game, not only a technical one.
- **Admissibility is unproven.** "Cryptographically re-derivable" ≠ "accepted as evidence in a UK
  dispute/court" without precedent or a named framework endorsement — that is exactly what engaging
  the consultation is for.

## 7. Next steps

1. **Respond to the HM Treasury consultation** with this mapping + a working, re-derivable reference
   implementation to point at (cheap, high-leverage, positions Auths as a standards voice).
2. **Counsel review** — confirm the PSR-2017 provision references, the SCA (strong customer
   authentication) interaction, and whether the `EvidenceBundle` meets an evidential standard.
3. **Map to the emerging protocol landscape** (AP2 mandates, x402, ACP) so the Auths verdict is
   legible as *the* accountability layer those payment-scoping protocols lack.
4. **Draft the "compelling-evidence" export** (RC-E3.4) against whatever format the framework blesses,
   with a real dispute-filing design partner.

## Cross-references

- [`../tools/auths-receipts.md`](../tools/auths-receipts.md) — the product plan; §"Market & regulatory
  signal", §2 trust model, §2.4 verdicts (incl. `out-of-counterparty`), RC-E3 dispute evidence.
- [`../market/monetization.md`](../market/monetization.md) — tiers; the regulated buyer is Fleet/Enterprise.
- [`../storage/spend-attestation-privacy.md`](../storage/spend-attestation-privacy.md) — proving
  activity/accountability without exposing the counterparty graph (privacy ↔ accountability balance a
  regulator will also probe).
