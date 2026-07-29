# ShotLab App Store Public URL Readiness

## Candidate production URLs

- Privacy Policy: `https://shotlab3.pages.dev/privacy`
- Terms of Use: `https://shotlab3.pages.dev/terms`
- Support: `https://shotlab3.pages.dev/support`
- Account Deletion: `https://shotlab3.pages.dev/delete-account`
- Data Request: `https://shotlab3.pages.dev/data-request`

These URLs are deployment candidates, not final App Store Connect metadata. Do not promote them until the live HTTPS browser verification passes against the deployed production origin.

## Deployment contract

Cloudflare Pages must ship:

- `public/_redirects` with the exact SPA fallback `/* /index.html 200`.
- `public/_headers` with conservative browser security headers and immutable caching for hashed assets.
- Direct unauthenticated rendering of every candidate route.

The build validator writes `artifacts/app-store/public-url-readiness.json` so each release has a machine-readable readiness report.

## Owner gates

The in-app support address is `support@shotlab.app`. Ownership and deliverability are not verified by source control and must be confirmed by the owner before App Store submission.

## Verification sequence

1. Run the pull-request App Store Public URL Readiness workflow.
2. Merge only after the build, route contracts, and local mobile browser tests pass.
3. After Cloudflare deploys production, manually dispatch the workflow with `https://shotlab3.pages.dev`.
4. Confirm every direct route returns under HTTPS and shows the expected heading without authentication.
5. Confirm `support@shotlab.app` can receive and reply to support messages.
6. Only then copy the candidate URLs into App Store Connect.
