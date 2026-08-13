import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const secondaryJsx = read("../src/components/SecondaryPageSystem.jsx");
const secondaryCss = read("../src/components/SecondaryPageSystem.css");
const primitives = read("../src/components/CoachDashboardPrimitives.jsx");
const surfaceCss = read("../src/styles/Phase3SurfaceContracts.css");
const parityCss = read("../public/shotlab-v8-demo-parity.css");
const industrial = read("../src/lib/industrialDesignFoundation.js");
const main = read("../src/main.jsx");

const rgb = (hex) => {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
};

const luminance = (hex) => rgb(hex)
  .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

test("secondary page materials are explicit instead of inferred from names", () => {
  assert.match(secondaryJsx, /data-visual-role="secondary-page"[^>]*data-surface="light"|data-surface="light"[^>]*data-visual-role="secondary-page"/);
  assert.match(secondaryJsx, /data-visual-role="page-intro"/);
  assert.match(secondaryJsx, /data-surface="dark" data-visual-role="primary-decision"/);
  assert.match(secondaryJsx, /data-surface="light" data-visual-role="supporting-evidence"/);
});

test("shared dashboard primitives publish stable semantic roles", () => {
  for (const role of ["metric-strip", "filter-rail", "insight-card", "insight-actions", "dashboard-section", "detail-drawer"]) {
    assert.match(primitives, new RegExp(`data-visual-role="${role}"`));
  }
  assert.match(primitives, /data-action-role="tertiary"/);
});

test("active visual authorities contain no substring-selector material heuristics", () => {
  for (const authority of [secondaryCss, surfaceCss, parityCss, industrial]) {
    assert.doesNotMatch(authority, /\[class\s*\*=/i);
    assert.doesNotMatch(authority, /\[data-testid\s*\*=/i);
  }
  assert.match(secondaryCss, /\[data-visual-role="metric-strip"\]/);
  assert.match(secondaryCss, /\[data-visual-role="filter-rail"\]/);
  assert.match(secondaryCss, /\[data-visual-role="insight-actions"\]/);
  assert.match(industrial, /\[data-surface="light"\]/);
});

test("light and dark semantic foreground tokens clear WCAG normal-text contrast", () => {
  const lightCanvas = "#f5f5f2";
  const darkCanvas = "#171b18";
  for (const foreground of ["#171a18", "#3f4842", "#68706a"]) {
    assert.ok(contrast(foreground, lightCanvas) >= 4.5, `${foreground} must remain readable on the light canvas`);
  }
  for (const foreground of ["#f5f7f4", "#d7ddd8", "#aeb7b0"]) {
    assert.ok(contrast(foreground, darkCanvas) >= 4.5, `${foreground} must remain readable on the dark decision surface`);
  }
});

test("semantic foreground authority protects both known contrast regressions", () => {
  assert.match(surfaceCss, /\[data-surface="light"\][\s\S]*--surface-title:\s*var\(--sl-surface-light-title\)/);
  assert.match(surfaceCss, /\[data-surface="dark"\][\s\S]*--surface-title:\s*var\(--sl-surface-dark-title\)/);
  assert.match(surfaceCss, /\[data-surface="light"\]\[data-visual-role="page-intro"\][\s\S]*-webkit-text-fill-color:\s*currentColor/);
  assert.match(surfaceCss, /\[data-surface="dark"\]\[data-visual-role="primary-decision"\][\s\S]*-webkit-text-fill-color:\s*currentColor/);
});

test("Phase 3 mobile contract protects 390px geometry, touch targets and iPhone safe areas", () => {
  assert.match(surfaceCss, /--sl-phase3-touch-target:\s*44px/);
  assert.match(surfaceCss, /padding-bottom:\s*calc\(96px \+ env\(safe-area-inset-bottom,\s*0px\)\)/);
  assert.match(surfaceCss, /@media \(max-width:\s*430px\)/);
  assert.match(surfaceCss, /safe-area-inset-left/);
  assert.match(surfaceCss, /safe-area-inset-right/);
  assert.match(secondaryCss, /@media \(max-width:\s*390px\)/);
  assert.match(surfaceCss, /overflow-wrap:\s*anywhere/);
});

test("surface contract is role-neutral for Coach, Player, demo and registered sessions", () => {
  assert.doesNotMatch(surfaceCss, /\.shotlab-demo|\[data-demo/i);
  assert.doesNotMatch(surfaceCss, /\.coach[A-Z_-]|\.player[A-Z_-]/);
  assert.match(surfaceCss, /\[data-visual-role="secondary-page"\]/);
  assert.doesNotMatch(parityCss, /\.shotlab-demo/);
});

test("semantic surface contract loads after the previous cascade lock", () => {
  const cascadeLock = main.indexOf("MissionControlCascadeLock2026.css");
  const phase3 = main.indexOf("Phase3SurfaceContracts.css");
  assert.ok(cascadeLock >= 0, "existing cascade lock import must remain present");
  assert.ok(phase3 > cascadeLock, "Phase 3 semantic contract must load after the previous visual authority");
});
