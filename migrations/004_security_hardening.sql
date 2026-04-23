create or replace function hash_invite_code(normalized_code text)
returns text
language plpgsql
stable
as $$
declare
  pepper text := current_setting('app.invite_pepper', true);
begin
  if pepper is null or length(pepper) < 16 then
    raise exception 'INVITE_HASH_PEPPER_MISSING_OR_WEAK';
  end if;

  return encode(hmac(normalized_code, pepper, 'sha256'), 'hex');
end;
$$;

alter table invite_join_sessions
  add constraint invite_join_sessions_not_expired_ttl
  check (expires_at > created_at);
