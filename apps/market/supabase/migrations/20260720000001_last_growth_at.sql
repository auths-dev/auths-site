-- Proven-live is a decaying signal, not a latch: the worker now clears
-- live_proven_at the moment the trailing window goes flat, and stamps
-- last_growth_at whenever it witnesses positive growth. Expose the timestamp
-- so a programmatic buyer can see when a listing last actually grew.
alter table listings add column if not exists last_growth_at timestamptz;
