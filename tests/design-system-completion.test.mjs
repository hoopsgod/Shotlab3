import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const icon = fs.readFileSync("src/components/ShotLabIcon.jsx", "utf8");
const playerPrimitives = fs.readFileSync("src/components/PlayerDailyPrimitives.jsx", "utf8");
const playerStyles = fs.readFileSync("src/components/PlayerDailyPrimitives.module.css", "utf8");
const secondary = fs.readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const secondaryStyles = fs.readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const titleStage = fs.readFileSync("src/components/TeamIdentityTitleStage.jsx", "utf8");
const titleStyles = fs.readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const coach = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const visualAuthority = fs.readFileSync("public/shotlab-v15-session-integrity.css", "utf8");
const screenshotWorkflow = fs.readFileSync(".github/workflows/app-store-presentation-readiness.yml", "utf8");
const titleCertification = fs.readFileSync(".github/workflows/title-authority-repair-certification.yml", "utf8");

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

test("secondary page identity and decision surfaces use the shared semantic design system", () => {
  assert.match(secondary, /TeamIdentityTitleStage/);
  assert.match(secondary, /secondaryPageDecision__icon/);
  assert.match(titleStage, /data-identity-role="page-title"/);
  assert.match(titleStage, /data-identity-role="brand-mark"/);
  assert.match(titleStyles, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(secondaryStyles, /\.secondaryPageDecision\s*\{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\) minmax\(180px, 30%\)/);
  assert.match(secondaryStyles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(secondaryStyles, /\.secondaryPageIntro\b/);
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

test("shared visual-system and title changes trigger rendered screenshot verification", () => {
  for (const watched of ["ShotLabIcon.jsx","PlayerDailyPrimitives.jsx","PlayerDailyPrimitives.module.css","CoachCommandCenter.jsx","SecondaryPageSystem.jsx","MobileNavigation.jsx"]) {
    assert.ok(screenshotWorkflow.includes(watched), `screenshot workflow does not watch ${watched}`);
  }
  assert.match(screenshotWorkflow, /Generate branded App Store screenshots/);
  assert.match(screenshotWorkflow, /Upload App Store presentation package/);
  assert.match(titleCertification, /TeamIdentityTitleStage/);
  assert.match(titleCertification, /phase-3a-cross-screen-visual-audit\.spec\.mjs/);
  assert.match(titleCertification, /title-authority-mobile-certification/);
});
