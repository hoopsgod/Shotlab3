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

test("native navigation makes player development primary and rankings secondary", () => {
  assert.match(navigationSource, /ROLE_PRIMARY_NAV/);
  assert.match(navigationSource, /\{ key: "home", label: "Home", icon: "home" \}/);
  assert.match(navigationSource, /\{ key: "log-drill", label: "Train", icon: "target" \}/);
  assert.match(navigationSource, /\{ key: "profile", label: "Progress", icon: "momentum" \}/);
  assert.doesNotMatch(navigationSource, /\{ key: "leaderboards", label: "Progress"/);
  assert.match(navigationSource, /mobileLabel: "Rankings"/);
  assert.match(navigationSource, /title: "Rankings"/);
  assert.match(navigationSource, /data-navigation-intent=\{role === "player" \? "development-first" : undefined\}/);
  assert.match(navigationSource, /Program work, schedule, rankings, and team tools\./);
  assert.match(navigationSource, /data-navigation-role=\{role\}/);
});

test("primary navigation icons communicate destination semantics", () => {
  assert.match(navigationSource, /player:\s*\[/);
  assert.match(navigationSource, /coach:\s*\[/);
  assert.match(navigationSource, /\{ key: "feed", label: "Home", icon: "home" \}/);
  assert.match(navigationSource, /\{ key: "players", label: "Players", icon: "team" \}/);
  assert.match(navigationSource, /\{ key: "events", label: "Schedule", icon: "calendar" \}/);
  assert.match(navigationSource, /data-icon-name=\{iconName\}/);
  assert.match(navigationSource, /data-icon-name="more"/);
  assert.doesNotMatch(navigationSource, /key === "log-drill" \? "home"/);
});

test("secondary player tools use stable semantic icons without overriding specialized lifting artwork", () => {
  assert.match(navigationSource, /item\.k === "leaderboards"[^\n]+mobileIcon: "chart"/);
  assert.match(navigationSource, /item\.k === "duels"[^\n]+mobileIcon: "program"/);
  assert.match(navigationSource, /item\.k === "program"[^\n]+mobileIcon: "calendar"/);
  assert.match(navigationSource, /item\.k === "team-store"[^\n]+mobileIcon: "store"/);
  assert.match(navigationSource, /item\.k === "sc"[^\n]+mobileLabel: "Lifting"/);
  assert.doesNotMatch(navigationSource, /item\.k === "sc"[^\n]+mobileIcon:/);
});

test("notification semantics are exposed to assistive technology", () => {
  assert.match(navigationSource, /item\.dot \? `\$\{label\}, updates available` : label/);
  assert.match(navigationSource, /secondaryHasNotification \? "More, updates available" : "More"/);
  assert.match(navigationSource, /aria-current=\{active \? "page" : undefined\}/);
});

test("secondary navigation is accessible, dismissible, and does not leave body scrolling behind", () => {
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-modal="true"/);
  assert.match(navigationSource, /event\.key === "Escape"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(navigationSource, /document\.body\.style\.overflow = previousOverflow/);
});

test("secondary tools are grouped without removing destinations", () => {
  assert.match(navigationSource, /export function groupSecondaryNavigation/);
  assert.match(navigationSource, /PLAYER_GROUP_DEFINITIONS/);
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
