# Manual Smoke Test: Player Stat Visibility in Coach Team View

Use this in production (or production-like) as a lightweight verification checklist.

1. Register a **coach** account.
2. Create a **team** from the coach flow.
3. Register a **player** account with a different email.
4. Have the player join the team using the team invite/join code.
5. As the player, log one unique **At Home Shots** stat (example: made value `137`).
6. As the same player, log one unique **Drill Score** stat (example: score value `73`).
7. Log out, then log in as the coach.
8. Open the coach team/dashboard view and verify **At Home Shots** shows the player and the unique home-shots value for that team.
9. Verify **Drill Scores** separately still show the player and unique drill value for that same team.
10. Confirm data from another team does not appear in either leaderboard view.
11. Optional cleanup: remove/archive temporary test users and team after verification.

## Regression intent

This checklist validates that:
- Player-entered At Home Shots stats persist with the correct team context.
- Player-entered Drill Scores persist with the correct team context.
- Coach team data reads include both stat categories.
- Team scoping prevents data from appearing under the wrong coach/team.
- Empty states still render safely when no stats exist.
