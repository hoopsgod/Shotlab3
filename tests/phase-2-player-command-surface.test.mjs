import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const component = read("../src/components/PlayerDailyCommandCenter.jsx");
const commandCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const primitivesCss = read("../src/components/PlayerDailyPrimitives.module.css");
const identityCss = read("../src/components/DashboardIdentityHeader.module.css");

const compactType = /font-size:\s*(?:8|9|10)px\b|font:\s*[^;]*(?:8|9|10)px\b/;
const legacyCondensed = /Bebas Neue|Barlow Condensed|Arial Narrow/;

test("Phase 2 gives Player Home one concise daily command label", () => {
  assert.match(component, /"Today’s focus"/);
  assert.match(component, /return "Next action"/);
  assert.doesNotMatch(component, /Today · Daily Command Center|Next best action/);
});

test("Phase 2 preserves the complete Player action contract", () => {
  for (const contract of [
    'data-testid="player-daily-primary-action"',
    'data-testid="player-coach-priority-signal"',
    'data-testid="player-daily-task-queue"',
    'data-testid="player-progress-disclosure"',
    'data-testid="player-activation-loop"',
    "onClick={() => runAction(primary)}",
    "onClick={() => runAction(task)}",
  ]) assert.ok(component.includes(contract), "missing " + contract);
});

test("Phase 2 removes legacy condensed typography and sub-11px labels from Player Home", () => {
  const playerHomeCss = [commandCss, primitivesCss, identityCss].join("\n");
  assert.doesNotMatch(playerHomeCss, compactType);
  assert.doesNotMatch(primitivesCss, legacyCondensed);
  assert.match(primitivesCss, /font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display'/);
  assert.match(primitivesCss, /font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text'/);
});

test("Phase 2 uses canonical command geometry and accessible action targets", () => {
  assert.match(primitivesCss, /border-radius: var\(--radius-lg, 18px\)/);
  assert.match(primitivesCss, /border-radius: var\(--radius-md, 14px\)/);
  assert.match(primitivesCss, /min-height: 28px/);
  assert.match(commandCss, /min-height: var\(--touch-target, 44px\)/);
  assert.match(commandCss, /border-radius: var\(--radius-md, 14px\)/);
  assert.match(commandCss, /border-radius: var\(--radius-xl, 24px\)/);
});

test("Phase 2 keeps the mobile mission rail on one compact line", () => {
  assert.match(identityCss, /@media\(max-width:480px\)[\s\S]*?\.mission\{display:flex;/);
  assert.match(identityCss, /\.mission strong\{[^}]*white-space:nowrap/);
});

test("Phase 2 is presentation-only", () => {
  for (const source of [commandCss, primitivesCss, identityCss]) {
    assert.doesNotMatch(source, /supabase|auth\.|fetch\(|localStorage|sessionStorage|create table|alter table/i);
  }
});
