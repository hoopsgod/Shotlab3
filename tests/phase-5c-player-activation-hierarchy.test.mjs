import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const app = read("src/App.jsx");
const header = read("src/components/PlayerDashboardHeader.jsx");
const headerCss = read("src/components/DashboardIdentityHeader.module.css");
const command = read("src/components/PlayerDailyCommandCenter.jsx");
const commandCss = read("src/components/PlayerDailyCommandCenter.module.css");
const hierarchyCss = read("src/styles/CommandHierarchy2026.css");
const criticalCss = read("public/shotlab-phase2-critical.css");

test("Player Home encodes editorial, primary-decision, evidence, and quiet-secondary regions", () => {
  assert.match(header, /data-layout-role="editorial-header"/);
  assert.match(command, /data-page-hierarchy="activation-loop"/);
  assert.match(command, /data-layout-role="editorial-header"/);
  assert.match(command, /data-layout-role="primary-decision"/);
  assert.match(command, /data-layout-role="supporting-evidence"/);
  assert.match(command, /data-layout-role="quiet-secondary"/);
});

test("Player identity and command framing are unboxed while the action hero stays elevated", () => {
  assert.match(headerCss, /\.header\.player\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-bottom:\s*1px solid[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/);
  assert.match(headerCss, /\.player \.brandPanel\s*\{[\s\S]*?background:\s*transparent;/);
  assert.match(commandCss, /\.root\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/);
  assert.match(commandCss, /\.hero\s*\{[\s\S]*?border-radius:\s*24px;[\s\S]*?linear-gradient/);
  assert.match(commandCss, /\.progressGrid\s*\{[\s\S]*?gap:\s*0;[\s\S]*?border-block:\s*1px solid/);
  assert.match(commandCss, /\.progressCard\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/);
});

test("At Home and Program expose one primary region with flat supporting training rows", () => {
  assert.match(app, /data-player-journey="at-home"/);
  assert.match(app, /data-testid="player-shot-logging-region"[^>]+data-layout-role="primary-decision"/);
  assert.match(app, /data-testid="player-at-home-drill-plan"[^>]+data-layout-role="supporting-evidence"/);
  assert.match(app, /data-player-journey="program"/);
  assert.match(app, /data-layout-role=\{isPrimarySession\?"primary-program-session":"quiet-secondary"\}/);
  assert.match(app, /className=\{`player-drill-row/);

  assert.match(hierarchyCss, /\.player-primary-logging-region\s*\{[\s\S]*?border-radius:\s*24px;[\s\S]*?linear-gradient/);
  assert.match(hierarchyCss, /\.player-training-plan\s*\{[\s\S]*?border-block:\s*1px solid/);
  assert.match(hierarchyCss, /\.player-drill-row\s*\{[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;/);
  assert.match(hierarchyCss, /\.player-program-session\s*\{[\s\S]*?border-top:\s*1px solid/);
  assert.match(hierarchyCss, /\.player-program-session--primary\s*\{[\s\S]*?border-radius:\s*24px;[\s\S]*?background:/);
});

test("legacy critical authority no longer recreates nested task and disclosure cards", () => {
  assert.doesNotMatch(criticalCss, /\[class\*="taskRow"\][\s\S]{0,180}background-color:\s*rgba\(255,\s*255,\s*255,\s*\.035\)/);
  assert.doesNotMatch(criticalCss, /\.playerProgressDisclosure,[\s\S]{0,220}background-color:\s*#0f1214/);
  assert.doesNotMatch(criticalCss, /\[data-command-role="activation"\][\s\S]{0,220}background-color:\s*#0f1214/);
});
