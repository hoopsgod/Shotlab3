import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingCss = fs.readFileSync(new URL("../src/screens/CoachTeamBrandingScreen.css", import.meta.url), "utf8");

test("final rendered-mobile authority keeps editorial titles strong without consuming the first viewport", () => {
  assert.match(finalMobileCss, /Compact editorial intro: strong title, quiet route mark, no first-viewport overflow/);
  assert.match(finalMobileCss, /\.secondaryPageIntro \{[\s\S]*min-height: 0 !important;[\s\S]*padding: 5px 0 11px !important/);
  assert.match(finalMobileCss, /font-size:\s*clamp\(32px, 8\.5vw, 34px\) !important/);
  assert.match(finalMobileCss, /\.secondaryPageIntro__icon \{[\s\S]*width: 38px !important;[\s\S]*opacity: \.17 !important/);
  assert.match(secondaryPageSystem, /data-mobile-stage="editorial"/);
});

test("final rendered-mobile authority cannot collapse dark performance contrast", () => {
  assert.match(finalMobileCss, /Dark performance surfaces keep their own contrast in the final rendered authority/);
  assert.match(finalMobileCss, /\.secondaryPageDecision h2 \{[\s\S]*color: #f5f7f4 !important/);
  assert.match(finalMobileCss, /\.secondaryPageDecision p \{[\s\S]*color: #b8c5c2 !important/);
  assert.match(finalMobileCss, /\.secondaryPageDecision__eyebrow \{[\s\S]*color: #c8ff1a !important/);
  assert.match(finalMobileCss, /\.secondaryPageDecision button \{[\s\S]*background: #c8ff1a !important;[\s\S]*color: #102019 !important/);
});

test("supported iPhone widths keep both actions inside a bounded two-column row", () => {
  assert.match(finalMobileCss, /\.secondaryPageIntro__actions \{[\s\S]*width: 100% !important;[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(finalMobileCss, /\.secondaryPageIntro__buttonRow \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(finalMobileCss, /\.secondaryPageAction \{[\s\S]*width: 100% !important;[\s\S]*min-height: 40px !important;[\s\S]*font-size: 11\.5px !important/);
  assert.doesNotMatch(finalMobileCss, /\.secondaryPageIntro__actions \{[\s\S]{0,180}width: calc\(100% \+ 64px\) !important/);
});

test("secondary Player routes cannot be pulled back into the legacy rounded identity card", () => {
  assert.match(finalMobileCss, /Final route framing wins over older Phase 3 card authorities/);
  assert.match(finalMobileCss, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\) \[data-testid="player-dashboard-identity-header"\] \{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important;[\s\S]*box-shadow: none !important/);
  assert.match(finalMobileCss, /player-dashboard-identity-header"\] > div \{[\s\S]*min-height: 50px !important/);
  assert.match(finalMobileCss, /player-dashboard-identity-header"\] img \{[\s\S]*width: 33px !important;[\s\S]*height: 33px !important/);
});

test("primary mobile decision moment reaches the viewport edge instead of floating as another card", () => {
  assert.match(enhancer, /Performance band: one edge-to-edge decisive moment, not a floating dashboard card/);
  assert.match(enhancer, /margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\)/);
  assert.match(enhancer, /border-radius: 0/);
  assert.match(enhancer, /background:\s*#c8ff1a/);
});

test("Program Branding keeps intentional dark identity contrast against later global surface authorities", () => {
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview\{[^}]*background:linear-gradient\(145deg,#0a2633,#102f39\)!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header\{[^}]*background:transparent!important[^}]*box-shadow:none!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header h2\{color:#f8faf6!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header p\{color:#c6d1cf!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__kicker\{color:#c8ff1a!important/);
});

test("Player Progress remains a purposeful command-story surface instead of gaining a redundant page title", () => {
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
  assert.doesNotMatch(progressStory, /data-visual-role="page-intro"/);
});
