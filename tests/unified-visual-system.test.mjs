import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("public/shotlab-v16-unified-visual-system.css", "utf8");
const authority = readFileSync("public/shotlab-v15-session-integrity.css", "utf8");

test("unified visual system is loaded by the final presentation authority", () => {
  assert.match(authority, /shotlab-v16-unified-visual-system\.css/);
});

test("coach and player pages share the same canvas, spacing, and card contracts", () => {
  assert.match(css, /\[data-role="coach"\] \.page/);
  assert.match(css, /\[data-role="player"\] \.page/);
  assert.match(css, /--sl-radius-card/);
  assert.match(css, /--sl-card-pad/);
  assert.match(css, /--sl-page-gap/);
});

test("shared primitives cover cards, metrics, filters, buttons, progress, and empty states", () => {
  for (const contract of [
    "_insightCard_",
    "_metricStrip_",
    "_filterRail_",
    "_primaryAction_",
    "_progressTrack_",
    "_emptyState_",
  ]) assert.ok(css.includes(contract), `missing shared ${contract} contract`);
});

test("dark operational cards explicitly preserve readable text contrast", () => {
  assert.match(css, /--sl-dark-ink:#f7f8f5/);
  assert.match(css, /--sl-dark-muted:#b8c0ba/);
  assert.match(css, /-webkit-text-fill-color:var\(--sl-dark-ink\)/);
});
