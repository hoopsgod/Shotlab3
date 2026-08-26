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
  fs.writeFileSync(hierarchyPath, hierarchy);
}

const desktopTitleMarker = '/* Desktop Coach Home authority closure.';
const mobileMarker = '@media (max-width: 700px) {';
const desktopTitleAuthority = `/* Desktop Coach Home authority closure.
   The title-stage layer owns Coach header and hero identity at desktop just as it
   owns the mobile composition. The late support hierarchy must not override it. */
@media (min-width: 981px) {
  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] {
    width: 100% !important;
    min-width: 0 !important;
    min-height: 64px !important;
    padding: 8px 0 10px !important;
    border: 0 !important;
    border-bottom: 1px solid rgba(17,26,33,.09) !important;
    border-radius: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 16px !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"]::after {
    display: none !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcMobileMenu {
    display: none !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBrandLockup {
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBrandCopy {
    min-width: 0 !important;
    display: block !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBrandCopy small {
    display: block !important;
    color: #44515b !important;
    -webkit-text-fill-color: currentColor !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBrandCopy strong {
    display: block !important;
    margin-top: 2px !important;
    color: #111a21 !important;
    -webkit-text-fill-color: currentColor !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcHeaderActions {
    min-width: 0 !important;
    margin-left: auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 10px !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcTeamSelect {
    min-width: 176px !important;
    height: 44px !important;
    padding: 0 14px !important;
    border: 1px solid rgba(17,26,33,.15) !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 18px !important;
    background: #ffffff !important;
    color: #111a21 !important;
    -webkit-text-fill-color: currentColor !important;
    box-shadow: none !important;
  }

  .mcShellV3 .mcHeader[data-testid="mission-control-team-header"] .mcBell {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    border: 1px solid rgba(17,26,33,.15) !important;
    border-radius: 12px !important;
    display: grid !important;
    place-items: center !important;
    background: #ffffff !important;
    color: #111a21 !important;
    -webkit-text-fill-color: currentColor !important;
    box-shadow: none !important;
  }

  .mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcProgramIdentity {
    color: #f4f7f8 !important;
    -webkit-text-fill-color: currentColor !important;
  }

  .mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcEyebrow {
    color: var(--mc, #c8ff1a) !important;
    -webkit-text-fill-color: currentColor !important;
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

const testMarker = 'Phase 3 desktop Coach Home keeps header and hero identity in the source-owned title stage';
let scopeTest = fs.readFileSync(scopeTestPath, 'utf8');
if (!scopeTest.includes(testMarker)) {
  const declarationNeedle = 'const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");';
  if (!scopeTest.includes(declarationNeedle)) throw new Error('Could not locate Phase 3 scope declarations');
  scopeTest = scopeTest.replace(
    declarationNeedle,
    `${declarationNeedle}\nconst titleStageCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");\nconst hierarchyCss = fs.readFileSync(new URL("../src/styles/MissionControlHierarchy2026.css", import.meta.url), "utf8");`,
  );
  scopeTest += `\n\ntest("${testMarker}", () => {\n  assert.match(titleStageCss, /@media \\(min-width:\\s*981px\\)/);\n  assert.match(titleStageCss, /mission-control-team-header[\\s\\S]*mcMobileMenu[\\s\\S]*display:\\s*none !important/);\n  assert.match(titleStageCss, /mcProgramIdentity[\\s\\S]*color:\\s*#f4f7f8 !important/);\n  assert.match(titleStageCss, /mcEyebrow[\\s\\S]*color:\\s*var\\(--mc, #c8ff1a\\) !important/);\n  assert.doesNotMatch(hierarchyCss, /\\.mcHeader\\s*\\{/);\n});\n`;
  fs.writeFileSync(scopeTestPath, scopeTest);
}

console.log('Phase 3 desktop Coach Home authority moved to source-owned title stage.');
