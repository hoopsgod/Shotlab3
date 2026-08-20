import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const routes = read("src/components/CoachInteractiveDashboards.jsx");
const routeCss = read("src/components/CoachRoutePerformanceStage.module.css");
const convergence = read("src/styles/CoachRoleVisualConvergence2026.css");
const authority = read("src/styles/AuthenticatedVisualAuthority2026.css");
const secondary = read("src/components/SecondaryPageSystem.css");
const events = read("src/components/CoachEventsPremiumV2.css");
const branding = read("src/screens/CoachTeamBrandingScreen.jsx");
const app = read("src/App.jsx");

const navyGradient = /linear-gradient\(145deg,\s*#0b2633,\s*#071820 72%\)/;

test("all Coach operational destinations resolve through the shared editorial and performance system", () => {
  for (const marker of [
    "coach-players-interactive-dashboard",
    "coach-events-interactive-dashboard",
    "coach-page-dashboard-drills",
    "coach-page-dashboard-strength",
    "coach-page-dashboard-leaderboards",
  ]) assert.match(routes, new RegExp(marker));
  assert.match(app, /\{k:"settings",l:"Team & Account"/);
  assert.match(app, /className="coachAdministrationWorkspace"/);
  assert.match(branding, /testId="coach-branding-workspace"/);
  assert.match(secondary, /\.coachPlayerDetailWorkspace/);
});

test("Coach route decisions use the same navy performance material and lime action rhythm as Player", () => {
  assert.match(routeCss, navyGradient);
  assert.doesNotMatch(routeCss, /linear-gradient\(145deg,\s*#121817 0%,\s*#07100f 74%\)/);
  assert.match(routeCss, /\.stage \.action[\s\S]*min-height:\s*54px/);
  assert.match(routeCss, /background:\s*color-mix\(in srgb, var\(--stage-accent\) 92%, white 8%\)/);
  assert.match(routeCss, /@media \(max-width: 760px\)[\s\S]*\.stage \{[\s\S]*border-radius:\s*22px/);
  assert.match(routeCss, /\.watermark \{[\s\S]*opacity:\s*\.035/);
  assert.match(routeCss, /@media \(max-width: 760px\)[\s\S]*\.watermark \{ display: none; \}/);
});

test("Coach supporting surfaces converge on cream paper and flat evidence instead of black glass", () => {
  assert.match(convergence, /--coach-2026-canvas:\s*#f4f1e9/);
  assert.match(convergence, /--coach-2026-paper:\s*#ffffff/);
  assert.match(convergence, /\[data-visual-role="insight-card"\]\[data-surface="light"\][\s\S]*border-radius:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/);
  assert.match(convergence, /\.coachAdministrationCard,[\s\S]*\.seasonArchiveDetail[\s\S]*box-shadow:\s*none;/);
  assert.match(convergence, /#coach-drills-management[\s\S]*box-shadow:\s*none !important/);
  assert.match(convergence, /coach-page-dashboard-strength[\s\S]*box-shadow:\s*none !important/);
});

test("Coach player detail uses navy performance identity with a light metric ledger", () => {
  assert.match(convergence, /\.coachPlayerProfileHero[\s\S]*linear-gradient\(145deg, var\(--coach-2026-navy-2\), var\(--coach-2026-navy\) 72%\)/);
  assert.match(convergence, /\.coachPlayerProfileMetrics[\s\S]*background:\s*var\(--coach-2026-paper\);[\s\S]*box-shadow:\s*none;/);
  assert.match(convergence, /\.coachPlayerDataManagement[\s\S]*background:\s*var\(--coach-2026-paper\);[\s\S]*box-shadow:\s*none;/);
});

test("Coach Events keeps calendar-first behavior while replacing green-black deep surfaces with navy", () => {
  assert.match(events, /coachEventsCalendar/);
  assert.match(convergence, /\.coachEventsCalendar[\s\S]*--calendar-deep:\s*var\(--coach-2026-navy\)/);
  assert.match(convergence, /coach-events-decision-brief[\s\S]*linear-gradient\(145deg, var\(--coach-2026-navy-2\), var\(--coach-2026-navy\) 72%\)/);
  assert.match(convergence, /\.coachEventsCalendar__day\[data-selected="true"\][\s\S]*background:\s*var\(--coach-2026-navy\)/);
});

test("Program Branding uses navy preview, quiet controls, and the shared lime primary action", () => {
  assert.match(branding, /data-visual-role="branding-preview"/);
  assert.match(branding, /data-visual-role="branding-controls"/);
  assert.match(convergence, /coach-branding-workspace[\s\S]*branding-preview[\s\S]*linear-gradient\(145deg, #0b2633, #071820 72%\)/);
  assert.match(convergence, /branding-controls[\s\S]*background:\s*#fff !important;[\s\S]*box-shadow:\s*none !important/);
  assert.match(convergence, /form button\[type="submit"\][\s\S]*min-height:\s*52px !important/);
});

test("Coach convergence loads after shared surface contracts without becoming title or behavior authority", () => {
  const shared = authority.indexOf('./Phase3SurfaceContracts.css');
  const coach = authority.indexOf('./CoachRoleVisualConvergence2026.css');
  assert.ok(shared >= 0 && coach > shared, "Coach convergence must load after shared surface contracts");
  assert.doesNotMatch(convergence, /\.teamIdentityTitleStage|data-team-identity-stage|data-identity-role/);
  assert.doesNotMatch(convergence, /onClick|localStorage|sessionStorage|fetch\(|supabase|setTab|navigate/);
  assert.doesNotMatch(convergence, /\.performance-shell--player/);
});
