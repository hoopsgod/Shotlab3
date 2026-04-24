# Coach → Player Registration Audit (Recommended Path)

## Problem to Solve
Coaches need to register players directly from the **Players** page so players can sign in immediately without self-registering. After coach registration, each player should receive an email containing:

- Team Code
- Sign-in credential bootstrap (temporary password or secure sign-in link)

## Current State (in this repo)

### 1) Coach-side “Add Player” only creates a profile shell
The current `addRosterPlayer` flow only writes a `player_profiles` record (`userId: null`) and does **not** create a real player account or credentials. Players then still need to self-register to appear as full users. This is why the roster card says players need to create an account first.  

### 2) Authentication is local-storage based in the app runtime
`register`/`login` operate on the local `players` array with hashed password values saved in `sl:players`. This model does not support production-grade email onboarding by itself, since there is no durable server-side identity issuance in this path.  

### 3) Team invite infrastructure already exists server-side
The project already has backend invite confirmation/context APIs and SQL RPC support for team membership (`/v1/team-invites/context/start`, `/v1/team-memberships/confirm-context`, and corresponding invite-flow helpers). This is the strongest foundation for a coach-driven registration flow.  

## Recommendation: Use “Provisioned Invite + One-Time Password Set” (Best Practice)

### Why this is the best fit
- Reuses existing invite/team-membership primitives already present in the codebase.
- Avoids storing or emailing permanent passwords in plaintext.
- Supports “coach does the setup” while preserving secure player-controlled credentials.
- Easier to audit and revoke than direct password assignment.

## Proposed End-to-End Flow

1. Coach opens Players page and clicks **Add Player**.
2. Coach enters at minimum: first name, last name, email (optional jersey #).
3. Frontend calls a new endpoint (example: `POST /v1/coach/players/provision`).
4. Backend validates coach authorization for the team.
5. Backend creates/updates a player identity record and pending membership invite state.
6. Backend generates a **single-use setup token** (short TTL, e.g., 24h).
7. Backend sends email with:
   - Team name + Team Code
   - “Set your password” link containing the one-time token
   - Expiry + fallback instructions
8. Player opens link, sets password once, and account is activated on team.
9. Player signs in directly from then on.

## Email Content Requirements
Use clear transactional copy:

- Subject: `You’ve been added to {Team Name} on Shotlab`
- Body essentials:
  - Team Code: `{TEAM_CODE}`
  - Setup button: `Set your password`
  - Link expiration timestamp
  - Security note: “If you weren’t expecting this, ignore this email.”

## Security Decisions (Non-negotiable)

- **Do not email permanent passwords.**
- If product requires a “password in email,” send only a **temporary one-time credential** that is forced to rotate at first login.
- Store only hashed secrets server-side.
- Token must be single-use + short TTL + auditable.
- Rate-limit coach provisioning and setup attempts.
- Record telemetry/events for invite creation, email delivery attempt, token redemption, and failures.

## Minimal Data Model Additions

Add a coach-provisioning table (or extend existing invite tables) with fields like:

- `team_id`
- `player_email`
- `player_name`
- `setup_token_hash`
- `setup_expires_at`
- `invited_by_coach_user_id`
- `email_sent_at`
- `claimed_at`
- `status` (`pending`, `sent`, `claimed`, `expired`, `revoked`)

This can be layered on top of existing invite flow objects rather than replacing them.

## API Surface to Add

- `POST /v1/coach/players/provision`
  - Auth: coach only
  - Input: `{ team_id, first_name, last_name, email, jersey_number? }`
  - Output: `{ player_id, status, email_delivery_status }`
- `POST /v1/player-auth/claim`
  - Input: `{ setup_token, new_password }`
  - Output: `{ ok, player_id, team_id }`

Optional:
- `POST /v1/coach/players/:id/resend-invite`
- `POST /v1/coach/players/:id/revoke-invite`

## Frontend Changes (Players Page)

1. Expand current add-player form to require email.
2. Replace local-only `addRosterPlayer` behavior with API-backed provisioning.
3. Show per-player invite state badge:
   - `Invite Sent`
   - `Claimed`
   - `Expired`
4. Add coach actions: `Resend Email`, `Copy Team Code`, `Revoke`.

## Migration Strategy

1. Keep existing self-register path for backward compatibility.
2. Add new coach-provision path behind a feature flag.
3. Track completion funnel:
   - coach_provision_started
   - invite_email_sent
   - invite_claimed
   - first_successful_login
4. After adoption, make coach provisioning default in Players page.

## Practical Rollout Plan

### Phase 1 (Fastest secure win)
- Add provisioning endpoint + email send + claim endpoint.
- UI: add email field and “Invite sent” state.

### Phase 2
- Resend/revoke flows, better error states, analytics dashboards.

### Phase 3
- Harden anti-abuse (cooldowns, deliverability controls, bounce handling).

## Key Risks and Mitigations

- **Risk:** Deliverability issues.  
  **Mitigation:** Use transactional provider with domain authentication + retries + resend action.

- **Risk:** Coach typos wrong email.  
  **Mitigation:** Confirm email entry + revoke/reissue tooling.

- **Risk:** Token leakage.  
  **Mitigation:** One-time tokens, short TTL, forced password set, device/IP logs.

## Bottom Line
The best implementation for Shotlab is **coach-initiated player provisioning using your existing team invite backbone plus one-time password setup email**. It gives coaches the frictionless workflow they want while keeping account security and auditability production-safe.
