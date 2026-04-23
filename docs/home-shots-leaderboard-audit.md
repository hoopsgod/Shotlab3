# Home Shots Leaderboard Audit (Coaches + Players)

## Executive summary

The codebase already has a strong foundation for a **team-scoped Home Shots leaderboard**:

- Backend route exists: `GET /v1/leaderboards/home-shots`.
- Authorization is team-membership based (active membership required).
- SQL ranking logic already exists and is optimized with a summary table + trigger-based deltas.
- UI card is already shared by both player and coach surfaces.

So the best implementation path is **not a greenfield build**. It is a targeted extension:

1. Keep the current player leaderboard as-is.
2. Add a second leaderboard scope for coaches (or a combined scope with role labels).
3. Reuse the same API, SQL summary table, and card component by introducing a `scope` parameter.

---

## What already exists (and why it matters)

### 1) API and access control are already aligned with the requirement

The route already validates auth, requires `team_id`, and calls an RPC that enforces active membership on that team. That means both players and coaches can view leaderboards for teams they are registered with, as long as they are active members.

**Implication:** access policy does not need a redesign; it needs only a scoped extension for coach rows.

### 2) UI is already shared on both experiences

`HomeShotsLeaderboardCard` is rendered on both:

- Player dashboard (`tab === "home"`)
- Coach dashboard (`tab === "feed"`)

**Implication:** no net-new component is required; just feed it additional datasets/tabs.

### 3) Data model is already production-minded

The newer migration (`008_home_shots_leaderboard_summary.sql`) moved leaderboard reads from raw aggregation into a maintained summary table (`team_player_home_shot_totals`) with triggers.

**Implication:** adding coach-specific totals is straightforward and performant if we continue using the summary table pattern.

---

## Gap analysis for “coaches and players leaderboard for total home shots”

### Current behavior

The current SQL leaderboard excludes coaches (`role <> 'coach'`) and only returns player rows.

### Requirement gap

If product intent is to rank **both players and coaches**, the current implementation is missing:

- a coach ranking view (or combined ranking)
- role-aware response shape
- UI affordance to switch between leaderboard scopes

---

## Best implementation strategy

## Strategy: extend existing pipeline with leaderboard scopes

Add a `scope` query parameter to the current endpoint:

- `scope=players` (default; backward compatible)
- `scope=coaches`
- optional future: `scope=all`

Then implement the same scope at SQL level.

### Backend/API changes

1. **Endpoint contract**
   - Extend `GET /v1/leaderboards/home-shots` with `scope`.
   - Validate allowed values and default to `players`.
   - Pass `scope` into RPC.

2. **RPC contract**
   - Add parameter `p_scope text default 'players'` to `get_team_home_shots_leaderboard`.
   - Keep existing membership authorization check unchanged.
   - Filter `eligible_players` by role based on scope.

3. **Response shape**
   - Keep current fields for compatibility.
   - Add `scope` to response payload.
   - Optional: include `participant_role` per row for `scope=all`.

### SQL/data changes

1. **Keep summary table; do not regress to raw scans.**
2. Ensure coaches can be joined to summary rows via canonical `player_id` / `email` mapping.
3. If role data quality is mixed, normalize role extraction similarly to current JSON fallback style.
4. Keep top-10 cap and deterministic tie-breakers.

### Frontend changes

1. Add a simple segmented control above existing card:
   - Players
   - Coaches
2. Fetch leaderboard on tab/scope change.
3. Reuse existing loading/error/empty states.
4. Preserve current default view (`players`) to avoid behavior surprises.

---

## Security and correctness notes

- **Do not trust client role claims.** Scope filtering must happen in SQL using team member/player records.
- Continue enforcing active team membership before returning leaderboard rows.
- Keep rate limiting and telemetry in route handler as currently implemented.

---

## Performance notes

The summary-table approach is the right long-term design. It avoids expensive full-table grouping on every request.

To keep performance predictable as usage grows:

- retain index on `(team_id, total_home_shots desc, player_id asc)`
- ensure role lookup path in `eligible_players` remains indexed-friendly where possible
- avoid introducing client-side sorting; backend rank remains source of truth

---

## Rollout plan (low risk)

1. **Phase 1 (API + SQL):** Add `scope=coaches`, keep default `players`.
2. **Phase 2 (UI):** Add scope toggle to player and coach surfaces using the same card.
3. **Phase 3 (tests):**
   - API tests for `scope=coaches` and invalid scopes
   - SQL contract test for role filter behavior
   - UI tests for scope toggle rendering and fetch calls
4. **Phase 4 (observability):** Track scope in leaderboard telemetry events.

---

## Recommended acceptance criteria

1. A registered active **player** can view home-shot leaderboard rows for their team.
2. A registered active **coach** can view home-shot leaderboard rows for their team.
3. With `scope=players`, only non-coach members appear.
4. With `scope=coaches`, only coach members appear.
5. Rank ordering is deterministic and capped at top 10.
6. Existing clients calling without `scope` continue to work unchanged.

---

## Final recommendation

The best path is to **extend the current architecture** (not replace it):

- one endpoint,
- one shared card,
- one summary-table-backed ranking pipeline,
- with a new `scope` dimension for players vs coaches.

This keeps risk low, preserves current behavior, and satisfies the “viewable by both players and coaches for their registered teams” requirement with minimal disruption.
