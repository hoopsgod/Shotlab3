import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

const TEAM_ID = 'team-performance-decomposition'
const PLAYER_EMAIL = 'demo@shotlab.app'
const COACH_EMAIL = 'coach.demo@shotlab.app'

const seedData = {
  'sl:teams': [{
    id: TEAM_ID,
    name: 'Performance Team',
    ownerCoachId: COACH_EMAIL,
    joinCode: 'FAST01',
    createdAt: Date.now() - 86_400_000,
  }],
  'sl:players': [
    { id: 'performance-coach', email: COACH_EMAIL, name: 'Demo Coach', role: 'coach', isCoach: true, teamId: TEAM_ID },
    { id: 'performance-player', playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: 'Demo Player', role: 'player', teamId: TEAM_ID },
  ],
  'sl:player-profiles': [{
    id: 'performance-profile',
    userId: PLAYER_EMAIL,
    email: PLAYER_EMAIL,
    teamId: TEAM_ID,
    firstName: 'Demo',
    lastName: 'Player',
  }],
  'sl:drills': [{ id: 'form-shooting', name: 'Form Shooting', desc: 'Clean mechanics', max: 50, icon: 'ft' }],
  'sl:program-drills': [],
  'sl:scores': [{
    id: 'performance-score',
    email: PLAYER_EMAIL,
    playerId: PLAYER_EMAIL,
    name: 'Demo Player',
    teamId: TEAM_ID,
    drillId: 'form-shooting',
    drillName: 'Form Shooting',
    score: 42,
    src: 'home',
    date: new Date().toISOString().slice(0, 10),
    ts: Date.now(),
  }],
  'sl:program-scores': [],
  'sl:shotlogs': [],
  'sl:events': [],
  'sl:rsvps': [],
  'sl:sc-sessions': [],
  'sl:sc-rsvps': [],
  'sl:sc-logs': [],
  'sl:season-archives': [],
  'sl:coach-priorities': {
    [TEAM_ID]: {
      todayFocusText: 'Protect the fast path',
      priorityDrillText: 'Form Shooting',
      weeklyMakesTarget: 500,
      weeklyCheckinsTarget: 2,
    },
  },
}

async function installSafeRoutes(page) {
  await page.route('**/v1/team-priorities', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, priorities_by_team: seedData['sl:coach-priorities'] }),
  }))
  await page.route('**/v1/season-archives', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, archives: [] }),
  }))
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ leaderboard: [] }),
  }))
  await page.route('**/v1/leaderboards/participation**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, leaderboards: {} }),
  }))
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, invitations: [] }),
  }))
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
}

const implementationLoaded = (page, moduleName, wrapperName) => page.evaluate(
  ({ implementation, wrapper }) => performance
    .getEntriesByType('resource')
    .some((entry) => {
      const resourceName = String(entry.name)
      return resourceName.includes(implementation) && !resourceName.includes(wrapper)
    }),
  { implementation: moduleName, wrapper: wrapperName },
)

const routeChunkLoaded = (page, moduleNames, excludedNames = []) => page.evaluate(
  ({ names, excluded }) => performance
    .getEntriesByType('resource')
    .some((entry) => {
      const resourceName = String(entry.name)
      const matches = names.some((moduleName) => resourceName.includes(moduleName))
      const excludedMatch = excluded.some((moduleName) => resourceName.includes(moduleName))
      return matches && !excludedMatch
    }),
  { names: moduleNames, excluded: excludedNames },
)

const playerProfileLoaded = (page) => routeChunkLoaded(
  page,
  ['PlayerProfileWorkspaces', 'ShotLabCharts', 'PlayerCareerHistory'],
  ['DeferredShotLabCharts', 'DeferredPlayerCareerHistory'],
)

const coachOperationalLoaded = (page) => routeChunkLoaded(
  page,
  ['CoachOperationalWorkspaces', 'CoachCommandCenter', 'CoachDashboardPhase2', 'CoachInteractiveDashboards'],
  ['DeferredCoach'],
)

