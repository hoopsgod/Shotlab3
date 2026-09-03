import { test, expect } from '@playwright/test';
import { buildPhase1BFixture, PHASE1B_TEAM_ID } from './support/phase1b-state-fixtures.mjs';
import { enterSeededRegisteredCoach, enterSeededRegisteredPlayer } from './registered-coach-fixture.mjs';
import {
  attachPhase1CRuntimeGuard,
  capturePhase1CSnapshot,
  installPhase1CFixedTime,
} from './support/phase1c-runtime-guard.mjs';

test.describe.configure({ mode: 'serial' });

const HEIGHT = 844;

const GEOMETRY = {
  coachHome: {
    targets: {
      workspace: '.performance-workspace--coach',
      routeShell: '[data-testid="coach-command-center-full"]',
      contentRail: '[data-testid="coach-command-center-full"] .missionControl',
      titleStage: '[data-team-identity-stage="coach-mission-control"]',
      primaryRegion: '[data-testid="coach-primary-objective"]',
    },
    centered: ['routeShell', 'contentRail', 'titleStage'],
  },
  coachPlayers: {
    targets: {
      workspace: '.performance-workspace--coach',
      routeShell: '[data-testid="coach-players-interactive-dashboard"]',
      contentRail: '[data-testid="coach-players-interactive-dashboard"]',
      titleStage: '[data-testid="coach-players-command-bar"]',
      primaryRegion: '[data-testid="coach-players-command-bar"]',
    },
    centered: ['routeShell', 'titleStage', 'primaryRegion'],
    localScrollSelectors: ['[aria-label="Dashboard view filters"]'],
  },
  coachEvents: {
    targets: {
      workspace: '.performance-workspace--coach',
      routeShell: '[data-testid="coach-events-interactive-dashboard"]',
      contentRail: '[data-testid="coach-events-interactive-dashboard"]',
      titleStage: '[data-testid="coach-events-command-bar"]',
      primaryRegion: '[data-testid="coach-events-decision-brief"]',
    },
    centered: ['routeShell', 'titleStage', 'primaryRegion'],
  },
  playerHome: {
    targets: {
      workspace: '.player-scroll-container',
      routeShell: '[data-testid="player-daily-command-center"]',
      contentRail: '[data-testid="player-daily-command-center"]',
      titleStage: '[data-testid="player-daily-command-center"] [data-command-role="primary"]',
      primaryRegion: '[data-testid="player-daily-command-center"] [data-layout-role="primary-decision"]',
    },
    centered: ['routeShell', 'titleStage', 'primaryRegion'],
  },
  playerProgress: {
    targets: {
      workspace: '.player-scroll-container',
      routeShell: '[data-testid="player-profile-workspace"]',
      contentRail: '[data-testid="player-progress-story"]',
      titleStage: '[data-testid="player-progress-team-title"]',
      primaryRegion: '[data-testid="player-progress-story-hero"]',
    },
    centered: ['routeShell', 'contentRail', 'titleStage'],
  },
};

const ROUTES = {
  home: { key: 'home' },
  players: { key: 'players', readyTestId: 'coach-players-interactive-dashboard', geometry: GEOMETRY.coachPlayers },
  events: { key: 'events', readyTestId: 'coach-events-interactive-dashboard', geometry: GEOMETRY.coachEvents },
  profile: { key: 'profile', readyTestId: 'player-profile-workspace', geometry: GEOMETRY.playerProgress },
};

