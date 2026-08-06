# Phase 4: Workspace Recovery and Data Reliability

Phase 4 prevents one failed Coach or Player feature from replacing the entire app with a global crash screen.

## Protected workspaces

- Coach Players and Events dashboards
- Coach operational intelligence panels and drawers
- Player Daily Command Center
- Player identity header
- Player Career History
- Player workspace command bars, filters, and guidance

## Data-state contract

Leaderboard cards now distinguish four states:

1. loading — data is still being retrieved
2. error — data is temporarily unavailable, while saved results remain safe
3. empty — the query succeeded but there is no qualifying activity yet
4. ready — verified leaderboard rows are available

## Recovery contract

- lazy-module and chunk failures request a reload
- network, permission, and render failures offer section-level retry
- raw error messages are never rendered to users
- recovery events report only a safe code and workspace label
- recovery does not clear locally saved training data

## Compatibility

Phase 4 does not change authentication, permissions, persistence, scoring, routes, database schemas, or leaderboard calculations.
