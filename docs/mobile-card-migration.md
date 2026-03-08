# Mobile card migration note

- `HeroBanner` outer section shell now uses `HeroCard` (keeps existing title/subtitle/action internals).
- `EmptyState` now uses `EmptyStateCard` to standardize icon/title/body/CTA spacing.
- `LoadingState` and `ErrorState` now use `InsightCard` for shared shell treatment.
- `ProgressCharts` chart/recommendation/dialog wrappers now use `InsightCard` instead of repeated inline card styles.
- `DrillDetail` top-level drill container now uses `MediaCard` while keeping existing media loading/error logic.
- `PlayersScreen` summary tiles now use `MetricCard`, player rows now use `ListItemCard`, and invite/no-player blocks now use `HeroCard` and `EmptyStateCard`.
- `ContextSummary` now uses `InsightCard` for the shared card header/body structure.
