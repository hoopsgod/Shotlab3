# ShotLab (Vite + React)

## Local development quick start

1. Install dependencies:
   - `npm install`
2. (Optional but recommended) run the diagnostics checker:
   - `npm run doctor`
3. Create a `.env` file in the project root with:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
4. Start the app:
   - `npm run dev` (works for local and container/remote workspaces)
5. Open the URL printed by Vite (usually `http://localhost:4173/`).

> `.env` is intentionally gitignored, so each environment (local machine, CI, Cloudflare Pages) must provide these values.


## Supabase setup readiness (demo-safe)

ShotLab currently supports **dual runtime**:
- **Demo/local mode fallback** (no backend required)
- **Supabase-connected mode** (env vars present)

### Required environment variables
Add these in the repo root `.env` file for local dev:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Example:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

### Local development behavior
- If both vars are present, ShotLab enables backend requests.
- If either var is missing, ShotLab **automatically stays in demo mode** and still boots.
- No login wall is forced in this phase.

### Cloudflare Pages environment setup
In Cloudflare Pages project settings:
1. Go to **Settings → Environment variables**.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for:
   - **Preview** environment
   - **Production** environment
3. Redeploy after saving.

If vars are missing in Cloudflare Preview, the site still loads in demo-safe mode.

### Backend health check and fallback states
A lightweight runtime health utility reports one of:
- `demo_mode_active` (env vars missing)
- `supabase_configured` (env vars present and probe succeeds)
- `supabase_unavailable` (env vars present but backend request fails)

In all three states, the app remains boot-safe and does not crash startup.

### Developer-only backend status logging
In development builds, ShotLab logs backend status to the browser console as:
- `[ShotLab backend] { status, ok, detail }`

This is diagnostic-only and avoids showing raw technical errors to normal users.

## Why the app may appear to “not open”

Most startup issues in this project come from one of these:

1. **Port or URL mismatch**
   - The dev server now binds to `0.0.0.0:4173` by default.
   - If 4173 is taken, Vite will choose the next port. Always open the exact URL printed in terminal.
2. **Opening the wrong URL**
   - In remote workspaces, the forwarded URL may differ from what you expect. Use the exact URL Vite prints.
3. **Missing dependencies**
   - `node_modules` not installed or corrupted.
4. **Supabase env vars missing**
   - The UI can still load, but backend calls will fail and can make the app look broken.

Use `npm run doctor` to check all of the above quickly.

## Run/fix plan (recommended order)

1. `npm install`
2. `npm run doctor`
3. `npm run dev`
4. Open the exact URL printed by Vite
5. If still failing:
   - run `npm run build` (compile-time check)
   - run `npm test` (behavioral check)
   - inspect browser console for runtime errors

## If the app won't load

- Confirm Vite starts without errors: `npm run dev` and use the exact URL shown in terminal output.
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

> Deployment provider note: Cloudflare Pages is the only supported deployment target for this repo; legacy Vercel status checks should be removed/disabled to avoid PR check noise.
