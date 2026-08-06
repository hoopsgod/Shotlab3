import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const icon = fs.readFileSync("src/components/ShotLabIcon.jsx", "utf8");
const playerPrimitives = fs.readFileSync("src/components/PlayerDailyPrimitives.jsx", "utf8");
const playerStyles = fs.readFileSync("src/components/PlayerDailyPrimitives.module.css", "utf8");
const secondary = fs.readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const secondaryStyles = fs.readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const coach = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const visualAuthority = fs.readFileSync("public/shotlab-v15-session-integrity.css", "utf8");
const screenshotWorkflow = fs.readFileSync(".github/workflows/app-store-presentation-readiness.yml", "utf8");

test("ShotLab owns a proprietary restrained SVG icon family", () => {
  for (const name of ["target","coach","training","momentum","streak","team","calendar","trophy","profile","store","chart","check","alert","arrow"]) {
    assert.ok(icon.includes(`${name}:`), `missing ShotLab icon ${name}`);
  }
  assert.match(icon, /strokeWidth="1\.75"/);
  assert.match(icon, /strokeLinecap="round"/);
  assert.doesNotMatch(icon, /emoji|lucide|fontawesome/i);
});

test("Player intelligence primitives use the shared icon family", () => {
  assert.match(playerPrimitives, /import ShotLabIcon/);
  assert.match(playerPrimitives, /<ShotLabIcon name=\{iconName\}/);
  assert.match(playerStyles, /\.signalIcon/);
  assert.match(playerStyles, /grid-template-columns:42px minmax\(0,1fr\) auto/);
});

test("secondary page heroes and decision surfaces use signature icons", () => {
  assert.match(secondary, /import ShotLabIcon/);
  assert.match(secondary, /secondaryPageIntro__icon/);
  assert.match(secondary, /secondaryPageDecision__icon/);
  assert.match(secondaryStyles, /grid-template-columns:56px minmax\(0,1fr\) auto/);
  assert.match(secondaryStyles, /overflow-wrap:anywhere/);
});

test("Coach iconography remains custom SVG with the same precision language", () => {
  assert.match(coach, /function Icon/);
  assert.match(coach, /strokeWidth="1\.8"/);
  assert.match(coach, /strokeLinecap="round"/);
  assert.match(coach, /target:/);
  assert.match(coach, /calendar:/);
  assert.match(coach, /spark:/);
});

test("mobile containment is owned by the rendered accountability component", () => {
  assert.match(visualAuthority, /data-testid="coach-assignment-accountability"/);
  assert.match(visualAuthority, /overflow-wrap:anywhere!important/);
  assert.match(visualAuthority, /grid-template-columns:minmax\(0,1fr\) auto!important/);
});

test("every shared visual-system change triggers rendered screenshot verification", () => {
  for (const watched of ["ShotLabIcon.jsx","PlayerDailyPrimitives.jsx","PlayerDailyPrimitives.module.css","CoachCommandCenter.jsx","SecondaryPageSystem.jsx","MobileNavigation.jsx"]) {
    assert.ok(screenshotWorkflow.includes(watched), `screenshot workflow does not watch ${watched}`);
  }
  assert.match(screenshotWorkflow, /Generate branded App Store screenshots/);
  assert.match(screenshotWorkflow, /Upload Phase 1 and Phase 2 presentation evidence/);
  assert.match(screenshotWorkflow, /shotlab-phase-1-2-presentation-evidence/);
});
