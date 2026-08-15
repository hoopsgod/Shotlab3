# Mobile Demo / Registered Parity Closure

This corrective phase exists because PR #1464 proved shared component/shell parity but did not prove that a newly authenticated registered account hydrated the same mobile-visible product state from real persistence.

## Root cause

During a production build, the post-auth route enhancer removed the Auth workspace's authenticated-storage hydration + reload fallback. The App-level login enhancer did await the registered session marker and rerun `hydratePersistedData()`, but partial/empty signed collection results could still leave a newly logged-in mobile account rendering onboarding/default state while Demo rendered populated state.

## Closure requirements

1. Registered login is bound to the newly authenticated identity before collection hydration begins.
2. Core signed collections are retried on transient failures and every mobile-visible collection is written to browser storage.
3. The signed `players` response must contain the authenticated identity; otherwise hydration is not certified.
4. Production builds retain the Auth workspace storage hydration fallback and one clean reload after login.
5. A genuine registered Player browser test must visibly render unique backend markers, including the seeded shot total, event, and S&C venue.
6. Empty, sparse, and populated registered screenshot states must not be byte-identical on state-sensitive mobile pages.
7. Demo and registered accounts continue to use the same production components/navigation; only identity, data, and sandbox capability boundaries may differ.

Do not close this corrective phase based only on shell/computed-style parity.
