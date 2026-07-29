# ShotLab Signed Session Integrity — Phase 1

## Objective

Replace caller-supplied email headers as production identity proof for ShotLab's legacy accounts and the newest coach-only APIs.

## Session lifecycle

1. `/v1/legacy-auth/login` verifies the stored password hash.
2. The server creates a 32-byte opaque token.
3. Only the SHA-256 token hash is stored in `legacy_auth_sessions`.
4. The raw token is returned in `sl_legacy_session`, an HttpOnly, SameSite=Lax cookie.
5. `/v1/legacy-auth/restore` ignores the cached email as identity proof and resolves the profile from the server session.
6. The existing `auth_logout` event sends a keepalive request to `/v1/legacy-auth/logout`, which revokes the server record and clears the cookie.

## Dual-auth support

Protected APIs resolve identity in this order:

1. Valid legacy HttpOnly session cookie.
2. Supabase bearer token verified through `/auth/v1/user`.
3. Official ShotLab demo identity on the approved Cloudflare demo host.
4. Development-only email header on localhost or `.test` hosts, or when `ALLOW_INSECURE_HEADER_AUTH` is explicitly enabled.

Production email headers are not accepted as identity proof.

## Protected in this phase

- Team Focus and coach-priority read/write routes.
- Coach Follow-Up read/write routes.
- Legacy profile restore.

Other older API routes that still use `readUserId` remain a later migration phase. This PR must not be represented as complete application-wide auth replacement.

## Deployment order

1. Pass the Signed Session Integrity and full regression workflows.
2. Apply `migrations/038_legacy_auth_sessions.sql` to production Supabase.
3. Verify RLS, grants, constraints, and indexes.
4. Merge the PR.
5. Confirm a registered legacy account can sign in, refresh, use Team Focus, use Follow-Ups, and log out.

## User impact

Legacy users with only the old local email cache and no new server cookie will be returned to sign-in once after deployment. Their account and team data are not deleted. A successful login establishes the new session.

## Operational rules

- Do not set `ALLOW_INSECURE_HEADER_AUTH` in production.
- Do not log raw cookies, bearer tokens, token hashes, passwords, or service-role keys.
- Do not expose `legacy_auth_sessions` through client grants or RLS policies.
- The support team should treat repeated `session_required` responses as a sign-in/session issue, not an account deletion.
