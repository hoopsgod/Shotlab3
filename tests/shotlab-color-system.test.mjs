import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../public/shotlab-color-system.css", import.meta.url), "utf8");
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

test("shared palette stays dark-first and meets core contrast targets", () => {
  assert.match(css, /--sl-canvas:\s*#07090c/i);
  assert.match(css, /--sl-surface-1:\s*#0d1217/i);
  assert.match(css, /--sl-surface-3:\s*#171e25/i);
  assert.match(css, /--sl-text-1:\s*#f4f7f8/i);
  assert.match(css, /--sl-text-2:\s*#b6c0c6/i);
  assert.match(css, /--sl-accent:\s*#c8ff1a/i);
  assert.ok(contrast("#f4f7f8", "#07090c") >= 7);
  assert.ok(contrast("#b6c0c6", "#0d1217") >= 4.5);
  assert.ok(contrast("#071007", "#c8ff1a") >= 7);
  assert.doesNotMatch(css, /background(?:-color)?:\s*(?:#fff|#ffffff|white)\b/i);
});

test("coach dashboard uses graphite depth and reserves saturated lime for decisions", () => {
  assert.match(css, /\.mcCourtLights span[\s\S]*rgba\(226, 234, 238, \.72\)/);
  assert.match(css, /\.mcFloor::before,[\s\S]*rgba\(174, 190, 200, \.27\)/);
  assert.match(css, /\.mcPulseStats strong[\s\S]*var\(--sl-text-1\)/);
  assert.match(css, /\.mcPulseStats div:first-child strong[\s\S]*var\(--sl-accent\)/);
  assert.match(css, /\.mcQuickGrid i,[\s\S]*#b8c2c8/);
  assert.match(css, /\.mcPrimary,[\s\S]*linear-gradient\(135deg, #dbff63, var\(--sl-accent\)\)/);
  assert.match(css, /\.mcRail nav button\.is-active[\s\S]*border-left-color: var\(--sl-accent\)/);
});

test("team identity remains visible without forced neon recoloring", () => {
  assert.match(css, /\.mcFloor img[\s\S]*filter: drop-shadow/);
  assert.match(css, /\.mcFloor img[\s\S]*opacity: \.76/);
  assert.doesNotMatch(css, /hue-rotate|sepia\(1\) saturate\(5\)/i);
  assert.doesNotMatch(css, /#team-store-root/);
});

test("player command center receives the same restrained hierarchy", () => {
  assert.match(css, /\[data-testid="player-daily-command-center"\][\s\S]*linear-gradient\(155deg/);
  assert.match(css, /\[data-testid="player-daily-primary-action"\][\s\S]*var\(--sl-accent\)/);
  assert.match(css, /\[data-testid="player-coach-priority-signal"\][\s\S]*#11171c/);
  assert.match(css, /\[class\*="taskButton"\][\s\S]*rgba\(200, 255, 26, \.045\)/);
  assert.match(css, /\[class\*="taskIndex"\][\s\S]*var\(--sl-surface-3\)/);
});

test("loading shell, accessibility, and app entry points remain intact", () => {
  assert.match(html, /<meta name="theme-color" content="#080B0E"/);
  assert.match(html, /href="\/shotlab-color-system\.css"/);
  assert.match(html, /id="team-store-root"/);
  assert.match(html, /src="\/src\/main\.jsx"/);
  assert.match(html, /src="\/src\/teamStoreEntry\.jsx"/);
  assert.match(css, /button:focus-visible[\s\S]*outline: 3px solid rgba\(200, 255, 26, \.28\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
