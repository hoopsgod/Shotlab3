# Manual Smoke Test: Player Stat Visibility in Coach Team View

Use this in production (or production-like) as a lightweight verification checklist.

1. Register a **coach** account.
2. Create a **team** from the coach flow.
3. Register a **player** account with a different email.
4. Have the player join the team using the team invite/join code.
5. As the player, log one unique stat (example: home shots made value unlikely to collide, such as `137`).
6. Log out, then log in as the coach.
7. Open the coach team/dashboard view and confirm the player plus the unique stat are visible for that team.
8. Optional cleanup: remove/archive temporary test users and team after verification.

## Regression intent

This checklist validates that:
- Player-entered stats persist with the correct team context.
- Coach team data reads include that player's stat.
- Team scoping prevents data from appearing under the wrong coach/team.
- Empty states still render safely when no stats exist.
