# ShotLab (Vite + React)

## Local development quick start

1. Install dependencies:
   - `npm install`
2. Create a `.env` file in the project root with:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
3. Start the app:
   - `npm run dev`

> `.env` is intentionally gitignored, so each environment (local machine, CI, Cloudflare Pages) must provide these values.

## If the app won't load

- Confirm Vite starts without errors: `npm run dev`.
- Open browser devtools and check for runtime errors related to missing Supabase config.
- Verify both required variables are present and non-empty:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- For Cloudflare Pages, set these as project environment variables before building/deploying.

## Cloudflare Pages build settings

- **Framework preset:** `Vite` (optional)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

These settings match the current Vite config (`build.outDir = "dist"`) and package scripts.
