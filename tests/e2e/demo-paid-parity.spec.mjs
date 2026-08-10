import { test, expect } from '@playwright/test';
import DEFAULT_BRANDING from '../../src/theme/brandingDefaults.js';
import { buildDemoDataBundle } from '../../src/lib/demoData.js';

const PAID_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-parity-2026';
const TEAM_NAME = 'Demo Team';

const PAID_IDENTITIES = {
  coach: { id: '11111111-1111-4111-8111-111111111111', email: 'paid.coach@shotlab.app', name: 'Demo Coach', role: 'coach', isCoach: true },
  player: { id: '22222222-2222-4222-8222-222222222222', email: 'paid.player@shotlab.app', name: 'Demo Player', role: 'player', isCoach: false },
};

const REQUIRED_NAV_KEYS = {
  coach: ['feed', 'players', 'events', 'leaderboards'],
  player: ['home', 'log-drill', 'profile', 'program', 'leaderboards', 'team-store'],
};

const FINGERPRINT_STYLE_PROPERTIES = [
  'display', 'position', 'visibility', 'opacity', 'boxSizing',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'gap', 'rowGap', 'columnGap', 'gridTemplateColumns', 'gridTemplateRows',
  'flexDirection', 'flexWrap', 'justifyContent', 'alignItems',
  'overflow', 'overflowX', 'overflowY',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textAlign', 'textTransform', 'color', 'backgroundColor', 'backgroundImage',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderRadius', 'boxShadow', 'transform',
];

function replacePrimaryPlayerIdentity(bundle, identity) {
  const demoEmail = 'demo@shotlab.app';
  const remap = (rows = []) => rows.map((row) => {
    const next = { ...row };
    for (const key of ['email', 'playerId', 'player_id', 'userId', 'user_id']) {
      if (String(next[key] || '').toLowerCase() === demoEmail) next[key] = identity.email;
    }
    return next;
  });

  return {
    ...bundle,
    players: remap(bundle.players),
    playerProfiles: remap(bundle.playerProfiles),
    events: remap(bundle.events),
    rsvps: remap(bundle.rsvps),
    scores: remap(bundle.scores),
    shotLogs: remap(bundle.shotLogs),
    progressSnapshots: remap(bundle.progressSnapshots),
  };
}

function paidSeed(role) {
  const current = PAID_IDENTITIES[role];
  const coach = PAID_IDENTITIES.coach;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const team = {
    id: TEAM_ID,
    name: TEAM_NAME,
    ownerCoachId: coach.email,
    joinCode: 'ABC234',
    joinCodeUpdatedAt: Date.now(),
    createdAt: Date.now() - 30_000,
    branding: DEFAULT_BRANDING,
  };

  let bundle = buildDemoDataBundle({ teamId: TEAM_ID, coachEmail: coach.email, team });
  if (role === 'player') bundle = replacePrimaryPlayerIdentity(bundle, current);

  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    team,
    storage: {
      'sl:supabase-session': {
        access_token: `paid-${role}-token`,
        refresh_token: `paid-${role}-refresh`,
        expires_at: nowSeconds + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: current.id, email: current.email },
      },
      'sl:supabase-access-token': `paid-${role}-token`,
      'sl:session': { email: current.email },
      'sl:teams': bundle.teams,
      'sl:players': bundle.players,
      'sl:player-profiles': bundle.playerProfiles,
      'sl:scores': bundle.scores,
      'sl:program-scores': [],
      'sl:shotlogs': bundle.shotLogs,
      'sl:progress-snapshots': bundle.progressSnapshots,
      'sl:events': bundle.events,
      'sl:rsvps': bundle.rsvps,
      'sl:sc-sessions': [],
      'sl:sc-rsvps': [],
      'sl:sc-logs': [],
      'sl:season-archives': [],
      'sl:team-stores': [],
    },
  };
}

