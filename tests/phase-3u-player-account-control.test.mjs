import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const navSource = fs.readFileSync(new URL("../src/components/MobileNavigation.jsx", import.meta.url), "utf8");
const navCss = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const productionAcceptanceSource = fs.readFileSync(new URL("./e2e/production-acceptance.spec.mjs", import.meta.url), "utf8");

test("mobile player account actions are consolidated into More", () => {
  assert.match(appSource, /\{isDesktop&&<div className="player-quick-actions"/);
  assert.match(appSource, /<MobileNavigation primaryItems=\{playerMobilePrimaryItems\}[^>]+onLogout=\{logout\}[^>]+ariaLabel="Player navigation"/);
  assert.match(navSource, /onLogout, ariaLabel = "Mobile navigation"/);
  assert.match(navSource, /role === "player" && onLogout/);
  assert.match(navSource, /data-testid="mobile-navigation-account-actions"/);
  assert.match(navSource, /data-testid="mobile-navigation-sign-out"/);
  assert.match(navSource, /<ShotLabIcon name="logout"/);
  assert.match(navSource, />Sign out</);
  assert.match(navSource, /Leave this ShotLab session/);
});

test("player home removes the orphaned mobile utility band", () => {
  assert.match(appSource, /padding:isDesktop\?"14px 20px 36px":"8px 20px var\(--player-scroll-bottom-padding\)"/);
  assert.doesNotMatch(appSource, /\n<div className="player-quick-actions" aria-label="Player quick actions"/);
  assert.match(navCss, /\.sheetUtility\s*\{/);
  assert.match(navCss, /\.signOutButton\s*\{/);
  assert.match(navCss, /min-height:\s*58px/);
});

test("production acceptance follows the current More to Sign out path without weakening cleanup", () => {
  assert.match(productionAcceptanceSource, /getByTestId\("mobile-navigation-more"\)\.click\(\)/);
  assert.match(productionAcceptanceSource, /getByTestId\("mobile-navigation-sign-out"\)\.click\(\)/);
  assert.doesNotMatch(productionAcceptanceSource, /getByRole\("button", \{ name: \/\^logout\$\/i \}\)\.click\(\)/);
  assert.match(productionAcceptanceSource, /countDemoPlayerShotRows\(page, 33\)\)\.toBe\(0\)/);
});

test("Phase 3U runs after legacy route enhancers in both dev and production builds", () => {
  const pkg = JSON.parse(packageSource);
  for (const scriptName of ["dev", "prepare:route-enhancers"]) {
    const script = pkg.scripts[scriptName];
    assert.match(script, /apply-expert-app-review-v2\.mjs && node scripts\/apply-phase3u-player-account-control\.mjs && node scripts\/apply-phase3u-production-acceptance-path\.mjs && node scripts\/minify-visual-authority-css\.mjs/);
  }
});
