# Manual test account reset

> **WARNING:** This deletes test users and test data. Run manually only after backup. This does not automatically run in production.

Use `admin_reset_test_accounts_keep_aq_coach.sql` only from an admin SQL console after taking a verified backup. The SQL removes app database rows tied to non-AQ users, but a full reset also requires Supabase Auth cleanup.

## Required Supabase Auth cleanup

Deleting app rows is not enough. If a test email still exists in Supabase Auth, signup can still fail with: `Account already exists. Please sign in.`

Manual path:

1. Open **Supabase Dashboard → Authentication → Users**.
2. Delete every Auth user except `AQ@gmail.com` (case-insensitive).
3. Confirm `Rick@gmail.com` and every other old test player/coach email are gone.
4. Then run the SQL app-data cleanup, or run the service-role-only `auth.users` delete statements in the SQL if your project permits them.

## Verification checklist

After Auth cleanup and SQL cleanup:

- `AQ@gmail.com` remains as the only coach account.
- `Rick@gmail.com` no longer exists in Supabase Auth.
- No old player accounts, player profiles, roster/team membership rows, scores, shot logs, or program scores remain.
- Coach roster is empty until new players register with the coach code.
- A new player can register with a previously used email after that email's Auth user is deleted.
