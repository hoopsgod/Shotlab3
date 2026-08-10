import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2d-empty-state-language');
const TEAM_ID = 'team-phase-2d';
const COACH_EMAIL = 'coach.demo@shotlab.app';

const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const players = [
  { id: 'coach-phase-2d', email: COACH_EMAIL, name: 'Demo Coach', role: 'coach', isCoach: true, teamId: TEAM_ID },
  { id: 'active-player', playerId: 'active-player', email: 'active@example.com', name: 'Active Player', role: 'player', teamId: TEAM_ID },
  { id: 'quiet-player', playerId: 'quiet-player', email: 'quiet@example.com', name: 'Quiet Player', role: 'player', teamId: TEAM_ID },
  { id: 'new-player', playerId: 'new-player', email: 'new@example.com', name: 'New Player', role: 'player', teamId: TEAM_ID },
];

const seedData = {
  'sl:teams': [{
    id: TEAM_ID,
    name: 'Phase 2D Team',
    ownerCoachId: COACH_EMAIL,
    joinCode: 'P2D26',
    createdAt: 1_780_000_000_000,
    branding: {
      name: 'Phase 2D Team',
      shortName: 'P2D',
      wordmark: 'PHASE 2D TEAM',
      primaryColor: '#C8FF1A',
      secondaryColor: '#0F1715',
      accentColor: '#C8FF1A',
      textOnPrimary: '#071007',
      logoUrl: '/branding/titans-exact-logo.png.PNG',
      logoMarkUrl: '/branding/titans-default-mark.svg',
      textScale: 'standard',
      version: 1,
    },
  }],
  'sl:players': players,
  'sl:player-profiles': players.filter((player) => player.role === 'player').map((player) => ({
    id: `profile-${player.id}`,
    userId: player.email,
    email: player.email,
    teamId: TEAM_ID,
    firstName: player.name.split(' ')[0],
    lastName: player.name.split(' ')[1],
  })),
  'sl:drills': [{ id: 'demo-home-form-shooting', name: 'Form Shooting', desc: 'Mechanics', max: 50, icon: 'ft' }],
  'sl:program-drills': [],
  'sl:scores': [
    { id: 'score-active', email: 'active@example.com', name: 'Active Player', teamId: TEAM_ID, drillId: 'demo-home-form-shooting', score: 40, src: 'home', date: dateOffset(0) },
    { id: 'score-quiet', email: 'quiet@example.com', name: 'Quiet Player', teamId: TEAM_ID, drillId: 'demo-home-form-shooting', score: 20, src: 'home', date: dateOffset(-30) },
  ],
  'sl:program-scores': [],
  'sl:shotlogs': [
    { id: 'shot-active', playerId: 'active-player', email: 'active@example.com', name: 'Active Player', teamId: TEAM_ID, made: 85, attempted_shots: 120, date: dateOffset(0), sessionId: 'active-session' },
  ],
  'sl:events': [{ id: 'event-practice', teamId: TEAM_ID, title: 'Team Practice', type: 'run', date: dateOffset(1), time: '6:00 PM', location: 'Main Gym', desc: 'Team practice' }],
  'sl:rsvps': players.filter((player) => player.role === 'player').map((player) => ({ id: `rsvp-${player.id}`, eventId: 'event-practice', email: player.email, name: player.name, teamId: TEAM_ID })),
  'sl:sc-sessions': [],
  'sl:sc-rsvps': [],
  'sl:sc-logs': [],
  'sl:season-archives': [],
};

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterCoach(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem('phase-2d-seeded') === '1') return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem('phase-2d-seeded', '1');
  }, seedData);
  await page.goto('/');
  await page.getByRole('button', { name: 'Coach demo', exact: true }).click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });
}

async function openMoreDestination(page, key) {
  await page.getByTestId('mobile-navigation-more').click();
  const sheet = page.getByTestId('mobile-navigation-sheet');
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(sheet).toHaveCount(0);
}

