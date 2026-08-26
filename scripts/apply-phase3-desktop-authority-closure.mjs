import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE_SHA = 'fb4f254c53ecb1d9f11e430307ff4eb7d4e0f122';
const hierarchyPath = 'src/styles/MissionControlHierarchy2026.css';
const legacyV2Path = 'src/components/CoachMissionControlV2.css';
const titlePath = 'src/components/CoachMissionControlTitleStage.css';
const scopeTestPath = 'tests/phase3-coach-home-scope.test.mjs';

const readFrozenBase = (path) => execFileSync(
  'git',
  ['show', `${BASE_SHA}:${path}`],
  { encoding: 'utf8' },
);

// Late support CSS and the legacy V2 foundation are not Phase 3 ownership
// surfaces. Restore both exactly to the frozen production baseline first.
fs.writeFileSync(hierarchyPath, readFrozenBase(hierarchyPath));
fs.writeFileSync(legacyV2Path, readFrozenBase(legacyV2Path));

let title = fs.readFileSync(titlePath, 'utf8');

// Remove the interrupted specificity-based desktop repair. The frozen V2 shell
// already supplies white hero text and the lime eyebrow, so re-declaring those
// colors would only add duplicate CSS. Keep only the computed desktop deltas.
const temporaryMarker = '/* Desktop Coach Home authority closure.';
const temporaryStart = title.indexOf(temporaryMarker);
if (temporaryStart >= 0) {
  const mobile = title.indexOf('@media (max-width: 700px) {', temporaryStart);
  if (mobile < 0) throw new Error('Could not locate mobile title-stage boundary while removing temporary desktop authority');
  title = `${title.slice(0, temporaryStart)}${title.slice(mobile)}`;
}

const desktopMarker = '/* Canonical desktop Coach Home authority: computed deltas only. */';
if (!title.includes(desktopMarker)) {
  const mobileMarker = '@media (max-width: 700px) {';
  const mobileIndex = title.indexOf(mobileMarker);
  if (mobileIndex < 0) throw new Error('Could not locate mobile title-stage marker');

  const desktopAuthority = `/* Canonical desktop Coach Home authority: computed deltas only. */
@media (min-width:981px){
.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] h1{max-width:none;letter-spacing:normal}
.mcShellV3 .mcHeader[data-testid="mission-control-team-header"] :is(.mcTeamSelect,.mcBell){background:#fff;color:#111a21;border-color:rgba(17,26,33,.15)}
}

`;
  title = `${title.slice(0, mobileIndex)}${desktopAuthority}${title.slice(mobileIndex)}`;
}

if (/!important|html\s+body\s+#root/.test(title)) {
  throw new Error('Canonical Coach title authority must not escalate specificity');
}
fs.writeFileSync(titlePath, title.endsWith('\n') ? title : `${title}\n`);

const testMarker = 'Phase 3 desktop Coach Home keeps hero identity and controls in the source-owned title stage';
let scopeTest = fs.readFileSync(scopeTestPath, 'utf8');
if (!scopeTest.includes(testMarker)) {
  const declarationNeedle = 'const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");';
  if (!scopeTest.includes(declarationNeedle)) throw new Error('Could not locate Phase 3 scope declarations');
  scopeTest = scopeTest.replace(
    declarationNeedle,
    `${declarationNeedle}\nconst titleStageCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");\nconst hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");\nconst legacyV2Css = fs.readFileSync(new URL("../src/components/CoachMissionControlV2.css", import.meta.url), "utf8");`,
  );
  scopeTest += `\n\ntest("${testMarker}", () => {\n  assert.match(titleStageCss, /Canonical desktop Coach Home authority: computed deltas only/);\n  assert.match(titleStageCss, /@media \\(min-width:981px\\)[\\s\\S]*mcHero\\[data-team-identity-stage="coach-mission-control"\\] h1\\{max-width:none;letter-spacing:normal\\}/);\n  assert.match(titleStageCss, /:is\\(\\.mcTeamSelect,\\.mcBell\\)\\{background:#fff;color:#111a21;border-color:rgba\\(17,26,33,\\.15\\)\\}/);\n  assert.match(legacyV2Css, /\\.mcShellV3\\{[^}]*color:#f4f7f8/);\n  assert.match(legacyV2Css, /\\.mcEyebrow\\{[^}]*color:var\\(--mc\\)/);\n  assert.doesNotMatch(titleStageCss, /!important|html\\s+body\\s+#root/);\n  assert.doesNotMatch(hierarchyCss, /\\.mcHeader\\s*\\{/);\n});\n`;
  fs.writeFileSync(scopeTestPath, scopeTest.endsWith('\n') ? scopeTest : `${scopeTest}\n`);
}

console.log('Phase 3 Coach Home restored to canonical source-owned title authority.');
