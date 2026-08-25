# ShotLab Viewport Debugging

ShotLab's viewport debugger is the fast preflight for mobile layout, horizontal overflow, scroll ownership, and fixed-overlay reachability. Run it before broad CI when a PR changes authenticated UI, mobile CSS, navigation, title stages, overlays, or shared page geometry.

## One-time local setup

The repository's CI intentionally installs a pinned Playwright runner without adding it to application dependencies. Match CI locally:

```bash
npm install --no-save --package-lock=false @playwright/test@1.55.1
npx playwright install chromium
```

## Fast preflight

```bash
npm run debug:viewport
```

Default coverage:

- Coach Demo and Player Demo
- 320, 375, 390, and 430px widths
- Home shell and mobile navigation sheet
- document/body horizontal overflow
- authenticated shell and role-scroll ownership
- visible elements escaping the visual viewport
- fixed/sticky controls outside the viewport
- `window.scrollX`, document `scrollLeft`, and `visualViewport.offsetLeft`

Each case writes structured JSON to `artifacts/viewport-debug/` and prints a compact diagnosis to the terminal. On failure, the report includes the first offender's ancestor overflow/position chain.

## Targeted runs

Use a narrower run while iterating:

```bash
npm run debug:viewport -- --role=coach --widths=390
npm run debug:viewport -- --role=player --widths=320,430
```

To reproduce Coach priority-editor reachability and identify clipping ancestors:

```bash
npm run debug:viewport -- --role=coach --widths=390 --scenario=priority
```

The priority scenario opens **Set Team Focus**, scrolls **SAVE PRIORITIES** toward the visual viewport, and fails if the control remains unreachable.

## Exact Cloudflare preview

The debugger can inspect an already deployed exact-head preview instead of starting local Vite:

```bash
npm run debug:viewport -- --base-url=https://<exact-sha>.shotlab3.pages.dev
```

PowerShell:

```powershell
npm run debug:viewport -- --base-url=https://<exact-sha>.shotlab3.pages.dev --role=coach --widths=390
```

## Recommended ShotLab certification order

1. `npm run debug:viewport -- --role=<affected-role> --widths=<affected-widths>`
2. targeted failing E2E or contract
3. `npm run lint:ratchet` / `npm run lint` when present
4. `npm run build`
5. broad CI
6. exact-final-SHA Cloudflare visual certification

Do not weaken a viewport diagnostic simply to make it green. Classify each failure as product regression, stale contract, selector drift, intentional baseline evolution, or infrastructure noise, then repair the narrowest owning layer.
