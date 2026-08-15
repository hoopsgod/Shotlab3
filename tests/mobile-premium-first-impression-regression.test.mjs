import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");

test("final rendered-mobile authority preserves the compact Level B title scale", () => {
  assert.match(finalMobileCss, /\.secondaryPageIntro__title\s*\{[\s\S]*font-size:\s*clamp\(29px, 8vw, 34px\) !important/);
  assert.doesNotMatch(finalMobileCss, /\.secondaryPageIntro__title\s*\{[\s\S]{0,120}font-size:\s*36px !important/);
  assert.match(enhancer, /\.secondaryPageIntro \.secondaryPageIntro__title\.appHeaderTitle/);
});

test("supported iPhone widths keep both actions without stacking two full button rows", () => {
  assert.match(enhancer, /@media \(max-width: 430px\)/);
  assert.match(enhancer, /\.secondaryPageIntro__actions \{ display: grid; grid-template-columns: minmax\(0, 1fr\); align-items: center; gap: 6px; \}/);
  assert.match(enhancer, /\.secondaryPageIntro__buttonRow \{ width: 100%; display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(enhancer, /\.secondaryPageAction \{ width: 100%; min-width: 0; padding-inline: 10px; font-size: 11\.5px; \}/);
  assert.doesNotMatch(enhancer, /\.secondaryPageIntro__actions \{ align-items: stretch; flex-direction: column; \}/);
});

test("Player Progress remains a purposeful command-story surface instead of gaining a redundant page title", () => {
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
  assert.doesNotMatch(progressStory, /data-visual-role="page-intro"/);
});
