import fs from 'node:fs';

const hierarchyPath = 'src/styles/MissionControlHierarchy2026.css';
const titlePath = 'src/components/CoachMissionControlTitleStage.css';
const scopeTestPath = 'tests/phase3-coach-home-scope.test.mjs';

const desktopHierarchyMarker = '/* Desktop Coach Home stays on the light editorial page, while the hero keeps';
const hierarchyResumeMarker = '/* Registered onboarding/sparse state uses a dark activation surface.';

let hierarchy = fs.readFileSync(hierarchyPath, 'utf8');
const hierarchyStart = hierarchy.indexOf(desktopHierarchyMarker);
if (hierarchyStart >= 0) {
  const hierarchyResume = hierarchy.indexOf(hierarchyResumeMarker, hierarchyStart);
  if (hierarchyResume < 0) throw new Error('Could not locate hierarchy resume marker');
  hierarchy = `${hierarchy.slice(0, hierarchyStart)}${hierarchy.slice(hierarchyResume)}`;
  fs.writeFileSync(hierarchyPath, hierarchy.endsWith('\n') ? hierarchy : `${hierarchy}\n`);
}

const desktopTitleMarker = '/* Desktop Coach Home authority closure. */';
const mobileMarker = '@media (max-width: 700px) {';
const desktopTitleAuthority = `/* Desktop Coach Home authority closure. */
@media (min-width: 981px) {
  .mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcProgramIdentity {
    color: #f4f7f8 !important;
    -webkit-text-fill-color: currentColor !important;
  }
  .mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcEyebrow {
    color: var(--mc, #c8ff1a) !important;
    -webkit-text-fill-color: currentColor !important;
  }
  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcTeamSelect,
  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBell {
    background: #fff !important;
    color: #111a21 !important;
    border-color: rgba(17,26,33,.15) !important;
  }
}

`;

let title = fs.readFileSync(titlePath, 'utf8');
if (!title.includes(desktopTitleMarker)) {
  const mobileIndex = title.indexOf(mobileMarker);
  if (mobileIndex < 0) throw new Error('Could not locate mobile title-stage marker');
  title = `${title.slice(0, mobileIndex)}${desktopTitleAuthority}${title.slice(mobileIndex)}`;
  fs.writeFileSync(titlePath, title);
}

const testMarker = 'Phase 3 desktop Coach Home keeps hero identity and controls in the source-owned title stage';
let scopeTest = fs.readFileSync(scopeTestPath, 'utf8');
if (!scopeTest.includes(testMarker)) {
  const declarationNeedle = 'const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");';
  if (!scopeTest.includes(declarationNeedle)) throw new Error('Could not locate Phase 3 scope declarations');
  scopeTest = scopeTest.replace(
    declarationNeedle,
    `${declarationNeedle}\nconst titleStageCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");\nconst hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");`,
  );
  scopeTest += `\n\ntest("${testMarker}", () => {\n  assert.match(titleStageCss, /@media \\(min-width:\\s*981px\\)/);\n  assert.match(titleStageCss, /mcProgramIdentity[\\s\\S]*color:\\s*#f4f7f8 !important/);\n  assert.match(titleStageCss, /mcEyebrow[\\s\\S]*color:\\s*var\\(--mc, #c8ff1a\\) !important/);\n  assert.match(titleStageCss, /mcTeamSelect,[\\s\\S]*mcBell[\\s\\S]*background:\\s*#fff !important/);\n  assert.doesNotMatch(hierarchyCss, /\\.mcHeader\\s*\\{/);\n});\n`;
  fs.writeFileSync(scopeTestPath, scopeTest);
}

console.log('Phase 3 desktop Coach Home authority narrowed to the source-owned title stage.');
