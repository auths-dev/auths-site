-- The verified quorum shape behind a witness-tier observation (network Epic I1/I2).
--
-- `anchor_tier` becomes derived, never claimed: the worker writes `witness`
-- only when the SDK verified the attestation's embedded finalized anchor, and
-- records the proven t-of-N here so badges can say "quorum-anchored (t-of-N)"
-- from re-derived facts. Nullable: market-witnessed-only observations (and
-- every pre-network row) carry no quorum.
alter table attestation_checkpoints
  add column if not exists anchor_threshold integer,
  add column if not exists anchor_witnesses integer;
