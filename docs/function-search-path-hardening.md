# ShotLab Function Search-Path Hardening

## Objective

Remove mutable function-resolution paths from the 15 database functions currently flagged by the Supabase security advisor, without changing their definitions or application behavior.

## Trusted schemas

Migration `040_function_search_path_hardening.sql` sets:

```sql
search_path = public, extensions
```

- `public` contains ShotLab tables, trigger helpers, invite helpers, and leaderboard helpers.
- `extensions` contains the pgcrypto functions used by invite hashing and token generation, including `digest` and `gen_random_bytes`.

## Covered function groups

- Invite normalization, hashing, lookup, context resolution, join confirmation, legacy invite restoration, and coach signup bootstrap.
- Home-shot leaderboard parsing, aggregation, and synchronization triggers.
- Season archive immutability trigger.
- Shot-log roster identity trigger.

## Scope boundaries

This phase changes only function configuration.

It does not:

- replace or edit function bodies;
- change function privileges;
- change tables, RLS policies, grants, or business data;
- modify browser code or `App.jsx`;
- claim to resolve the separate permissive RLS policy findings.

## Deployment order

1. Pass the Function Search-Path Hardening workflow and full product regression matrix.
2. Apply `migrations/040_function_search_path_hardening.sql` to production Supabase.
3. Verify all 15 functions report `function_config = {search_path=public,extensions}`.
4. Run the Supabase security advisor and confirm the matching `function_search_path_mutable` findings are gone.
5. Merge only after database verification.

## Rollback

Each function can be returned to inherited behavior with:

```sql
alter function public.<signature> reset search_path;
```

Rollback should be used only after identifying a concrete function-resolution regression. The preferred correction is to add the required trusted schema explicitly rather than restore a mutable path.