async function expectPhoneSafe(page) {
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function capture(page, name, locator) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  await expectPhoneSafe(page);
  await locator.screenshot({ path: path.join(outputDir, `${name}.png`), animations: 'disabled' });
}

async function stateMetrics(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    const before = getComputedStyle(node, '::before');
    const after = getComputedStyle(node, '::after');
    return {
      display: style.display,
      gridColumns: style.gridTemplateColumns,
      borderTopStyle: style.borderTopStyle,
      borderLeftStyle: style.borderLeftStyle,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      textAlign: style.textAlign,
      height: node.getBoundingClientRect().height,
      backgroundColor: style.backgroundColor,
      color: style.color,
      beforeMask: before.getPropertyValue('mask-image') || before.getPropertyValue('-webkit-mask-image'),
      beforeWidth: Number.parseFloat(before.width),
      railWidth: Number.parseFloat(after.width),
    };
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test('Leaderboard no-results state uses the quiet Phase 2D operational language', async ({ page }) => {
  await enterCoach(page);
  await openMoreDestination(page, 'leaderboards');
  const panel = page.getByTestId('coach-leaderboard-operational-panel');
  await expect(panel).toBeVisible({ timeout: 20_000 });

  await panel.getByRole('searchbox').fill('NO_MATCH_PHASE_2D_999');
  const state = panel.getByText('No leaderboard players match the selected view.', { exact: true });
  await expect(state).toBeVisible();
  const metrics = await stateMetrics(state);

  expect(metrics.display).toBe('grid');
  expect(metrics.gridColumns).toContain('36px');
  expect(metrics.borderTopStyle).toBe('solid');
  expect(metrics.borderLeftStyle).toBe('none');
  expect(metrics.radius).toBe(0);
  expect(metrics.textAlign).toBe('left');
  expect(metrics.height).toBeGreaterThanOrEqual(88);
  expect(metrics.backgroundColor).toBe('rgb(247, 248, 242)');
  expect(metrics.color).toBe('rgb(65, 75, 68)');
  expect(metrics.beforeMask).not.toBe('none');
  expect(metrics.beforeMask).not.toBe('');
  expect(metrics.beforeWidth).toBeGreaterThanOrEqual(35);
  expect(metrics.railWidth).toBeGreaterThanOrEqual(2);

  await capture(page, '01-leaderboard-empty-state', state);
});

test('Player Intelligence no-activity state keeps the same premium language on the dark drawer', async ({ page }) => {
  await enterCoach(page);
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

  const roster = page.locator('#coach-roster-operations');
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const newPlayerName = roster.getByText('New Player', { exact: true }).first();
  await expect(newPlayerName).toBeVisible({ timeout: 10_000 });
  const newPlayerRow = newPlayerName.locator('xpath=ancestor::*[@role="button"][1]');
  await expect(newPlayerRow).toBeVisible();
  await newPlayerRow.click({ position: { x: 18, y: 18 } });

  const drawer = page.getByTestId('coach-player-intelligence-drawer');
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  const state = drawer.getByText('No player activity has been recorded yet.', { exact: true });
  await expect(state).toBeVisible({ timeout: 10_000 });
  const metrics = await stateMetrics(state);

  expect(metrics.display).toBe('grid');
  expect(metrics.gridColumns).toContain('36px');
  expect(metrics.borderTopStyle).toBe('solid');
  expect(metrics.borderLeftStyle).toBe('none');
  expect(metrics.radius).toBe(0);
  expect(metrics.textAlign).toBe('left');
  expect(metrics.height).toBeGreaterThanOrEqual(88);
  expect(metrics.backgroundColor).toBe('rgb(16, 21, 19)');
  expect(metrics.color).toBe('rgb(199, 208, 203)');
  expect(metrics.beforeMask).not.toBe('none');
  expect(metrics.beforeMask).not.toBe('');
  expect(metrics.beforeWidth).toBeGreaterThanOrEqual(35);

  await capture(page, '02-player-drawer-no-activity-state', state);
});
