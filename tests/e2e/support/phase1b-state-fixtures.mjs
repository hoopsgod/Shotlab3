import { expect } from '@playwright/test';
import { enterSeededRegisteredCoach, enterSeededRegisteredPlayer } from '../registered-coach-fixture.mjs';

export const PHASE1B_TEAM_ID = 'team-phase1b-parity';

export const PHASE1B_IDENTITIES = {
  demo: {
    coach: { email: 'coach.demo@shotlab.app', name: 'Parity Coach', role: 'coach' },
    player: { email: 'demo@shotlab.app', name: 'Parity Player', role: 'player' },
  },
  registered: {
    coach: { email: 'phase1b.coach@shotlab.test', name: 'Parity Coach', role: 'coach' },
    player: { email: 'phase1b.player@shotlab.test', name: 'Parity Player', role: 'player' },
  },
};

const STANDARD_LOGO = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="24" fill="#071820"/>
  <path d="M30 32h60v14H68v44H52V46H30Z" fill="#c8ff1a"/>
</svg>`)} ` .trim();

const STRESS_LOGO = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 72">
  <path d="M4 4h352v64H4z" rx="8" fill="#f3efe4" stroke="#06141b" stroke-width="8"/>
  <circle cx="43" cy="36" r="22" fill="#06141b"/>
  <path d="M83 20h248v10H83zm0 22h205v10H83z" fill="#ff4fd8"/>
</svg>`)} ` .trim();

const SCENARIO_META = {
  populated: { label: 'populated', stress: false },
  empty: { label: 'empty-onboarding', stress: false },
  firstUse: { label: 'first-use', stress: false },
  stress: { label: 'branding-stress', stress: true },
};

function teamForScenario(scenario, mode) {
  const stress = scenario === 'stress';
  const teamName = stress
    ? 'North Atlantic Metropolitan Basketball Academy — Varsity Development Collective 2026'
    : 'Phase 1B Parity Team';
  const logoUrl = scenario === 'empty' ? '' : (stress ? STRESS_LOGO : STANDARD_LOGO);
  return {
    id: PHASE1B_TEAM_ID,
    name: teamName,
    teamName,
    ownerCoachId: PHASE1B_IDENTITIES[mode].coach.email,
    joinCode: 'P1B26',
    createdAt: 1_780_000_000_000,
    logoUrl,
    logoMarkUrl: logoUrl,
    primaryColor: stress ? '#f3efe4' : '#071820',
    secondaryColor: stress ? '#06141b' : '#9ca3af',
    accentColor: stress ? '#ff4fd8' : '#c8ff1a',
    branding: {
      teamName,
      logoUrl,
      logoMarkUrl: logoUrl,
      primaryColor: stress ? '#f3efe4' : '#071820',
      secondaryColor: stress ? '#06141b' : '#9ca3af',
      accentColor: stress ? '#ff4fd8' : '#c8ff1a',
    },
  };
}

function replaceIdentity(value, fromEmail, toEmail) {
  if (Array.isArray(value)) return value.map((entry) => replaceIdentity(entry, fromEmail, toEmail));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceIdentity(entry, fromEmail, toEmail)]));
  }
  if (typeof value === 'string') return value.split(fromEmail).join(toEmail);
  return value;
}

