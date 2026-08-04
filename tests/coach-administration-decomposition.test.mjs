import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const appSource = fs.readFileSync('src/App.jsx', 'utf8')
const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
const fallbackSource = fs.readFileSync('src/components/CoachAdministrationFallback.jsx', 'utf8')
const performanceBudget = JSON.parse(fs.readFileSync('performance-budget.json', 'utf8'))

const boundaries = [
  {
    appImport: /import NewSeasonWizard from ["']\.\/components\/NewSeasonWizard\.jsx["']/,
    wrapperPath: 'src/components/DeferredNewSeasonWizard.jsx',
    implementationImport: /import\(["']\.\/NewSeasonWizard\.jsx["']\)/,
    redirectSource: "'./components/NewSeasonWizard.jsx'",
    implementationPath: '/src/components/NewSeasonWizard.jsx',
    testId: 'new-season-wizard-loading',
  },
  {
    appImport: /import CoachPlayerInviteForm from ["']\.\/components\/CoachPlayerInviteForm\.jsx["']/,
    wrapperPath: 'src/components/DeferredCoachPlayerInviteForm.jsx',
    implementationImport: /import\(["']\.\/CoachPlayerInviteForm\.jsx["']\)/,
    redirectSource: "'./components/CoachPlayerInviteForm.jsx'",
    implementationPath: '/src/components/CoachPlayerInviteForm.jsx',
    testId: 'coach-player-invite-loading',
  },
  {
    appImport: /import CoachProgramScoreDrawer from ["']\.\/components\/CoachProgramScoreDrawer\.jsx["']/,
    wrapperPath: 'src/components/DeferredCoachProgramScoreDrawer.jsx',
    implementationImport: /import\(["']\.\/CoachProgramScoreDrawer\.jsx["']\)/,
    redirectSource: "'./components/CoachProgramScoreDrawer.jsx'",
    implementationPath: '/src/components/CoachProgramScoreDrawer.jsx',
    testId: 'coach-program-score-loading',
  },
  {
    appImport: /import CoachTeamBrandingScreen from ["']\.\/screens\/CoachTeamBrandingScreen["']/,
    wrapperPath: 'src/components/DeferredCoachTeamBrandingScreen.jsx',
    implementationImport: /import\(["']\.\.\/screens\/CoachTeamBrandingScreen\.jsx["']\)/,
    redirectSource: "'./screens/CoachTeamBrandingScreen'",
    implementationPath: '/src/screens/CoachTeamBrandingScreen.jsx',
    testId: 'coach-team-branding-loading',
  },
]

test('residual Coach administration imports are redirected only from App', () => {
  assert.match(viteConfig, /name:\s*["']shotlab-defer-coach-administration["']/)
  assert.match(viteConfig, /!importerId\.endsWith\(APP_MODULE_SUFFIX\)/)
  assert.match(viteConfig, /COACH_ADMIN_REDIRECTS\.get\(source\)/)
  assert.doesNotMatch(viteConfig, /DeferredPlayersScreen/)
  assert.doesNotMatch(viteConfig, /\/src\/screens\/PlayersScreen\.jsx/)

  for (const boundary of boundaries) {
    assert.match(appSource, boundary.appImport)
    assert.ok(viteConfig.includes(boundary.redirectSource))
    assert.ok(viteConfig.includes(boundary.wrapperPath.split('/').at(-1)))
  }
})

test('every Coach administration wrapper preserves the default component contract', () => {
  for (const boundary of boundaries) {
    const wrapperSource = fs.readFileSync(boundary.wrapperPath, 'utf8')
    assert.match(wrapperSource, boundary.implementationImport)
    assert.match(wrapperSource, /lazy\(\(\) => import\(/)
    assert.match(wrapperSource, /<Suspense fallback=/)
    assert.ok(wrapperSource.includes(boundary.testId))
    assert.match(wrapperSource, /\{\.\.\.props\}/)
    assert.doesNotMatch(wrapperSource, /^import .*NewSeasonWizard|^import .*CoachPlayerInviteForm|^import .*CoachProgramScoreDrawer|^import .*CoachTeamBrandingScreen/m)
  }
})

test('Coach administration uses one polished loading system', () => {
  assert.match(fallbackSource, /data-testid=\{testId\}/)
  assert.match(fallbackSource, /role=["']status["']/)
  assert.match(fallbackSource, /Preparing \{label\}/)
})

test('Coach administration and Player Profile each use one coherent deferred request slot', () => {
  for (const boundary of boundaries) {
    assert.ok(viteConfig.includes(boundary.implementationPath))
  }
  assert.match(viteConfig, /return ["']CoachAdministrationWorkspaces["']/)
  assert.match(viteConfig, /moduleId\.includes\(["']\/src\/components\/ShotLabCharts\.jsx["']\)/)
  assert.match(viteConfig, /moduleId\.includes\(["']\/src\/components\/PlayerCareerHistory\.jsx["']\)/)
  assert.match(viteConfig, /return ["']PlayerProfileWorkspaces["']/)
  assert.equal(performanceBudget.maxJavaScriptFileCount, 8)
})
