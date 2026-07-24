# New Season Wizard UI Mount

The coach-only `NewSeasonWizard` is mounted in the live Players season-management surface directly below the immutable season archive controls and above the active roster.

Integration boundaries:

- Uses the authenticated coach object and current team ID.
- Uses the existing immutable `seasonArchives` collection as its source.
- Displays server-confirmed success only after the rollover persistence layer succeeds.
- Does not mutate an archive or copy historical scores, attendance, RSVPs, streaks, completed events, or completed S&C sessions.
- The production database migration and tightened privilege migration have been applied and verified.