export function buildPhase1BFixture({ role, scenario, mode }) {
  if (!['coach', 'player'].includes(role)) throw new Error(`Unsupported Phase 1B role: ${role}`);
  if (!SCENARIO_META[scenario]) throw new Error(`Unsupported Phase 1B scenario: ${scenario}`);
  if (!['demo', 'registered'].includes(mode)) throw new Error(`Unsupported Phase 1B mode: ${mode}`);

  const identity = PHASE1B_IDENTITIES[mode][role];
  const canonicalDemoIdentity = PHASE1B_IDENTITIES.demo[role];
  const team = teamForScenario(scenario, mode);
  const coachEmail = role === 'coach' ? identity.email : PHASE1B_IDENTITIES[mode].coach.email;
  const playerEmail = role === 'player' ? identity.email : PHASE1B_IDENTITIES[mode].player.email;
  const coach = {
    id: `${mode}-phase1b-coach`, email: coachEmail, name: 'Parity Coach', role: 'coach', isCoach: true,
    teamId: PHASE1B_TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_001,
  };
  const player = {
    id: `${mode}-phase1b-player`, email: playerEmail, name: 'Parity Player', role: 'player', isCoach: false,
    teamId: PHASE1B_TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_002,
  };
  const teammate = {
    id: `${mode}-phase1b-teammate`, email: `phase1b.teammate.${mode}@shotlab.test`, name: 'Jordan Longlastname', role: 'player', isCoach: false,
    teamId: PHASE1B_TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_003,
  };

  const hasTeamData = scenario === 'populated' || scenario === 'stress';
  const players = role === 'coach'
    ? [coach, ...(hasTeamData ? [player, teammate] : [])]
    : [coach, player, ...(hasTeamData ? [teammate] : [])];
  const profiles = role === 'player' || hasTeamData ? [
    { id: `${mode}-phase1b-profile`, userId: playerEmail, teamId: PHASE1B_TEAM_ID, firstName: 'Parity', lastName: 'Player', jerseyNumber: '12' },
  ] : [];
  const scores = hasTeamData ? [
    { id: `${mode}-score-1`, email: playerEmail, playerId: playerEmail, name: 'Parity Player', teamId: PHASE1B_TEAM_ID, drillId: 'form-shooting', score: 18, makes: 18, date: '2026-08-30', src: 'home' },
    { id: `${mode}-score-2`, email: teammate.email, playerId: teammate.email, name: teammate.name, teamId: PHASE1B_TEAM_ID, drillId: 'form-shooting', score: 14, makes: 14, date: '2026-08-29', src: 'home' },
  ] : [];
  const shotlogs = hasTeamData ? [
    { id: `${mode}-shot-1`, email: playerEmail, playerId: playerEmail, name: 'Parity Player', teamId: PHASE1B_TEAM_ID, made: 75, attempted: 100, date: '2026-08-30', syncState: mode === 'demo' ? 'local_pending' : 'remote_saved', syncSource: mode === 'demo' ? 'local' : 'remote', demo: mode === 'demo' },
  ] : [];
  const events = hasTeamData ? [
    { id: `${mode}-event-1`, teamId: PHASE1B_TEAM_ID, title: 'Team Practice', date: '2026-09-03', time: '6:00 PM', location: 'Main Gym', type: 'practice' },
  ] : [];

  const storage = {
    'sl:session': { email: identity.email, name: identity.name, role: identity.role, teamId: PHASE1B_TEAM_ID },
    'sl:teams': [team],
    'sl:players': players,
    'sl:player-profiles': profiles,
    'sl:scores': scores,
    'sl:program-scores': [],
    'sl:shotlogs': shotlogs,
    'sl:events': events,
    'sl:rsvps': [],
    'sl:sc-sessions': [],
    'sl:sc-rsvps': [],
    'sl:sc-logs': [],
    'sl:challenges': [],
    'sl:season-archives': [],
    'sl:team-stores': [],
  };

  if (mode === 'registered') {
    for (const [key, value] of Object.entries(storage)) {
      storage[key] = replaceIdentity(value, canonicalDemoIdentity.email, identity.email);
    }
  }

  return {
    role,
    scenario,
    stateLabel: SCENARIO_META[scenario].label,
    identity,
    team,
    storage,
  };
}

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function installSafeRoutes(page, fixture) {
  const { role, identity, team } = fixture;
  const profile = {
    email: identity.email,
    name: identity.name,
    role,
    team_id: PHASE1B_TEAM_ID,
    teamId: PHASE1B_TEAM_ID,
    hide_from_leaderboards: role === 'coach',
  };
  const signedEvents = (fixture.storage['sl:events'] || []).map((event) => ({
    id: event.id,
    team_id: event.teamId || event.team_id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    description: event.desc || event.description || '',
    type: event.type,
  }));
  await page.route('**/v1/legacy-auth/restore', (route) => fulfillJson(route, { ok: true, profile }));
  await page.route('**/v1/teams/restore-context', (route) => fulfillJson(route, { ok: true, team }));
  await page.route('**/v1/events**', (route) => fulfillJson(route, { ok: true, storage_mode: 'signed_api', events: signedEvents }));
  await page.route('**/v1/season-archives', (route) => fulfillJson(route, { ok: true, archives: [] }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => fulfillJson(route, { leaderboard: [] }));
  await page.route('**/v1/coach/players/provision**', (route) => fulfillJson(route, { ok: true, invitations: [] }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    const method = route.request().method().toUpperCase();
    await fulfillJson(route, method === 'GET' ? [] : {});
  });
}

async function replaceDemoCollections(page, fixture) {
  await page.evaluate(({ storage }) => {
    const collectionKeys = [
      'sl:teams', 'sl:players', 'sl:player-profiles', 'sl:scores', 'sl:program-scores', 'sl:shotlogs',
      'sl:events', 'sl:rsvps', 'sl:sc-sessions', 'sl:sc-rsvps', 'sl:sc-logs', 'sl:challenges',
      'sl:season-archives', 'sl:team-stores', 'sl:session',
    ];
    for (const key of collectionKeys) window.localStorage.removeItem(key);
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem('sl:demoMode', JSON.stringify(true));
    window.sessionStorage.setItem('sl:demoMode', JSON.stringify(true));
  }, { storage: fixture.storage });
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? image.decode?.().catch(() => {}) : Promise.resolve()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

export async function enterPhase1BSession(browser, { role, scenario, mode }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  const fixture = buildPhase1BFixture({ role, scenario, mode });
  await installSafeRoutes(page, fixture);

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
  await settle(page);
  return { context, page, fixture };
}
