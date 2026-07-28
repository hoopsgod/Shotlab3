# ShotLab Public App Store URL Readiness

## Status

The application contains public Privacy, Terms, Support, Account Deletion, and Data Request routes. This package makes their Cloudflare Pages delivery explicit and verifies direct navigation against a production build locally.

The candidate production URLs are not marked live-verified until the deployed HTTPS pages pass the manual browser lane and the support mailbox is owner-verified.

## Candidate URLs

- Privacy Policy: `https://shotlab3.pages.dev/privacy`
- Terms of Use: `https://shotlab3.pages.dev/terms`
- Support: `https://shotlab3.pages.dev/support`
- Account Deletion: `https://shotlab3.pages.dev/delete-account`
- Data Request: `https://shotlab3.pages.dev/data-request`

The machine-readable source is `native/app-store-public-urls.json`.

## Deployment contract

`public/_redirects` contains:

```text
/* /index.html 200
```

Vite copies this file into `dist/_redirects`. Cloudflare Pages then serves the application shell for direct navigation to legal and support paths while preserving the requested browser URL.

`public/_headers` adds conservative response headers:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- a restrictive Permissions Policy for unused camera, microphone, location, payment, and USB capabilities
- `Cross-Origin-Opener-Policy: same-origin`
- immutable caching for hashed assets

No permissive cross-origin wildcard or arbitrary redirect is added.

## Local verification

The read-only PR gate:

1. validates the candidate URL inventory;
2. runs the existing legal-route source regression;
3. builds the production application;
4. confirms `_redirects` and `_headers` are copied into `dist`;
5. opens every route directly in Chromium;
6. confirms each expected heading and content proof is visible;
7. confirms the route does not require authentication or expose the app navigation shell.

## Live verification

The workflow also supports a manual HTTPS browser lane. Run it with:

```bash
SHOTLAB_PUBLIC_BASE_URL=https://shotlab3.pages.dev \
  npx playwright test --config=playwright.public-live.config.mjs
```

A live pass means the deployed route returns successfully and renders the expected public page in a real browser. It does not by itself verify ownership or deliverability of `support@shotlab.app`.

## Promotion rule

Do not enter the candidate URLs in App Store Connect until:

1. the production deployment containing the routing files is complete;
2. the live Chromium lane passes against the production origin;
3. each page is reviewed on mobile without authentication;
4. the Privacy and Terms copy matches the submitted build;
5. the Support page presents an owner-controlled, monitored contact path;
6. `support@shotlab.app` ownership and deliverability are confirmed or the page is updated to a verified alternative.

## Owner-dependent items still pending

- Support mailbox ownership
- Support mailbox deliverability
- Final legal review of Privacy and Terms copy
- Final App Store Connect entry of verified URLs
