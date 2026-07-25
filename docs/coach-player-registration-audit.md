# Coach → Player Registration Audit (Implemented Path)

## Problem Solved
Coaches need to register players directly from the **Players** page so players can activate a real ShotLab login without independently creating a second roster identity.

The implemented flow provides:

- Coach-created roster profile
- Player email capture
- Single-use setup link
- Player-selected private password
- Automatic email when transactional delivery is configured
- Secure **Open Email App** and **Copy Secure Link** fallbacks when it is not

## Implemented End-to-End Flow

1. Coach opens **Players** and selects **Add Player & Send Login Invite**.
2. Coach enters first name, last name, email, and optional jersey number.
3. ShotLab verifies that the requester is authorized for the team.
4. ShotLab creates or links the roster profile without duplicating an existing player identity.
5. ShotLab generates a cryptographically random, single-use setup token.
6. Only the SHA-256 token hash is stored in the database.
7. The setup link expires after 24 hours.
8. When transactional email is configured, ShotLab sends the invitation automatically.
9. Otherwise the coach can:
   - open a pre-addressed email containing the secure setup link; or
   - copy the secure setup link and send it directly.
10. The player opens the link and chooses a private password.
11. The claim transaction activates or updates the player login and links it to the existing roster profile.
12. The setup token is marked claimed and cannot be reused.

## Security Boundaries

- Permanent passwords are never generated for coaches.
- Permanent passwords are never emailed, displayed, logged, or returned by the API.
- Setup tokens are single-use and expire after 24 hours.
- Only token hashes are stored.
- Direct browser access to invitation rows is revoked.
- Claim persistence occurs through a service-role-only atomic RPC.
- A coach cannot silently attach an existing unattached account; the player must claim the invitation.
- Accounts already attached to another team are rejected.
- Coach-role accounts cannot be provisioned as players.
- Existing self-registration and team-code joining remain supported.

## Coach Experience

The coach form shows invitation state:

- `Invite Pending`
- `Invite Sent`
- `Account Active`
- `Invite Expired`
- `Invite Revoked`

When automatic delivery is unavailable, ShotLab shows:

- **COPY SECURE LINK**
- **OPEN EMAIL APP**

The email-app action prepares:

- the player email address;
- subject: `You’ve been added to ShotLab`;
- player greeting;
- single-use setup link;
- expiration notice;
- unexpected-invitation security notice.

## Existing Account Handling

- **No existing account:** create a claimable login through the setup flow.
- **Existing player account already on this team:** link the roster profile and report `Account Active`.
- **Existing unattached player account:** require explicit invitation claim and replace the active password with the player-selected password.
- **Existing player account on another team:** return a conflict.
- **Existing coach account:** return a role conflict.

## Database Changes

### Migration 036

- `coach_player_invitations`
- invitation metadata on `player_profiles`
- RLS and privilege restrictions
- initial atomic invitation claim RPC

### Migration 037

- explicit claim handling for existing unattached accounts
- player-selected password becomes the active login password
- team-conflict enforcement

## API Surface

- `GET /v1/coach/players/provision`
  - coach-only invitation status list
- `POST /v1/coach/players/provision`
  - create or link roster profile and issue invitation
- `POST /v1/player-auth/claim`
  - validate one-time token and activate account with player-selected password

## Transactional Email Configuration

Automatic email uses Resend when these Cloudflare Pages variables are configured:

- `RESEND_API_KEY`
- `SHOTLAB_FROM_EMAIL`
- `APP_BASE_URL=https://shotlab3.pages.dev`

Automatic delivery is an operational enhancement. The secure manual email fallback keeps the feature usable without exposing a password or requiring those variables before launch.

## Verification Completed

- Invitation domain and safety contracts
- Existing authentication and roster regressions
- Production build
- Coach-to-player Playwright flow
- Player password-claim Playwright flow
- Live Supabase RLS and privilege audit
- Rollback-only live claim transaction with no retained test rows
- Season archive, leaderboard, mobile, and preview regressions

## Merge Gate

Before merge, run one real registered-coach smoke test:

1. Add a test player using an email the tester can access.
2. Use automatic email, **Open Email App**, or **Copy Secure Link**.
3. Open the setup link as the player.
4. Choose a password.
5. Sign in with the player email and new password.
6. Confirm the player appears once on the correct roster.
7. Confirm player dashboard, leaderboards, events, S&C, and shot logging load normally.
8. Confirm the setup link cannot be reused.
