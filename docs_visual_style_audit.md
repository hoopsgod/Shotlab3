# Visual System Audit (Read-first pass)

## Shared style entry points

- **Theme token construction** is centralized in `src/theme/buildThemeTokens.js`, which maps team branding into semantic color slots and CSS custom properties (`--accent`, `--team-brand-*`, `--page-accent`, `--nav-active-text`).
- **Branding defaults and resolution** live in `src/theme/brandingDefaults.js` and `src/theme/resolveTeamBranding.js` (including legacy color key mapping and logo URL cache-busting).
- **Theme variable application** to the document root is handled by `src/theme/applyThemeVariables.js`.
- **Theme context/provider** entry point is `src/context/TeamBrandingContext.jsx`, where resolved branding is converted to theme tokens and applied globally.
- **Large global visual layer** (including button classes, surface/card selectors, headers, and nav styles) is embedded in `src/App.jsx` as string CSS blocks (`_GLOBAL_CSS`, `_PAGE_SIGNATURE_CSS`) and inline style objects.

## Location map by UI area

1. **Theme/color tokens currently live**
   - `src/theme/buildThemeTokens.js`
   - `src/theme/brandingDefaults.js`
   - `src/context/TeamBrandingContext.jsx`
   - `src/App.jsx` local constants (`TOKENS`, `PAGE_ACCENTS`, `MODE_CARD_TOKENS`)

2. **Team branding colors are resolved**
   - `src/theme/resolveTeamBranding.js` (`primaryColor`, `secondaryColor`, `accentColor`, legacy fallback keys)

3. **Logo rendering is controlled**
   - Main app branding mark/wordmark rendering in `src/App.jsx` (`TeamWordmark` function)
   - Admin/preview rendering in `src/components/team/TeamBrandingPreview.jsx`
   - Form preview rendering in `src/components/team/TeamBrandingForm.jsx`

4. **Button variants/styles are defined**
   - Primary global button rules in CSS string in `src/App.jsx` (e.g. `.btn-v`, `.cta-primary`, `.cta-secondary`, nav tab buttons)
   - Screen-specific inline button styles in `src/screens/PlayersScreen.jsx`, `src/components/team/TeamBrandingForm.jsx`, `src/screens/CoachTeamBrandingScreen.jsx`

5. **Card/surface styles are defined**
   - Root surface tokens and broad card selectors in CSS string inside `src/App.jsx` (`:root --surface-*`, `--stroke-*`, class pattern selectors for card/panel/tile/widget)
   - Additional card-like inline styles spread across screen/component files

6. **Headers are defined**
   - Reusable components: `src/components/PageHeader.jsx`, `src/components/AppHeader.jsx`, `src/components/CoachMiniHeader.jsx`
   - Additional header classes and accents in CSS strings in `src/App.jsx` (`.pageHeader*`, `.coachEvents*`, `.topbar`)

7. **Bottom navigation active/inactive states are defined**
   - Nav component logic and inline styles in `src/App.jsx` (`BottomNav` function)
   - Active/inactive visual rules in embedded CSS string in `src/App.jsx` (`.bottom-nav .tab...` selectors)

8. **Red/orange/lime/gray hardcoded or inconsistent accents**
   - `src/App.jsx` includes hardcoded lime/orange/cyan/gray in multiple places (`#C8FF00`, `#FFC400`, `#A0A0A0`, `rgba(255,196,0,...)`, etc.)
   - `ORANGE` alias currently points to `TOKENS.PRIMARY` in `src/App.jsx`, which creates semantic drift.
   - Team branding views use fixed success/error colors (`#9DFF7A`, `#FF8E8E`) in `src/screens/CoachTeamBrandingScreen.jsx` and `src/components/team/TeamBrandingForm.jsx`.

## Major inconsistency themes

- **Dual system split**: there is a newer theme token pipeline (`src/theme/*`) and a large legacy-ish inline token/CSS system in `src/App.jsx`.
- **Mixed semantic + hardcoded colors**: many components consume CSS vars while adjacent sections still hardcode lime/orange/gray.
- **Style ownership fragmentation**: headers/buttons/cards/nav are partly reusable components and partly `App.jsx`-embedded CSS + inline styles.

## Safest next layer to fix first

1. **Consolidate accent derivatives** (`accent soft/bg/border`) in `buildThemeTokens.js` and consume them via CSS variables everywhere `rgba(200,255,26,...)` is hardcoded.
2. **Extract shared button and card primitives** from `App.jsx` CSS strings into a dedicated shared styles module/file, without changing behavior.
3. **Normalize header/nav color usage** so active/brand accents read from one semantic token path (`--team-brand-*` + component-level aliases).
