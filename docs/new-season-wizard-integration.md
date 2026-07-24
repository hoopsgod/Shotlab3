# New Season Wizard integration contract

`NewSeasonWizard` is intentionally isolated from the large legacy `App.jsx` state container.

Mount it from the coach-only season archive management surface with:

- `coach`: authenticated coach session object
- `teamId`: active team ID
- `seasonArchives`: durable archives loaded from `/v1/season-archives`
- `existingActiveSeasons`: values loaded from `/v1/seasons`
- `onCreated(result)`: update active-season state and navigate back to coach home

The component must never be rendered for a player role. The server and database independently enforce coach or assistant-coach authorization.

Deployment order:

1. Apply `migrations/034_active_seasons_and_rollover.sql`.
2. Deploy the `/v1/seasons` function.
3. Mount the wizard in the coach archive/season-management surface.
4. Run a registered-coach smoke test.

Do not reset or delete live scores, events, RSVPs, S&C records, or archives during rollover. The new season is a separate identity and membership boundary. Historical data remains available through immutable archives and all-time analytics.
