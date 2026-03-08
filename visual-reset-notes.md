# Visual reset investigation (last 3–5 days)

## Candidate rollback commits

| Commit | Date (ISO -0500) | Message | Why it is a candidate |
|---|---|---|---|
| `e8adbf23dd3afeefa64f95b71d6d4daabc87733b` | 2026-03-06 23:44:22 | Standardize button variants and icon styling | Last non-merge commit before the large March 7 visual redesign burst (tokens, nav, card system, headers, animations). |
| `ad84dca555304522ef4f54f911b30a25c339329e` | 2026-03-06 23:32:11 | Refine coach dashboard header hierarchy | Slightly earlier stable point before final March 6 button/icon standardization. |
| `dffeea3a9de25d7c5ada3727ff49bee5e9d85e4a` | 2026-03-05 22:22:06 | Amplify team branding in coach headers | Pre-March 6 polish train; useful if regressions started with late March 6 coach/mobile refinements. |

## Selected commit

- Selected hash: `e8adbf23dd3afeefa64f95b71d6d4daabc87733b`
- Selection reason: closest point before the high-volume March 7 redesign wave while still keeping late March 6 bug/polish improvements.

## Recovery branch

- Created branch: `visual-reset`
- Branch points to: `e8adbf23dd3afeefa64f95b71d6d4daabc87733b`

## What changed after the selected commit

From `e8adbf2..HEAD`:
- 187 total commits (93 non-merge).
- Changes were dominated by visual-system churn on March 7, including:
  - Global theme/token changes (dark-only tokens, typography and spacing token refactors).
  - Navigation/header redesigns (floating pill tab bar, two-row header, bottom-nav consolidation).
  - Card and hierarchy redesigns (new card system, hero/section hierarchy changes).
  - Interaction/motion additions (animations, overlays, micro-interactions).
  - Viewport preview mode features and additional dashboard/UI rewrites.

These are the most likely regression sources because they touched cross-cutting shared primitives and global styling in a short time window.