const fulfill = (route, body, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

async function installSignedCollectionRoute(page, pattern, fixture, responseFields) {
  await page.route(pattern, async (route) => {
    const method = route.request().method().toUpperCase();
    let posted = {};
    if (method !== 'GET') {
      try { posted = route.request().postDataJSON() || {}; } catch {}
    }
    const body = { ok: true, storage_mode: 'phase1c_seed', team_id: PHASE1B_TEAM_ID };
    for (const [field, storageKey] of Object.entries(responseFields)) {
      const seededRows = fixture.storage[storageKey] || [];
      body[field] = method === 'GET'
        ? seededRows
        : Array.isArray(posted?.[field]) ? posted[field] : seededRows;
    }
    if (method === 'DELETE') body.deleted_count = 0;
    await fulfill(route, body);
  });
}

async function installPhase1CRoutes(page, fixture) {
  const profile = {
    email: fixture.identity.email,
    name: fixture.identity.name,
    role: fixture.role,
    team_id: PHASE1B_TEAM_ID,
    teamId: PHASE1B_TEAM_ID,
    hide_from_leaderboards: fixture.role === 'coach',
  };
  await page.route('**/v1/legacy-auth/restore', (route) => fulfill(route, { ok: true, profile }));
  await page.route('**/v1/teams/restore-context', (route) => fulfill(route, { ok: true, team: fixture.team }));
  await page.route('**/v1/season-archives**', (route) => fulfill(route, { ok: true, archives: [] }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => fulfill(route, { team_id: PHASE1B_TEAM_ID, scope: 'players', count: 0, leaderboard: [] }));
  await page.route('**/v1/coach/players/provision**', (route) => fulfill(route, { ok: true, invitations: [] }));
  await page.route('**/v1/coach-follow-ups**', (route) => fulfill(route, {
    ok: true,
    storage_mode: 'team_remote',
    team_id: PHASE1B_TEAM_ID,
    follow_ups: [],
  }));
  await page.route('**/v1/coach/activity/first-results**', (route) => fulfill(route, {
    ok: true,
    team_id: PHASE1B_TEAM_ID,
    count: 0,
    results: [],
  }));
  await page.route('**/v1/player-assignments**', (route) => fulfill(route, {
    ok: true,
    storage_mode: 'team_remote',
    team_id: PHASE1B_TEAM_ID,
    assignments: [],
  }));
  await page.route('**/v1/player-assignment-history**', (route) => fulfill(route, {
    ok: true,
    storage_mode: 'team_remote',
    team_id: PHASE1B_TEAM_ID,
    history: [],
  }));
  await page.route('**/v1/team-priorities**', (route) => fulfill(route, {
    ok: true,
    storage_mode: 'team_remote',
    priorities_by_team: {},
  }));

  await installSignedCollectionRoute(page, /\/v1\/teams(?:\?.*)?$/, fixture, { teams: 'sl:teams' });
  await installSignedCollectionRoute(page, /\/v1\/players(?:\?.*)?$/, fixture, { players: 'sl:players' });
  await installSignedCollectionRoute(page, /\/v1\/player-profiles(?:\?.*)?$/, fixture, { profiles: 'sl:player-profiles' });
  await installSignedCollectionRoute(page, /\/v1\/scores(?:\?.*)?$/, fixture, { scores: 'sl:scores' });
  await installSignedCollectionRoute(page, /\/v1\/program-scores(?:\?.*)?$/, fixture, { program_scores: 'sl:program-scores' });
  await installSignedCollectionRoute(page, /\/v1\/shot-logs(?:\?.*)?$/, fixture, { shot_logs: 'sl:shotlogs' });
  await installSignedCollectionRoute(page, /\/v1\/events(?:\?.*)?$/, fixture, { events: 'sl:events' });
  await installSignedCollectionRoute(page, /\/v1\/rsvps(?:\?.*)?$/, fixture, { rsvps: 'sl:rsvps' });
  await installSignedCollectionRoute(page, /\/v1\/strength-conditioning(?:\?.*)?$/, fixture, {
    sessions: 'sl:sc-sessions',
    rsvps: 'sl:sc-rsvps',
    logs: 'sl:sc-logs',
  });

  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    const method = route.request().method().toUpperCase();
    if (method === 'GET') {
      await fulfill(route, []);
      return;
    }
    let posted = [];
    try { posted = route.request().postDataJSON() || []; } catch {}
    await fulfill(route, posted);
  });
}

async function replaceDemoCollections(page, fixture) {
  await page.evaluate(({ storage }) => {
    const keys = [
      'sl:teams', 'sl:players', 'sl:player-profiles', 'sl:scores', 'sl:program-scores', 'sl:shotlogs',
      'sl:events', 'sl:rsvps', 'sl:sc-sessions', 'sl:sc-rsvps', 'sl:sc-logs', 'sl:challenges',
      'sl:season-archives', 'sl:team-stores', 'sl:session',
    ];
    for (const key of keys) window.localStorage.removeItem(key);
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem('sl:demoMode', JSON.stringify(true));
    window.sessionStorage.setItem('sl:demoMode', JSON.stringify(true));
  }, { storage: fixture.storage });
}

