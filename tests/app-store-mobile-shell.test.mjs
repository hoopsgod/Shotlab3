import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const indexSource = fs.readFileSync("index.html", "utf8");
const navigationSource = fs.readFileSync("src/components/MobileNavigation.jsx", "utf8");
const navigationCss = fs.readFileSync("src/components/MobileNavigation.module.css", "utf8");
const appStoreCss = fs.readFileSync("src/styles/AppStoreExperience.css", "utf8");

test("iPhone viewport and launch experience preserve accessibility", () => {
  assert.match(indexSource, /viewport-fit=cover/);
  assert.doesNotMatch(indexSource, /maximum-scale=1|user-scalable=no/);
  assert.match(indexSource, /apple-mobile-web-app-title" content="ShotLab"/);
  assert.match(indexSource, /name="color-scheme" content="dark"/);
  assert.match(indexSource, /AppStoreExperience\.css/);
  assert.match(indexSource, /class="boot-wordmark"/);
  assert.match(indexSource, />Train with intent</);
  assert.doesNotMatch(indexSource, /titans-exact-logo/);
});

test("persistent navigation behaves as a native tab bar", () => {
  assert.match(navigationSource, /primaryItems\.filter\(Boolean\)\.slice\(0, 3\)/);
  assert.match(navigationSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(navigationSource, /className=\{styles\.activeIndicator\}/);
  assert.match(navigationCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(navigationCss, /border-top:\s*1px solid/);
  assert.match(navigationCss, /-apple-system, BlinkMacSystemFont/);
  assert.doesNotMatch(navigationCss, /border-radius:\s*20px;\s*background:\s*rgba\(15, 18, 24/);
});

test("More navigation is a modal bottom sheet with keyboard focus containment", () => {
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-modal="true"/);
  assert.match(navigationSource, /FOCUSABLE_SELECTOR/);
  assert.match(navigationSource, /event\.key !== "Tab"/);
  assert.match(navigationSource, /previousFocusRef/);
  assert.match(navigationSource, /document\.body\.dataset\.navigationSheetOpen/);
  assert.match(navigationCss, /border-radius:\s*26px 26px 0 0/);
  assert.match(navigationCss, /env\(safe-area-inset-bottom/);
});

test("shared mobile foundation supports touch, safe areas, contrast, and reduced preferences", () => {
  assert.match(appStoreCss, /--app-safe-top:\s*env\(safe-area-inset-top/);
  assert.match(appStoreCss, /--app-touch-target:\s*44px/);
  assert.match(appStoreCss, /-webkit-text-size-adjust:\s*100%/);
  assert.match(appStoreCss, /font-size:\s*max\(16px, 1rem\)/);
  assert.match(appStoreCss, /prefers-contrast:\s*more/);
  assert.match(appStoreCss, /prefers-reduced-transparency:\s*reduce/);
  assert.match(appStoreCss, /prefers-reduced-motion:\s*reduce/);
});

test("mobile shell phase remains presentation-only", () => {
  for (const source of [navigationSource, navigationCss, appStoreCss, indexSource]) {
    assert.doesNotMatch(source, /supabase|auth\.|create table|alter table|XMLHttpRequest|fetch\(/i);
  }
});
