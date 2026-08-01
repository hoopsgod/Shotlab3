import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("coach notification bell opens an accessible action surface", () => {
  assert.match(source, /buildCoachInboxModel/);
  assert.match(source, /aria-controls="coach-inbox-panel"/);
  assert.match(source, /aria-expanded=\{inboxOpen\}/);
  assert.match(source, /onClick=\{openInbox\}/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="coach-inbox-title"/);
  assert.match(source, /data-testid="coach-inbox"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /previousActiveElement\?\.focus/);
});

test("coach inbox exposes honest destinations and closes before routing", () => {
  assert.match(source, /const runInboxAction/);
  assert.match(source, /restoreInboxFocusRef\.current = false/);
  assert.match(source, /setInboxOpen\(false\)/);
  assert.match(source, /source\?\.onClick \|\| onPlayersClick/);
  assert.match(source, /onNextEventClick\?\.\(\)/);
  assert.match(source, /runActivationAction\(item\?\.action\)/);
  assert.match(source, /Review Players/);
  assert.doesNotMatch(source, /Message Team/);
});

test("Mission Control feeds the inbox normalized player and activity intelligence", () => {
  assert.match(appSource, /const coachCommandAttentionItems=useMemo/);
  assert.match(appSource, /coachPlayerDashboardRows\.filter\(row=>row\.statusKey!=="active"\)/);
  assert.match(appSource, /actionLabel:"Open profile"/);
  assert.match(appSource, /openPlayerIntelligence\(row\.player\)/);
  assert.match(appSource, /const coachCommandActivityItems=useMemo/);
  assert.match(appSource, /attentionItems=\{coachCommandAttentionItems\}/);
  assert.match(appSource, /activityItems=\{coachCommandActivityItems\}/);
});

test("coach inbox is responsive and respects reduced motion", () => {
  assert.match(css, /\.mcInboxLayer/);
  assert.match(css, /\.mcInboxPanel/);
  assert.match(css, /max-height:min\(72dvh,620px\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
