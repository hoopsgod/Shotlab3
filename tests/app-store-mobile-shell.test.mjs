import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const indexSource = fs.readFileSync("index.html", "utf8");
const navigationSource = fs.readFileSync("src/components/MobileNavigation.jsx", "utf8");
const navigationCss = fs.readFileSync("src/components/MobileNavigation.module.css", "utf8");
const foundationCss = fs.readFileSync("public/shotlab-v3-foundation.css", "utf8");
const correctionsCss = fs.readFileSync("public/shotlab-v3-mobile-corrections.css", "utf8");

test("iPhone viewport and launch experience preserve accessibility", () => {
  assert.match(indexSource, /viewport-fit=cover/);
  assert.doesNotMatch(indexSource, /maximum-scale=1|user-scalable=no/);
  assert.match(indexSource, /apple-mobile-web-app-title" content="ShotLab"/);
  assert.match(indexSource, /name="color-scheme" content="light"/);
  assert.match(indexSource, /name="theme-color" content="#F5F5F2"/);
  assert.match(indexSource, /shotlab-v3-foundation\.css/);
  assert.match(indexSource, /shotlab-v3-mobile-corrections\.css/);
  assert.match(indexSource, /class="boot-wordmark"/);
  assert.match(indexSource, />Train with intent</);
  assert.doesNotMatch(indexSource, /titans-exact-logo/);
});

test("persistent navigation behaves as a floating native tab bar", () => {
  assert.match(navigationSource, /primaryItems\.filter\(Boolean\)\.slice\(0, 3\)/);
  assert.match(navigationSource, /buildNativeNavigationModel/);
  assert.match(navigationSource, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(navigationSource, /className=\{styles\.activeIndicator\}/);
  assert.match(navigationCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(navigationCss, /left:\s*50%/);
  assert.match(navigationCss, /transform:\s*translateX\(-50%\)/);
  assert.match(navigationCss, /border:\s*1px solid/);
  assert.match(navigationCss, /border-radius:\s*24px/);
  assert.match(navigationCss, /-apple-system, BlinkMacSystemFont/);
});

test("More navigation is a floating modal sheet with keyboard focus containment", () => {
  assert.match(navigationSource, /role="dialog"/);
  assert.match(navigationSource, /aria-modal="true"/);
  assert.match(navigationSource, /FOCUSABLE_SELECTOR/);
  assert.match(navigationSource, /event\.key !== "Tab"/);
  assert.match(navigationSource, /previousFocusRef/);
  assert.match(navigationSource, /document\.body\.dataset\.navigationSheetOpen/);
  assert.match(navigationCss, /border-radius:\s*28px/);
  assert.match(navigationCss, /env\(safe-area-inset-bottom/);
  assert.match(navigationCss, /backdrop-filter:\s*blur\(30px\) saturate\(145%\)/);
});

test("shared V3 mobile foundation supports touch, safe areas, contrast, and reduced motion", () => {
  assert.match(foundationCss, /color-scheme:light/);
  assert.match(foundationCss, /min-height:44px/);
  assert.match(foundationCss, /env\(safe-area-inset-bottom/);
  assert.match(foundationCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(correctionsCss, /max-height:\s*310px/);
});

test("mobile shell phase remains presentation-only", () => {
  const forbiddenRuntimeBehavior = /create table|alter table|XMLHttpRequest|fetch\s*\(|supabase\s*\.\s*from\s*\(|supabase\s*\.\s*rpc\s*\(|supabase\s*\.\s*auth\s*\.\s*(?:signIn|signUp|signOut|getSession|onAuthStateChange)\s*\(/i;
  for (const source of [navigationSource, navigationCss, foundationCss, correctionsCss, indexSource]) {
    assert.doesNotMatch(source, forbiddenRuntimeBehavior);
  }
});
