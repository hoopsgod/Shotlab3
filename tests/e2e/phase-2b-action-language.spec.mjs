import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2b-action-language');
const TEAM_ID = 'team-phase-2b';
const COACH_EMAIL = 'coach.demo@shotlab.app';

const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const seedData = {
  'sl:teams': [{
    id: TEAM_ID,
    name: 'Phase 2B Team',
    ownerCoachId: COACH_EMAIL,
    joinCode: 'P2B26',
    createdAt: 1_750_000_000_000,
    branding: {
      name: 'Phase 2B Team',
      shortName: 'P2B',
      wordmark: 'PHASE 2B TEAM',
      primaryColor: '#C8FF1A',
      secondaryColor: '#77D7FF',
      accentColor: '#C8FF1A',
      textOnPrimary: '#071007',
      logoUrl: '/branding/titans-exact-logo.png.PNG',
      logoMarkUrl: '/branding/titans-default-mark.svg',
      textScale: 'standard',
      version: 1,
    },
  }],
  'sl:players': [
    { id: 'coach-phase-2b', email: COACH_EMAIL, name: 'Demo Coach', role: 'coach', isCoach: true, teamId: TEAM_ID },
    { id: 'active-player', playerId: 'active-player', email: 'active@example.com', name: 'Active Player', role: 'player', teamId: TEAM_ID },
    { id: 'quiet-player', playerId: 'quiet-player', email: 'quiet@example.com', name: 'Quiet Player', role: 'player', teamId: TEAM_ID },
    { id: 'new-player', playerId: 'new-player', email: 'new@example.com', name: 'New Player', role: 'player', teamId: TEAM_ID },
  ],
  'sl:player-profiles': [
    { id: 'profile-active', userId: 'active@example.com', email: 'active@example.com', teamId: TEAM_ID, firstName: 'Active', lastName: 'Player' },
    { id: 'profile-quiet', userId: 'quiet@example.com', email: 'quiet@example.com', teamId: TEAM_ID, firstName: 'Quiet', lastName: 'Player' },
    { id: 'profile-new', userId: 'new@example.com', email: 'new@example.com', teamId: TEAM_ID, firstName: 'New', lastName: 'Player' },
  ],
  'sl:drills': [{ id: 'demo-home-form-shooting', name: 'Form Shooting', desc: 'Mechanics', max: 50, icon: 'ft' }],
  'sl:program-drills': [],
  'sl:scores': [
    { id: 'score-active', email: 'active@example.com', name: 'Active Player', teamId: TEAM_ID, drillId: 'demo-home-form-shooting', score: 40, src: 'home', date: dateOffset(0) },
    { id: 'score-quiet', email: 'quiet@example.com', name: 'Quiet Player', teamId: TEAM_ID, drillId: 'demo-home-form-shooting', score: 20, src: 'home', date: dateOffset(-30) },
  ],
  'sl:program-scores': [],
  'sl:shotlogs': [
    { id: 'shot-active', playerId: 'active-player', email: 'active@example.com', name: 'Active Player', teamId: TEAM_ID, made: 85, attempted_shots: 120, date: dateOffset(0), sessionId: 'active-session' },
    { id: 'shot-quiet', playerId: 'quiet-player', email: 'quiet@example.com', name: 'Quiet Player', teamId: TEAM_ID, made: 25, attempted_shots: 50, date: dateOffset(-30), sessionId: 'quiet-session' },
  ],
  'sl:events': [
    { id: 'event-practice', teamId: TEAM_ID, title: 'Team Practice', type: 'run', date: dateOffset(1), time: '6:00 PM', location: 'Main Gym', desc: 'Team practice' },
    { id: 'event-game', teamId: TEAM_ID, title: 'Summer Game', type: 'game', date: dateOffset(5), time: '7:00 PM', location: 'Field House', desc: 'Summer game' },
  ],
  'sl:rsvps': [{ id: 'rsvp-active', eventId: 'event-practice', email: 'active@example.com', name: 'Active Player', teamId: TEAM_ID }],
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
    if (window.sessionStorage.getItem('phase-2b-seeded') === '1') return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem('phase-2b-seeded', '1');
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

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: 'disabled' });
}

function pseudoMask(style) {
  return style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image');
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test('Event Intelligence drawer uses premium icon-text actions with a 50px+ mobile target', async ({ page }) => {
  await enterCoach(page);
  await page.getByRole('button', { name: /Open Coach Inbox/i }).click();
  const inbox = page.getByRole('dialog', { name: 'Coach Inbox' });
  await inbox.getByRole('button', { name: /Event readiness Team Practice/i }).click();

  const drawer = page.getByTestId('coach-event-intelligence-drawer');
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  const primary = drawer.getByRole('button', { name: 'Manage Attendance', exact: true });
  const secondary = drawer.getByRole('button', { name: 'Open Schedule', exact: true });
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();

  for (const action of [primary, secondary]) {
    const metrics = await action.evaluate((node) => {
      const style = getComputedStyle(node);
      const before = getComputedStyle(node, '::before');
      const after = getComputedStyle(node, '::after');
      return {
        height: node.getBoundingClientRect().height,
        radius: Number.parseFloat(style.borderTopLeftRadius),
        textTransform: style.textTransform,
        beforeMask: before.getPropertyValue('mask-image') || before.getPropertyValue('-webkit-mask-image'),
        afterContent: after.content,
      };
    });
    expect(metrics.height).toBeGreaterThanOrEqual(50);
    expect(metrics.radius).toBeGreaterThanOrEqual(14);
    expect(metrics.textTransform).toBe('none');
    expect(metrics.beforeMask).not.toBe('none');
    expect(metrics.beforeMask).not.toBe('');
    expect(metrics.afterContent).toContain('→');
  }

  const primaryBackground = await primary.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(primaryBackground).toBe('rgb(200, 255, 26)');
  await capture(page, '01-event-drawer-premium-actions');
});

test('Leaderboard no-results state uses the purpose-built light empty-state language', async ({ page }) => {
  await enterCoach(page);
  await openMoreDestination(page, 'leaderboards');
  const panel = page.getByTestId('coach-leaderboard-operational-panel');
  await expect(panel).toBeVisible({ timeout: 20_000 });

  const search = panel.getByRole('searchbox');
  await search.fill('NO_MATCH_PHASE_2B_999');
  const message = panel.getByText('No leaderboard players match the selected view.', { exact: true });
  await expect(message).toBeVisible();
  const emptyState = message.locator('xpath=..');

  const metrics = await emptyState.evaluate((node) => {
    const style = getComputedStyle(node);
    const before = getComputedStyle(node, '::before');
    return {
      display: style.display,
      borderStyle: style.borderTopStyle,
      textAlign: style.textAlign,
      height: node.getBoundingClientRect().height,
      beforeMask: before.getPropertyValue('mask-image') || before.getPropertyValue('-webkit-mask-image'),
      beforeWidth: Number.parseFloat(before.width),
    };
  });
  expect(metrics.display).toBe('flex');
  expect(metrics.borderStyle).toBe('solid');
  expect(metrics.textAlign).toBe('left');
  expect(metrics.height).toBeGreaterThanOrEqual(88);
  expect(metrics.beforeMask).not.toBe('none');
  expect(metrics.beforeMask).not.toBe('');
  expect(metrics.beforeWidth).toBeGreaterThanOrEqual(35);
  await capture(page, '02-leaderboard-premium-empty-state');
});
