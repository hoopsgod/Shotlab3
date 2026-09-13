import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const enhancerUrl = new URL("../src/lib/coachHomeHierarchyEnhancer.js", import.meta.url);
const playersUrl = new URL("../src/screens/PlayersScreen.jsx", import.meta.url);
const coachShellUrl = new URL("../src/components/CoachMissionControlShell.css", import.meta.url);
const phase6AUrl = new URL("../src/styles/Phase6AVisualSystem.css", import.meta.url);

const enhancer = readFileSync(enhancerUrl, "utf8");
const players = readFileSync(playersUrl, "utf8");
const coachShell = readFileSync(coachShellUrl, "utf8");

test("Phase 6A visual authority is consolidated into canonical Coach Home and Players owners", () => {
  assert.equal(existsSync(phase6AUrl), false);
  assert.match(coachShell, /coach-mission-control/);
  assert.match(coachShell, /@media\(max-width:700px\)/);
  assert.match(players, /premium-roster-workspace/);
  assert.match(players, /TeamIdentityTitleStage/);
  assert.match(players, /coach-players-primary-objective/);
  assert.match(players, /coach-players-metrics/);
  assert.doesNotMatch(`${coachShell}\n${players}`, /supabase|localStorage|sessionStorage/i);
});

test("Coach Home hierarchy enhancer stays pure and Node-importable", async () => {
  const module = await import(enhancerUrl);
  assert.equal(typeof module.installCoachHomeHierarchyEnhancer, "function");
  assert.match(enhancer, /shotlab-coach-home-hierarchy-cleanup/);
  assert.match(enhancer, /coach-setup-checklist/);
  assert.doesNotMatch(enhancer, /\.css\?inline|Phase6AVisualSystem|shotlab-phase6a-visual-authority/);
  assert.doesNotMatch(enhancer, /setTimeout/);
});