const coachAdministrationLoaded = (page) => routeChunkLoaded(
  page,
  ['CoachAdministrationWorkspaces', 'NewSeasonWizard', 'CoachPlayerInviteForm', 'CoachProgramScoreDrawer', 'CoachTeamBrandingScreen'],
  ['DeferredNewSeasonWizard', 'DeferredCoachPlayerInviteForm', 'DeferredCoachProgramScoreDrawer', 'DeferredCoachTeamBrandingScreen'],
)

async function seedStorage(page) {
  await page.addInitScript((payload) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    for (const [key, value] of Object.entries(payload)) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  }, seedData)
}

async function enterPlayer(page) {
  await installSafeRoutes(page)
  await seedStorage(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Demo Player', exact: true }).click()
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 })
}

async function openMoreDestination(page, key) {
  await page.getByTestId('mobile-navigation-more').click()
  const sheet = page.getByTestId('mobile-navigation-sheet')
  await expect(sheet).toBeVisible()
  await sheet.locator(`[data-nav-key="${key}"]`).click()
}

test('Profile workspaces load together only after the player opens Profile', async ({ page }) => {
  await installSafeRoutes(page)
  await seedStorage(page)

  await page.goto('/')
  await expect.poll(() => playerProfileLoaded(page)).toBe(false)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)

  await page.getByRole('button', { name: 'Demo Player', exact: true }).click()
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => playerProfileLoaded(page)).toBe(false)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)

  await openMoreDestination(page, 'profile')
  const workspace = page.getByTestId('progress-charts-workspace')
  await expect(workspace).toBeVisible({ timeout: 20_000 })
  await expect(workspace.getByText(/MY\s*PROGRESS/i)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('player-career-history')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('progress-charts-loading')).toHaveCount(0)
  await expect(page.getByTestId('player-career-history-loading')).toHaveCount(0)
  await expect.poll(() => playerProfileLoaded(page)).toBe(true)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)
})

test('leaderboard analytics load only after the player opens Leaderboards', async ({ page }) => {
  await enterPlayer(page)
  await expect.poll(() => implementationLoaded(page, 'PremiumLeaderboardsHub', 'DeferredPremiumLeaderboardsHub')).toBe(false)
  await expect.poll(() => playerProfileLoaded(page)).toBe(false)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)

  await openMoreDestination(page, 'leaderboards')
  const workspace = page.getByTestId('deferred-leaderboards-workspace')
  await expect(workspace).toBeVisible({ timeout: 20_000 })
  await expect(workspace.getByTestId('premium-leaderboards-hub')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('leaderboards-loading')).toHaveCount(0)
  await expect.poll(() => implementationLoaded(page, 'PremiumLeaderboardsHub', 'DeferredPremiumLeaderboardsHub')).toBe(true)
  await expect.poll(() => playerProfileLoaded(page)).toBe(false)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)
})

test('Coach operational and administration workspaces stay out of auth and Player, then initialize for Coach', async ({ page }) => {
  await installSafeRoutes(page)
  await seedStorage(page)

  await page.goto('/')
  await expect.poll(() => coachOperationalLoaded(page)).toBe(false)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(false)

  await page.getByRole('button', { name: 'Demo Coach', exact: true }).click()
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 })

  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('coach-command-center-loading')).toHaveCount(0)
  await expect(page.getByTestId('coach-activity-intelligence-panel')).toHaveCount(1)
  await expect(page.getByTestId('coach-intelligence-loading')).toHaveCount(0)
  await expect.poll(() => coachOperationalLoaded(page)).toBe(true)

  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click()
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('coach-players-command-bar')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('coach-interactive-dashboard-loading')).toHaveCount(0)
  await expect.poll(() => coachAdministrationLoaded(page)).toBe(true)
})
