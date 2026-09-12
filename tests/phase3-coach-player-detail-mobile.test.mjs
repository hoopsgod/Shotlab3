import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const authority = fs.readFileSync(new URL("../src/styles/AuthenticatedVisualAuthority2026.css", import.meta.url), "utf8");
const secondary = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.css", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Coach player detail keeps the existing mobile one-column hero", () => {
  assert.match(secondary, /@media\(max-width:760px\)[\s\S]*\.coachPlayerProfileHero\{grid-template-columns:1fr/);
});

test("Phase 3 reserves a stable avatar and flexible identity text track on mobile", () => {
  assert.match(authority, /@media \(max-width: 767px\)[\s\S]*\.coachPlayerProfileHero__identity\s*\{[\s\S]*grid-template-columns:\s*64px minmax\(0, 1fr\)\s*!important/);
  assert.match(authority, /\.coachPlayerProfileHero__identity > div\s*\{[\s\S]*width:\s*100%\s*!important;[\s\S]*min-width:\s*0\s*!important/);
  assert.match(authority, /\.coachPlayerProfileHero h2\s*\{[\s\S]*overflow-wrap:\s*normal\s*!important;[\s\S]*word-break:\s*normal\s*!important/);
});

test("player-detail geometry correction does not alter the Coach profile DOM or behavior", () => {
  const start = app.indexOf("function CoachPlayerDevelopmentProfile");
  const end = app.indexOf("function", start + 40);
  assert.ok(start >= 0 && end > start);
  const profile = app.slice(start, end);
  assert.match(profile, /className="coachPlayerProfileHero__identity"/);
  assert.match(profile, /className="coachPlayerProfileHero__headline"/);
  assert.match(profile, /data-testid="coach-player-development-profile"/);
  assert.doesNotMatch(profile, /onClick|onSubmit|navigate|setTab/);
});
