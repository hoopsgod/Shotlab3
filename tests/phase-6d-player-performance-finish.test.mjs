import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 6D turns Progress support signals into editorial evidence instead of equal cards", async () => {
  const css = await read("src/components/PlayerProgressStory.module.css");
  const progress = await read("src/components/PlayerProgressStory.jsx");

  assert.match(progress, /data-testid="player-progress-strongest-signal"/);
  assert.match(progress, /data-testid="player-progress-opportunity"/);
  assert.match(css, /\.signalCard\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?border:\s*0;[\s\S]*?border-top:\s*1px solid[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/);
  assert.match(css, /\.nextFocus\s*\{[\s\S]*?border-radius:\s*16px;[\s\S]*?box-shadow:\s*none;/);
});

test("Phase 6D keeps one compact Player action geometry family inside deferred Player modules", async () => {
  const homeCss = await read("src/components/PlayerDailyCommandCenter.module.css");
  const progressCss = await read("src/components/PlayerProgressStory.module.css");
  const home = await read("src/components/PlayerDailyCommandCenter.jsx");
  const progress = await read("src/components/PlayerProgressStory.jsx");

  assert.match(home, /data-testid="player-daily-primary-action"/);
  assert.match(progress, /data-testid="player-progress-start-focus"/);
  assert.match(homeCss, /\.primaryButton,\.taskButton,\.activationButton\s*\{[\s\S]*?border-radius:\s*10px;/);
  assert.match(progressCss, /\.nextFocus button\s*\{[\s\S]*?border-radius:\s*10px;/);
  assert.match(progressCss, /\.detailRow button\s*\{[\s\S]*?border-radius:\s*10px;/);
});
