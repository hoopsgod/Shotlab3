# Team Store production verification

The `Team Store Production Smoke` workflow is the final Phase 1 release gate.

For Team Store-related pull requests it runs the focused contract tests and production build. After a merge to `march-3-reset-85393dd`, it waits for Cloudflare Pages to expose the Team Store mount at `https://shotlab3.pages.dev`, downloads the deployed JavaScript assets, and verifies the live coach, player, and affiliate-disclosure markers.

A failed production probe means the merged Team Store code is not active on the public deployment and should be investigated before additional commerce work ships.
