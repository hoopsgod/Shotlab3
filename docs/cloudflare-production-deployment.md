# Cloudflare production deployment

ShotLab production is deployed through **Cloudflare Pages**.

## Production target

- Production build command: `npm run build`
- Production output directory: `dist`
- Repo deploy script: `npm run deploy:cloudflare`
- The deploy script runs `wrangler pages deploy dist --project-name shotlab3`.
- The `functions/` directory is Cloudflare **Pages Functions** and deploys with the Pages project.

## Standalone Workers are not part of production

This repository does **not** define a standalone Cloudflare Workers entrypoint and intentionally does not include a `wrangler.toml` Worker config. A failing standalone Workers deployment/status check is therefore stale PR noise for ShotLab production unless Cloudflare/GitHub has been externally configured to route production traffic through a Worker that is not represented in this repository.

## Required cleanup for stale Workers checks

If a PR shows Cloudflare Pages succeeding but a standalone Cloudflare Workers deployment failing:

1. Treat the Pages deployment as the production source of truth for this repo.
2. In Cloudflare, disconnect or disable the stale standalone Workers deployment integration for this repository.
3. In GitHub branch protection, remove the stale Workers status check from required checks, or reconnect that required check to the Cloudflare Pages project.
4. Do not block ShotLab production review on a Workers-only failure unless a current production route explicitly depends on an external Worker.

## What must remain enabled

Keep Cloudflare Pages preview/production deployments enabled for the `shotlab3` Pages project. Do not remove Pages Functions: the `functions/` routes are part of the Pages deployment.
