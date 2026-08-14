-- Preserve the S&C venue/location across the signed persistence path.
-- This is additive and idempotent so already-provisioned databases upgrade safely.

alter table if exists public.sc_sessions
  add column if not exists location text;

comment on column public.sc_sessions.location is
  'Venue for a Strength & Conditioning session, preserved for coach and player views.';

notify pgrst, 'reload schema';
