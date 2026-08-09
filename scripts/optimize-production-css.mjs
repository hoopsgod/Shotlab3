/*
 * Production CSS safety gate.
 *
 * The previous optimizer attempted to prove selector reachability by searching
 * source text for class names. That is unsafe for Vite CSS modules because the
 * production class names (for example `s_a1B2c3`) are generated only during
 * compilation and therefore do not exist in the source corpus. In production
 * this stripped valid Player workspace rules while development remained intact.
 *
 * Keep this stage intentionally non-destructive. The following production
 * stages still perform standards-based CSS restructuring/minification and the
 * guarded global-selector pruning step preserves generated CSS-module classes.
 * Any future selector-level dead-code elimination must operate on the compiled
 * module graph, not source-text guesses.
 */

console.log("Skipped unsafe source-text CSS reachability optimization; preserving compiled CSS-module selectors.");
