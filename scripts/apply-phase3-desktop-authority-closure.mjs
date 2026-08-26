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

// The late support hierarchy and the legacy V2 foundation are not Phase 3
// ownership surfaces. Restore both exactly to the frozen production baseline;
// the canonical title-stage stylesheet will carry the intentional presentation.
fs.writeFileSync(hierarchyPath, readFrozenBase(hierarchyPath));
fs.writeFileSync(legacyV2Path, readFrozenBase(legacyV2Path));

let title = fs.readFileSync(titlePath, 'utf8');

// Remove either temporary desktop closure variant if a prior interrupted run
// left one in the worktree. The final source uses a different, normal-specificity
// marker below.
for (const oldMarker of [
  '/* Desktop Coach Home authority closure. */',
  '/* Desktop Coach Home authority closure.',
]) {
  const start = title.indexOf(oldMarker);
  if (start >= 0) {
    const mobile = title.indexOf('@media (max-width: 700px) {', start);
    if (mobile < 0) throw new Error('Could not locate mobile title-stage boundary while removing temporary desktop authority');
    title = `${title.slice(0, start)}${title.slice(mobile)}`;
    break;
  }
}

const heroAuthorityMarker = '/* Canonical Coach Home hero identity authority across tablet and desktop. */';
if (!title.includes(heroAuthorityMarker)) {
  const heroMarkNeedle = '.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark {';
  const heroMarkIndex = title.indexOf(heroMarkNeedle);
  if (heroMarkIndex < 0) throw new Error('Could not locate Coach hero mark insertion point');

  const heroAuthority = `/* Canonical Coach Home hero identity authority across tablet and desktop. */
.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcProgramIdentity {
  color: #f4f7f8;
  -webkit-text-fill-color: currentColor;
}

.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcEyebrow {
  color: var(--mc, #c8ff1a);
  -webkit-text-fill-color: currentColor;
}

.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] h1 {
  max-width: none;
  color: #f4f7f8;
  letter-spacing: normal;
}

`;
  title = `${title.slice(0, heroMarkIndex)}${heroAuthority}${title.slice(heroMarkIndex)}`;
}

const desktopControlMarker = '/* Canonical desktop Coach Home control authority. */';
if (!title.includes(desktopControlMarker)) {
  const mobileMarker = '@media (max-width: 700px) {';
  const mobileIndex = title.indexOf(mobileMarker);
  if (mobileIndex < 0) throw new Error('Could not locate mobile title-stage marker');

  const desktopControlAuthority = `/* Canonical desktop Coach Home control authority. */
@media (min-width: 981px) {
  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcTeamSelect,
  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBell {
    background: #fff;
    color: #111a21;
    border-color: rgba(17,26,33,.15);
  }
}

`;
  title = `${title.slice(0, mobileIndex)}${desktopControlAuthority}${title.slice(mobileIndex)}`;
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
    `${declarationNeedle}\nconst titleStageCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");\nconst hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");`,
  );
  scopeTest += `\n\ntest("${testMarker}", () => {\n  assert.match(titleStageCss, /Canonical Coach Home hero identity authority/);\n  assert.match(titleStageCss, /mcProgramIdentity[\\s\\S]*color:\\s*#f4f7f8/);\n  assert.match(titleStageCss, /mcEyebrow[\\s\\S]*color:\\s*var\\(--mc, #c8ff1a\\)/);\n  assert.match(titleStageCss, /mcHero\\[data-team-identity-stage="coach-mission-control"\\] h1[\\s\\S]*max-width:\\s*none/);\n  assert.match(titleStageCss, /@media \\(min-width:\\s*981px\\)[\\s\\S]*mcTeamSelect,[\\s\\S]*mcBell[\\s\\S]*background:\\s*#fff/);\n  assert.doesNotMatch(titleStageCss, /!important|html\\s+body\\s+#root/);\n  assert.doesNotMatch(hierarchyCss, /\\.mcHeader\\s*\\{/);\n});\n`;
  fs.writeFileSync(scopeTestPath, scopeTest.endsWith('\n') ? scopeTest : `${scopeTest}\n`);
}

console.log('Phase 3 Coach Home restored to canonical source-owned title authority.');