async function createSession(browser, { role, scenario, mode, width }) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT },
    screen: { width, height: HEIGHT },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await installPhase1CFixedTime(page);
  const guard = attachPhase1CRuntimeGuard(page, `${role}-${scenario}-${mode}-${width}`);
  const fixture = buildPhase1BFixture({ role, scenario, mode });
  await installPhase1CRoutes(page, fixture);

  if (mode === 'demo') {
    await page.goto('/?demo=1');
    const demoButton = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
    await expect(demoButton).toBeVisible({ timeout: 20_000 });
    await demoButton.click();
    await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
    await replaceDemoCollections(page, fixture);
    await page.reload();
  } else if (role === 'coach') {
    await enterSeededRegisteredCoach(page, {
      storage: fixture.storage,
      coachEmail: fixture.identity.email,
      coachName: fixture.identity.name,
      teamId: PHASE1B_TEAM_ID,
      team: fixture.team,
    });
  } else {
    await enterSeededRegisteredPlayer(page, {
      storage: fixture.storage,
      playerEmail: fixture.identity.email,
      playerName: fixture.identity.name,
      teamId: PHASE1B_TEAM_ID,
      team: fixture.team,
      readyTestId: 'player-daily-command-center',
    });
  }

  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  return { context, page, guard };
}

async function navigate(page, route) {
  if (route.key === 'home') return;
  const direct = page.getByTestId('mobile-navigation-dock').locator(`[data-nav-key="${route.key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId('mobile-navigation-more').click();
    const sheet = page.getByTestId('mobile-navigation-sheet');
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await sheet.locator(`[data-nav-key="${route.key}"]`).click();
  }
  await expect(page.getByTestId(route.readyTestId)).toBeVisible({ timeout: 20_000 });
}

async function runSurface(browser, surface) {
  const session = await createSession(browser, surface);
  try {
    const route = ROUTES[surface.route];
    await navigate(session.page, route);
    const geometry = surface.route === 'home'
      ? (surface.role === 'coach' ? GEOMETRY.coachHome : GEOMETRY.playerHome)
      : route.geometry;
    await capturePhase1CSnapshot(session.page, session.guard, surface.name, { geometry });
  } finally {
    await session.context.close();
  }
}

test('login entry is visually locked at 390px and runtime-clean', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: HEIGHT }, screen: { width: 390, height: HEIGHT }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await installPhase1CFixedTime(page);
  const guard = attachPhase1CRuntimeGuard(page, 'login-390');
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => fulfill(route, []));
  try {
    await page.goto('/?demo=1');
    await expect(page.getByRole('button', { name: 'Coach demo', exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Player demo', exact: true })).toBeVisible({ timeout: 20_000 });
    const authShell = page.getByTestId('auth-workspace').locator(':scope > .fade-up');
    await expect(authShell, 'login visual authority must reach its final visible state before capture').toHaveCSS('opacity', '1', { timeout: 20_000 });
    await expect(authShell, 'login entrance transform must settle before capture').toHaveCSS('transform', 'none', { timeout: 20_000 });
    await capturePhase1CSnapshot(page, guard, 'login-390');
  } finally {
    await context.close();
  }
});

const SURFACES = [
  { name: 'coach-mission-control-demo-empty-390', role: 'coach', scenario: 'empty', mode: 'demo', width: 390, route: 'home' },
  { name: 'coach-mission-control-registered-empty-390', role: 'coach', scenario: 'empty', mode: 'registered', width: 390, route: 'home' },
  { name: 'coach-players-registered-populated-390', role: 'coach', scenario: 'populated', mode: 'registered', width: 390, route: 'players' },
  { name: 'coach-events-registered-populated-390', role: 'coach', scenario: 'populated', mode: 'registered', width: 390, route: 'events' },
  { name: 'player-home-registered-populated-390', role: 'player', scenario: 'populated', mode: 'registered', width: 390, route: 'home' },
  { name: 'player-progress-registered-populated-390', role: 'player', scenario: 'populated', mode: 'registered', width: 390, route: 'profile' },
  { name: 'coach-home-branding-stress-390', role: 'coach', scenario: 'stress', mode: 'registered', width: 390, route: 'home' },
  { name: 'player-home-branding-stress-390', role: 'player', scenario: 'stress', mode: 'registered', width: 390, route: 'home' },
  { name: 'coach-home-edge-320', role: 'coach', scenario: 'populated', mode: 'registered', width: 320, route: 'home' },
  { name: 'coach-home-edge-430', role: 'coach', scenario: 'populated', mode: 'registered', width: 430, route: 'home' },
  { name: 'player-home-edge-320', role: 'player', scenario: 'populated', mode: 'registered', width: 320, route: 'home' },
  { name: 'player-home-edge-430', role: 'player', scenario: 'populated', mode: 'registered', width: 430, route: 'home' },
];

for (const surface of SURFACES) {
  test(`${surface.name} focused visual/runtime contract`, async ({ browser }) => {
    await runSurface(browser, surface);
  });
}