async function installSharedRoutes(target, paidSeedState = null) {
  const paidUser = paidSeedState?.user || null;
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${PAID_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paidUser || {}) }));
  await target.route(`${PAID_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  if (paidUser?.email) {
    const role = Object.keys(PAID_IDENTITIES).find((key) => PAID_IDENTITIES[key].email === paidUser.email);
    const identity = role ? PAID_IDENTITIES[role] : null;
    const legacyProfile = identity ? {
      email: identity.email,
      name: identity.name,
      role: identity.role,
      team_id: TEAM_ID,
      hide_from_leaderboards: role === 'coach',
    } : null;

    await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({
      status: legacyProfile ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(legacyProfile ? { ok: true, profile: legacyProfile } : { error: 'profile_not_found' }),
    }));
    await target.route('**/v1/teams/restore-context', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, team: paidSeedState.team }),
    }));
  }
}

async function seedPaidSession(context, role) {
  const seed = paidSeed(role);
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { storage: seed.storage });
  await installSharedRoutes(context, seed);
}

async function normalizeDynamicIdentityText(page) {
  await page.evaluate(({ emails }) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue || '';
      for (const email of emails) value = value.split(email).join('parity.user@shotlab.app');
      value = value.replace(/\b[A-HJ-NP-Z2-9]{6}\b/g, 'ABC234');
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  }, {
    emails: ['demo@shotlab.app', 'coach.demo@shotlab.app', 'paid.coach@shotlab.app', 'paid.player@shotlab.app'],
  });
}

async function stabilizePage(page) {
  await normalizeDynamicIdentityText(page);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(120);
}

async function enterDemo(page, role) {
  await installSharedRoutes(page);
  await page.goto('/');
  const button = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await stabilizePage(page);
}

async function enterPaid(page, role) {
  await page.goto('/');
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  await stabilizePage(page);
}

async function navLabels(page) {
  return page.getByTestId('mobile-navigation-dock').getByRole('button').allTextContents().then((rows) => rows.map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

async function expectPhoneSafe(page) {
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function expectMoreSheetClosed(page) {
  await expect(page.getByTestId('mobile-navigation-more')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('mobile-navigation-sheet')).toBeHidden();
}

async function collectNavigationKeys(page) {
  const dockKeys = await page.getByTestId('mobile-navigation-dock').locator('[data-nav-key]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-nav-key')).filter(Boolean));
  await page.getByTestId('mobile-navigation-more').click();
  const sheet = page.getByTestId('mobile-navigation-sheet');
  await expect(sheet).toBeVisible();
  const sheetKeys = await sheet.locator('[data-nav-key]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-nav-key')).filter(Boolean));
  await page.getByRole('button', { name: 'Close more navigation' }).click();
  await expectMoreSheetClosed(page);
  return [...new Set([...dockKeys, ...sheetKeys])];
}

async function selectNavigationKey(page, key) {
  const dockItem = page.getByTestId('mobile-navigation-dock').locator(`[data-nav-key="${key}"]`);
  if (await dockItem.count()) {
    await dockItem.click();
  } else {
    await page.getByTestId('mobile-navigation-more').click();
    const sheet = page.getByTestId('mobile-navigation-sheet');
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
  }
  await expectMoreSheetClosed(page);
  await stabilizePage(page);
}

async function visualFingerprint(page) {
  return page.evaluate(({ styleProperties }) => {
    const round = (value) => Math.round(value * 2) / 2;
    const excludedTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT']);
    const nodes = [...document.body.querySelectorAll('*')];
    const result = [];

    for (const node of nodes) {
      if (excludedTags.has(node.tagName)) continue;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0
        && (rect.width > 0 || rect.height > 0);
      if (!visible) continue;

      const styles = {};
      for (const property of styleProperties) styles[property] = style[property];
      result.push({
        tag: node.tagName,
        className: typeof node.className === 'string' ? node.className : '',
        testId: node.getAttribute('data-testid') || '',
        role: node.getAttribute('role') || '',
        navKey: node.getAttribute('data-nav-key') || '',
        ariaCurrent: node.getAttribute('aria-current') || '',
        rect: [round(rect.x), round(rect.y), round(rect.width), round(rect.height)],
        childElementCount: node.childElementCount,
        styles,
      });
    }
    return result;
  }, { styleProperties: FINGERPRINT_STYLE_PROPERTIES });
}

async function dismissTransientUi(page) {
  const teamStore = page.getByRole('dialog', { name: 'Team Store' });
  if (await teamStore.count()) {
    const close = teamStore.getByRole('button', { name: /Close team store/i });
    if (await close.count()) await close.click();
    else {
      const gotIt = teamStore.getByRole('button', { name: 'GOT IT', exact: true });
      if (await gotIt.count()) await gotIt.click();
    }
    await expect(teamStore).toHaveCount(0);
  }

  const brandingWorkspace = page.getByTestId('coach-branding-workspace');
  if (await brandingWorkspace.count()) {
    await page.getByRole('button', { name: 'Back to Coach', exact: true }).click();
    await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 10_000 });
  }
}

async function expectRouteParity({ paidPage, demoPage, role, key }) {
  await selectNavigationKey(paidPage, key);
  await selectNavigationKey(demoPage, key);
  await expectPhoneSafe(paidPage);
  await expectPhoneSafe(demoPage);

  if (role === 'coach' && key === 'leaderboards') {
    await expect(paidPage.getByTestId('coach-page-dashboard-leaderboards')).toBeVisible();
    await expect(demoPage.getByTestId('coach-page-dashboard-leaderboards')).toBeVisible();
  }

  const paidFingerprint = await visualFingerprint(paidPage);
  const demoFingerprint = await visualFingerprint(demoPage);
  expect(demoFingerprint, `${role}:${key} visual structure/styles must match registered experience`).toEqual(paidFingerprint);

  const safeKey = key.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  await paidPage.screenshot({ path: `parity-evidence/${role}-${safeKey}-paid.png`, fullPage: true });
  await demoPage.screenshot({ path: `parity-evidence/${role}-${safeKey}-demo.png`, fullPage: true });

  await dismissTransientUi(paidPage);
  await dismissTransientUi(demoPage);
}

async function createPaidPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await seedPaidSession(context, role);
  const page = await context.newPage();
  await enterPaid(page, role);
  return { context, page };
}

async function createDemoPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await enterDemo(page, role);
  return { context, page };
}

for (const role of ['coach', 'player']) {
  test(`${role} demo and registered ${role} stay visually identical across the full mobile navigation matrix`, async ({ browser }) => {
    const paid = await createPaidPage(browser, role);
    const demo = await createDemoPage(browser, role);
    try {
      expect(await navLabels(demo.page)).toEqual(await navLabels(paid.page));

      const paidKeys = await collectNavigationKeys(paid.page);
      const demoKeys = await collectNavigationKeys(demo.page);
      expect(demoKeys).toEqual(paidKeys);

      for (const requiredKey of REQUIRED_NAV_KEYS[role]) {
        expect(paidKeys, `${role} parity matrix must include ${requiredKey}`).toContain(requiredKey);
      }

      for (const key of paidKeys) {
        await expectRouteParity({ paidPage: paid.page, demoPage: demo.page, role, key });
      }
    } finally {
      await paid.context.close();
      await demo.context.close();
    }
  });
}
