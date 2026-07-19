-- The witnessing history is the market's own public record of what it observed
-- (head hash, count, cumulative cents, anchor tier) — coarse aggregates only,
-- never per-call rows. The public receipts endpoint reads it with the anon
-- client, so it needs an explicit read policy under RLS.
create policy "attestation checkpoints are publicly readable"
  on attestation_checkpoints for select
  using (true);
