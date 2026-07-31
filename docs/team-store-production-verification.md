# Team Store production verification

The `Team Store Production Smoke` workflow protects the Phase 1 Team Store release.

## Pull request gate

For Team Store-related changes, the workflow:

1. installs the locked dependency set;
2. runs `tests/team-store-phase-1-contract.test.mjs`;
3. builds the production Vite bundle.

## Post-merge Cloudflare gate

After a merge to `march-3-reset-85393dd`, the workflow waits for `https://shotlab3.pages.dev` to expose the Team Store mount. It then downloads the production JavaScript assets and verifies the live bundle contains the coach and player Team Store markers, including the affiliate disclosure.

The probe retries for up to six minutes to allow Cloudflare Pages to finish its deployment. A failure means the production domain did not activate the merged Team Store release and should be investigated before additional commerce work ships.
