import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../public/shotlab-v3-foundation.css", import.meta.url), "utf8");
const corrections = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const channel = (hex) => {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const normalized = hex.replace("#", "");
  const [r, g, b] = [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 6)].map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
};

test("V3 palette stays light, restrained, and meets core contrast targets", () => {
  assert.match(css, /--v3-canvas:#f5f5f2/i);
  assert.match(css, /--v3-surface:#ffffff/i);
  assert.match(css, /--v3-ink:#171a18/i);
  assert.match(css, /--v3-muted:#68706a/i);
  assert.match(css, /--v3-accent:#78951f/i);
  assert.ok(contrast("#171a18", "#ffffff") >= 7);
  assert.ok(contrast("#68706a", "#ffffff") >= 4.5);
  assert.ok(contrast("#171a18", "#f5f5f2") >= 7);
  assert.doesNotMatch(css, /hue-rotate|sepia\(1\) saturate\(5\)/i);
});

test("Mission Control uses one readable light hierarchy", () => {
  assert.match(css, /mission-control-active[\s\S]*background:var\(--v3-canvas\)/);
  assert.match(css, /\.mcHero[\s\S]*background:var\(--v3-surface\)/);
  assert.match(css, /\.mcHero h1[\s\S]*color:var\(--v3-ink\)/);
  assert.match(css, /\.mcHeroContent>p[\s\S]*color:var\(--v3-muted\)/);
  assert.match(css, /\.mcPrimary[\s\S]*background:var\(--v3-ink\)/);
  assert.match(corrections, /coach-primary-objective/);
  assert.match(corrections, /max-height:\s*310px/);
});

test("secondary coach pages and Team Store share the same product language", () => {
  assert.match(css, /\.secondaryPageShell[\s\S]*background:transparent/);
  assert.match(css, /\.secondaryPageIntro[\s\S]*background-image:none/);
  assert.match(css, /\.ts-panel[\s\S]*background:var\(--v3-canvas\)/);
  assert.match(css, /\.ts-header h2[\s\S]*font-family:inherit/);
  assert.match(css, /\.ts-field input,[\s\S]*font-size:16px/);
});

test("loading shell, accessibility, and V3 entry points remain intact", () => {
  assert.match(html, /<meta name="theme-color" content="#F5F5F2"/);
  assert.match(html, /name="color-scheme" content="light"/);
  assert.match(html, /href="\/shotlab-v3-foundation\.css"/);
  assert.match(html, /href="\/shotlab-v3-mobile-corrections\.css"/);
  assert.match(html, /id="team-store-root"/);
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(html, /src="\/src\/teamStoreEntry\.jsx"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
