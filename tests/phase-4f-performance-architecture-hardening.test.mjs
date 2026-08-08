import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const optimizer = await readFile(new URL('../scripts/optimize-production-css.mjs', import.meta.url), 'utf8')
const budgetVerifier = await readFile(new URL('../scripts/verify-performance-budget.mjs', import.meta.url), 'utf8')
const routeEnhancer = await readFile(new URL('../scripts/finish-v9-route-enhancers.mjs', import.meta.url), 'utf8')
const browserAligner = await readFile(new URL('../scripts/align-phase4f-browser-contracts.mjs', import.meta.url), 'utf8')
const budget = JSON.parse(await readFile(new URL('../performance-budget.json', import.meta.url), 'utf8'))

test('Phase 4F uses neutral runtime plus shared foundations and one workspace chunk per role', () => {
  for (const chunk of ['RuntimeShared', 'AuthenticatedUi', 'AppDomainServices', 'PlayerWorkspaces', 'CoachWorkspaces']) assert.match(vite, new RegExp(`return '${chunk}'`))
  for (const retired of ['PlayerAnalyticsWorkspaces', 'PlayerInterfaceWorkspaces', 'CoachAdministrationWorkspaces', 'CoachOperationalWorkspaces', 'PlayerProfileWorkspaces']) assert.doesNotMatch(vite, new RegExp(`return '${retired}'`))
  assert.match(vite, /vite\/preload-helper/)
  assert.doesNotMatch(vite, /onlyExplicitManualChunks:\s*true/)
})

test('Phase 4F moves cross-role scoring and assignment services into AppDomainServices', () => {
  assert.match(vite, /APP_DOMAIN_SERVICE_FRAGMENTS/)
  for (const fragment of ['authFlow','appPersistenceService','homeShotLogging','playerDataManagement','seasonLeaderboardAnalytics','programDrillScoring','assignmentDeadline','playerAssignmentService','playerAssignmentHistoryService']) assert.match(vite, new RegExp(fragment))
  assert.match(vite, /return 'AppDomainServices'/)
})

test('Phase 4F keeps cross-role presentation, recovery, and fallback styling in AuthenticatedUi', () => {
  assert.match(vite, /SHARED_AUTHENTICATED_UI_FRAGMENTS/)
  for (const fragment of ['TeamBrandingContext','MobileNavigation','VisualHierarchy','ShotLabStatePanel','SemanticStatus','WorkspaceRecoveryBoundary','PlayerInterfaceFallback']) assert.match(vite, new RegExp(fragment))
  assert.match(vite, /return 'AuthenticatedUi'/)
})

test('Phase 4F closes legacy browser mutations with current premium disclosures and hydrated events', () => {
  assert.match(packageJson.scripts['prepare:route-enhancers'], /align-phase4f-browser-contracts\.mjs/)
  assert.match(routeEnhancer, /setViewportSize\(\{ width: 390, height: 844 \}\)/)
  assert.match(routeEnhancer, /v1\/legacy-auth\/restore/)
  assert.match(browserAligner, /coach-player-account-activation/)
  assert.match(browserAligner, /coach-player-roster-management/)
  assert.match(browserAligner, /locator\("summary"\)\.click\(\)/)
  assert.match(browserAligner, /requestUrl\.includes\("\/rest\/v1\/events"\)/)
  assert.match(browserAligner, /commonSeed\["sl:events"\]/)
  assert.match(browserAligner, /const responseButton = playerPage\.getByRole\("button", \{ name: "Respond now", exact: true \}\)/)
  assert.match(browserAligner, /const rsvpButton = playerPage\.getByRole\("button", \{ name: \/RSVP NOW\/ \}\)\.first\(\)/)
  assert.match(browserAligner, /await rsvpButton\.click\(\)/)
  assert.match(browserAligner, /if \(!next\.includes\(premiumResponse\)\)/)
  assert.match(browserAligner, /next = next\.replace\(legacy, premiumResponse\);\s*break;/)
})

test('Phase 4F treats absent startup App CSS as zero payload rather than a missing asset failure', () => {
  assert.match(budgetVerifier, /zeroWhenMissing:\s*true/)
  assert.match(budgetVerifier, /none \(zero startup App\.\$\{extension\}\)/)
  assert.doesNotMatch(budgetVerifier, /startupAppCss\.missing\).*failures\.push/)
})

test('Phase 4F uses reproducible production-grade minification and compact CSS module names', () => {
  assert.equal(packageJson.devDependencies.terser, '5.49.2')
  assert.equal(packageJson.devDependencies.lightningcss, '1.33.0')
  assert.equal(packageJson.devDependencies.csso, '5.0.5')
  assert.match(vite, /minify:\s*'terser'/)
  assert.match(vite, /cssMinify:\s*'lightningcss'/)
  assert.match(vite, /passes:\s*2/)
  assert.match(vite, /generateScopedName:\s*'s_\[hash:base64:6\]'/)
})

test('Phase 4F strips low-value production logging but preserves warning and error diagnostics', () => {
  assert.match(vite, /pure:\s*\['console\.log', 'console\.debug', 'console\.info'\]/)
  assert.doesNotMatch(vite, /console\.warn'.*pure/)
  assert.doesNotMatch(vite, /console\.error'.*pure/)
})

test('Phase 4F compiles superseded CSS without selector guessing', () => {
  assert.match(packageJson.scripts.build, /optimize-production-css\.mjs/)
  assert.match(optimizer, /superseded declarations/i)
  assert.match(optimizer, /RECURSIVE_AT_RULE/)
  assert.match(optimizer, /previous\.important/)
  assert.doesNotMatch(optimizer, /purgecss|querySelectorAll/i)
})

test('Phase 4F does not weaken the established performance budget', () => {
  assert.equal(budget.maxLargestJavaScriptBytes, 585000)
  assert.equal(budget.maxStartupAppJavaScriptBytes, 585000)
  assert.equal(budget.maxStartupAppJavaScriptGzipBytes, 166000)
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000)
  assert.equal(budget.maxLargestCssBytes, 128000)
  assert.equal(budget.maxStartupAppCssBytes, 25000)
  assert.equal(budget.maxStartupAppCssGzipBytes, 5500)
  assert.equal(budget.maxTotalCssGzipBytes, 76750)
  assert.equal(budget.maxJavaScriptFileCount, 8)
})
