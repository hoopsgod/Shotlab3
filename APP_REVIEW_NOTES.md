# App Review Notes

## Production / Review URL

- Production or review URL: `https://REPLACE-WITH-SHOTLAB-REVIEW-URL.example.com`

## Demo Player Instructions

1. Open the production or review URL.
2. Choose the demo player sign-in option.
3. Confirm the demo player view loads successfully.
4. Log a small number of demo-only shots.
5. Confirm the demo player leaderboard and shot history update for the demo session.
6. Log out when finished.
7. Confirm demo-only shots are reset after logout and do not persist as registered account data.

## Demo Coach Instructions

1. Open the production or review URL.
2. Choose the demo coach sign-in option.
3. Confirm the demo coach dashboard loads successfully.
4. Review dashboard visibility, player summaries, and leaderboard information available to the demo coach.
5. Log out when finished.

## Registered Player Smoke Test

1. Open the production or review URL.
2. Sign in with a registered player account.
3. Confirm the player home/dashboard loads without visible debug, sync, or error boxes during successful flows.
4. Log a valid shot entry.
5. Confirm the shot appears in the player shot history or summary.
6. Confirm the player leaderboard is visible and loads expected data.
7. Log out successfully.

## Coach Smoke Test

1. Open the production or review URL.
2. Sign in with a registered coach account.
3. Confirm the coach dashboard loads without visible debug, sync, or error boxes during successful flows.
4. Confirm assigned player/team visibility is correct.
5. Confirm the coach leaderboard loads expected data.
6. Log out successfully.

## Backend Services That Must Remain Live

- Authentication service for registered player and coach sign-in.
- Database service for account profiles, shot records, team/coach relationships, and leaderboard data.
- Any required serverless functions, API endpoints, or backend policies used by authentication, shot logging, dashboard visibility, and leaderboards.
- Hosting service for the production or review build.

## Known Non-Blocking Limitations

- Demo data is intended for review and testing only and may reset between sessions or on logout.
- Review credentials, URLs, and support contacts may use placeholders until final launch values are assigned.
- Mobile layouts should be reviewed on a real iPhone with Safari before launch, but minor visual differences that do not block core flows are non-blocking.
- Leaderboard ranking or dashboard data may depend on the seeded review data available in the active backend environment.
