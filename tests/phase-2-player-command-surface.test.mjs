import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const component = read("../src/components/PlayerDailyCommandCenter.jsx");
const header = read("../src/components/PlayerDashboardHeader.jsx");
const commandCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const primitivesCss = read("../src/components/PlayerDailyPrimitives.module.css");
const identityCss = read("../src/components/DashboardIdentityHeader.module.css");

const compactType = /font-size:\s*(?:8|9|10)px\b|font:\s*[^;]*(?:8|9|10)px\b/;
const legacyCondensed = /Bebas Neue|Barlow Condensed|Arial Narrow/;

test("Player Home replaces competing command labels with one performance story", () => {
  assert.match(component, /data-testid="player-today-performance"/);
  assert.match(component, /data-testid="player-target-interpretation"/);
  assert.match(component, /aria-label="Weekly progress and momentum"/);
  assert.doesNotMatch(component, /Today’s focus|Next action|Personal development|About \{primary\.estimatedMinutes/);
});

test("Player Home preserves the complete Player action contract", () => {
  for (const contract of [
    'data-testid="player-daily-primary-action"',
    'data-testid="player-coach-priority-signal"',
    'data-testid="player-daily-task-queue"',
    'data-testid="player-progress-disclosure"',
    'data-testid="player-activation-loop"',
    "onClick={() => runAction(primary)}",
    "onClick={() => runAction(task)}",
  ]) assert.ok(component.includes(contract), "missing " + contract);
  assert.equal((component.match(/data-testid="player-daily-primary-action"/g) || []).length, 1);
});

test("Player Home removes legacy condensed typography and sub-11px labels", () => {
  const playerHomeCss = [commandCss, primitivesCss, identityCss].join("\n");
  assert.doesNotMatch(playerHomeCss, compactType);
  assert.doesNotMatch(primitivesCss, legacyCondensed);
  assert.match(primitivesCss, /font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display'/);
  assert.match(primitivesCss, /font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text'/);
});

test("Player Home uses accessible action targets and restrained geometry", () => {
  assert.match(primitivesCss, /border-radius: var\(--radius-lg, 18px\)/);
  assert.match(primitivesCss, /border-radius: var\(--radius-md, 14px\)/);
  assert.match(commandCss, /\.primaryButton\s*\{[\s\S]*?min-height:54px/);
  assert.match(commandCss, /\.taskButton,.activationButton\s*\{[\s\S]*?min-width:44px/);
  assert.match(commandCss, /border-radius:var\(--radius-md,14px\)/);
  assert.match(commandCss, /border-radius:var\(--radius-xl,24px\)/);
});

test("Player athlete credential is safe-area aware and removes redundant Home copy", () => {
  assert.match(header, /data-layout-role="compact-athlete-credential"/);
  assert.match(header, /env\(safe-area-inset-top\)/);
  assert.match(header, /overflow-wrap:anywhere/);
  assert.match(header, /tagline"\],\[data-identity-role="mission"\]\)\{display:none!important\}/);
});

test("Player presentation surfaces remain presentation-only", () => {
  for (const source of [commandCss, primitivesCss, identityCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i);
  }
});
