import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const navigationSource = fs.readFileSync(new URL("../src/components/MobileNavigation.jsx", import.meta.url), "utf8");
const navigationCss = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");

test("mobile dock limits persistent navigation to three destinations plus More", () => {
  assert.match(navigationSource, /primaryItems\.filter\(Boolean\)\.slice\(0, 3\)/);
  assert.match(navigationSource, /data-testid="mobile-navigation-dock"/);
  assert.match(navigationSource, /data-testid="mobile-navigation-more"/);
  assert.match(navigationSource, />More</);
  assert.match(navigationCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});

test("secondary navigation is accessible, dismissible, and does not leave body scrolling behind", () => {
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-modal="true"/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(navigationSource, /aria-current=\{active \? "page" : undefined\}/);
});

test("player mobile navigation keeps frequent training actions direct and moves support areas into More", () => {
  assert.match(appSource, /import MobileNavigation from "\.\/components\/MobileNavigation\.jsx"/);
  assert.match(appSource, /const playerMobilePrimaryItems=\[[\s\S]*?"home"[\s\S]*?"log-drill"[\s\S]*?"duels"/);
  assert.match(appSource, /const playerMobileSecondaryItems=\[[\s\S]*?"program"[\s\S]*?"sc"[\s\S]*?k:"leaderboards"[\s\S]*?"profile"/);
  assert.match(appSource, /ariaLabel="Player navigation"/);
  assert.match(appSource, /leaderboards:"\/leaderboards"/);
  assert.match(appSource, /"\/leaderboards":"leaderboards"/);
});

test("coach mobile navigation keeps home, roster, and schedule direct while preserving all management areas", () => {
  assert.match(appSource, /const coachMobilePrimaryItems=\[[\s\S]*?"feed"[\s\S]*?"players"[\s\S]*?"events"/);
  assert.match(appSource, /const coachMobileSecondaryItems=\[[\s\S]*?"drills"[\s\S]*?"sc"[\s\S]*?k:"leaderboards"[\s\S]*?"team-store"[\s\S]*?"branding"/);
  assert.match(appSource, /ariaLabel="Coach navigation"/);
  assert.doesNotMatch(appSource, /!isDesktop&&<NavBar/);
});

test("compact dock reclaims mobile viewport space", () => {
  assert.match(navigationCss, /--bottom-nav-content-padding:\s*88px/);
  assert.match(appSource, /var\(--bottom-nav-content-padding, 88px\)/);
  assert.doesNotMatch(appSource, /--bottom-nav-content-padding, 132px/);
  assert.doesNotMatch(appSource, /--bottom-nav-content-padding, 156px/);
});
