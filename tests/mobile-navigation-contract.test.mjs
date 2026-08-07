import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const legacyStylesSource = fs.readFileSync(new URL("../src/styles/appLegacyStyles.js", import.meta.url), "utf8");
const navigationSource = fs.readFileSync(new URL("../src/components/MobileNavigation.jsx", import.meta.url), "utf8");
const navigationCss = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const architectureCss = fs.readFileSync(new URL("../src/components/MobileNavigationArchitecture.css", import.meta.url), "utf8");

test("mobile dock limits persistent navigation to three destinations plus More", () => {
  assert.match(navigationSource, /primaryItems\.filter\(Boolean\)\.slice\(0, 3\)/);
  assert.match(navigationSource, /data-testid="mobile-navigation-dock"/);
  assert.match(navigationSource, /data-testid="mobile-navigation-more"/);
  assert.match(navigationSource, />More</);
  assert.match(navigationCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});

test("native navigation exposes the agreed role-specific destinations", () => {
  assert.match(navigationSource, /role === "player" \? \["home", "log-drill", "leaderboards"\]/);
  assert.match(navigationSource, /role === "coach" \? \["feed", "players", "events"\]/);
  assert.match(navigationSource, /role === "player" \? \["Home", "Train", "Progress"\]/);
  assert.match(navigationSource, /\["Home", "Players", "Schedule"\]/);
  assert.match(navigationSource, /data-navigation-role=\{role\}/);
  assert.match(navigationSource, /role\[0\]\.toUpperCase\(\) \+ role\.slice\(1\)/);
});

test("secondary navigation is accessible, dismissible, and does not leave body scrolling behind", () => {
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-modal="true"/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(navigationSource, /aria-current=\{active \? "page" : undefined\}/);
});

test("secondary tools are grouped without removing destinations", () => {
  assert.match(navigationSource, /export function groupSecondaryNavigation/);
  assert.match(navigationSource, /id: "program"/);
  assert.match(navigationSource, /id: "performance"/);
  assert.match(navigationSource, /id: "team"/);
  assert.match(navigationSource, /"attendance", "duels"/);
  assert.match(navigationSource, /data-navigation-group=\{group\.id\}/);
  assert.match(navigationSource, /group\.items\.map/);
  assert.match(navigationSource, /Everything else, organized/);
  assert.doesNotMatch(navigationSource, /secondaryItems[^\n]*slice\(/);
});

test("floating navigation uses restrained glass and large touch targets", () => {
  assert.match(navigationSource, /MobileNavigationArchitecture\.css/);
  assert.match(architectureCss, /background:\s*rgba\(252, 252, 250/);
  assert.match(architectureCss, /background:\s*#f8f7f3/);
  assert.match(navigationCss, /left:\s*50%/);
  assert.match(navigationCss, /bottom:\s*max\(10px, env\(safe-area-inset-bottom/);
  assert.match(navigationCss, /border-radius:\s*24px/);
  assert.match(navigationCss, /backdrop-filter:\s*blur\(28px\) saturate\(150%\)/);
  assert.match(navigationCss, /min-height:\s*54px/);
  assert.match(navigationCss, /min-height:\s*66px/);
  assert.match(architectureCss, /prefers-reduced-transparency/);
});

test("App keeps every player and coach destination available to navigation", () => {
  assert.match(appSource, /import MobileNavigation from "\.\/components\/MobileNavigation\.jsx"/);
  assert.match(appSource, /const playerMobilePrimaryItems=/);
  assert.match(appSource, /const playerMobileSecondaryItems=/);
  assert.match(appSource, /k:"leaderboards"/);
  assert.match(appSource, /ariaLabel="Player navigation"/);
  assert.match(appSource, /leaderboards:"\/leaderboards"/);
  assert.match(appSource, /"\/leaderboards":"leaderboards"/);
  assert.match(appSource, /const coachMobilePrimaryItems=/);
  assert.match(appSource, /const coachMobileSecondaryItems=/);
  assert.match(appSource, /ariaLabel="Coach navigation"/);
  assert.doesNotMatch(appSource, /!isDesktop&&<NavBar/);
});

test("floating dock reserves enough mobile viewport space", () => {
  assert.match(navigationCss, /--bottom-nav-content-padding:\s*104px/);
  assert.match(legacyStylesSource, /var\(--bottom-nav-content-padding, 88px\)/);
  assert.doesNotMatch(legacyStylesSource, /--bottom-nav-content-padding, 132px/);
  assert.doesNotMatch(legacyStylesSource, /--bottom-nav-content-padding, 156px/);
});
