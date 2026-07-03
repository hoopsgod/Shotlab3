# Manual test account reset

> **WARNING:** This deletes test users and test data. Run manually only after backup. This does not automatically run in production.

Use `admin_reset_test_accounts_keep_aq_coach.sql` only from an admin SQL console after taking a verified backup. The SQL cleans only app database tables; it does not remove Supabase Auth users. A full reset still requires manual Supabase Auth cleanup.

## Required Supabase Auth cleanup

Deleting app rows is not enough. If a test email still exists in Supabase Auth, signup can still fail with: `Account already exists. Please sign in.`

Manual path:

1. Open **Supabase Dashboard → Authentication → Users**.
2. Delete every Auth user except `AQ@gmail.com` (case-insensitive). Do **not** delete `AQ@gmail.com` if it is the coach account you want to keep.
3. Confirm `AQ@gmail.com` still exists in Auth, and confirm `Rick@gmail.com` and every other old test player/coach email are gone.
4. Then run the SQL app-data cleanup, or run the service-role-only `auth.users` delete statements in the SQL if your project permits them.

## Recovery if AQ@gmail.com was accidentally deleted

If `AQ@gmail.com` was accidentally removed from Supabase Auth, sign-in will fail because there is no Auth user even if app database rows remain. Recreate `AQ@gmail.com` manually in Supabase Auth or through the Coach create-account flow, then confirm the app has a matching coach profile/team record. Do not recreate the preserved coach email as a player. Use a different player email for player registration testing.

## Verification checklist

After Auth cleanup and SQL cleanup:

- `AQ@gmail.com` remains in Supabase Auth and as the only coach account.
- `Rick@gmail.com` no longer exists in Supabase Auth.
- `AQ@gmail.com` has a coach profile/team record.
- No old player accounts, player profiles, roster/team membership rows, scores, shot logs, or program scores remain.
- Coach roster is empty until new players register with the coach code.
- A new player can register with a previously used email after that email's Auth user is deleted.
