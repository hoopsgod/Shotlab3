# MVP Loop + Viral/Team Growth Foundation

## Core MVP Product Loop

### Coach loop
1. Create team.
2. Add team branding (logo/colors) for team identity.
3. Create drills and priorities for daily/weekly focus.
4. Share team join code with players.
5. Review player progress, attendance, and leaderboard movement.

### Player loop
1. Join team using join code.
2. See today's focus and assigned drill priorities.
3. Log shots/workout activity.
4. Appear on team leaderboard.
5. Track progress trends over time.
6. Return next day to repeat cycle.

## First Viral/Team Growth Loop (Foundation Only)

### Scope for this phase
- Prepare architecture and UX seams, without full social feed or backend migration.

### Planned primitives
- **Shareable team join code**: stable code string coach can copy/share.
- **Player invite link**: deep-link entry point carrying join context.
- **Shareable progress card**: image/card export surface for player milestones.
- **Team leaderboard challenge**: lightweight challenge framing around existing leaderboard.
- **Coach weekly challenge**: coach-configured weekly objective visible to team.

### Architecture notes
- Keep invite/join entry points modular so web/app store builds can route to the same join handler.
- Use defensive null-safe state for invite context, leaderboard snapshots, and challenge metadata.
- Reuse existing dashboard surfaces before adding new screens.
- Preserve demo behavior by isolating growth features behind non-breaking defaults.
