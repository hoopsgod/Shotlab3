-- Phase 7E: player-owned profile photos surfaced on the coach roster.
-- The application uploads through its authenticated server endpoint; browser clients
-- do not receive service-role credentials or direct write access to Storage.

alter table public.players
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-avatars',
  'player-avatars',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
