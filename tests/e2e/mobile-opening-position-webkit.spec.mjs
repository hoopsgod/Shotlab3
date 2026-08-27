import { test, expect, webkit } from '@playwright/test';
import fs from 'node:fs';

const OUTPUT_DIR = 'parity-evidence';
const VIEWPORT = { width: 390, height: 844 };
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function createDemo(role) {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    screen: VIEWPORT,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  await context.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await context.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('button', { name: role === 'coach' ? /Coach demo/i : /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: role === 'coach' ? /Coach demo/i : /Player demo/i }).click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  return { browser, context, page };
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId('mobile-navigation-dock');
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) return direct.click();
  await page.getByTestId('mobile-navigation-more').click();
  const sheet = page.getByTestId('mobile-navigation-sheet');
  await expect(sheet).toBeVisible();
  const item = sheet.locator(`[data-nav-key="${key}"]`);
  await expect(item).toBeVisible();
  await item.click();
  await expect(sheet).toHaveCount(0);
}

async function seedStaleScroll(page) {
  const result = await page.evaluate(() => {
    const owners = [
      document.querySelector('.player-scroll-container'),
      document.querySelector('.performance-shell--coach.is-mobile > .shell-main > .content-wrap'),
      document.scrollingElement,
    ].filter(Boolean);
    for (const owner of owners) {
      const max = Math.max(0, owner.scrollHeight - owner.clientHeight);
      if (max < 80) continue;
      owner.scrollTop = Math.min(480, max);
      if (owner.scrollTop > 40) return { seeded: true, className: owner.className || 'document', scrollTop: owner.scrollTop };
    }
    return { seeded: false, className: 'none', scrollTop: 0 };
  });
  expect(result.seeded, `expected a stale mobile scroll seed, got ${JSON.stringify(result)}`).toBe(true);
}

async function assertOpeningTop(page, marker, label, screenshot) {
  await expect(marker).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(700);
  const state = await marker.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const player = document.querySelector('.player-scroll-container');
    const coach = document.querySelector('.performance-shell--coach.is-mobile > .shell-main > .content-wrap');
    const owner = player || coach;
    return {
      top: rect.top,
      bottom: rect.bottom,
      rootScrollTop: document.scrollingElement?.scrollTop || 0,
      ownerScrollTop: owner?.scrollTop || 0,
      overflowAnchor: owner ? getComputedStyle(owner).overflowAnchor : '',
    };
  });
  const diagnostic = `${label} opening geometry: ${JSON.stringify(state)}`;
  expect(state.rootScrollTop, diagnostic).toBeLessThanOrEqual(1);
  expect(state.ownerScrollTop, diagnostic).toBeLessThanOrEqual(1);
  expect(state.top, diagnostic).toBeGreaterThanOrEqual(0);
  expect(state.top, diagnostic).toBeLessThan(190);
  expect(state.bottom, diagnostic).toBeGreaterThan(60);
  expect(state.overflowAnchor, diagnostic).toBe('none');
  await page.screenshot({ path: `${OUTPUT_DIR}/${screenshot}`, animations: 'disabled' });
}

test('Coach Demo Drills, Players, and Schedule always open at the true top in iPhone WebKit', async () => {
  test.setTimeout(180_000);
  const { browser, context, page } = await createDemo('coach');
  try {
    for (const [key, name] of [['drills', 'drills'], ['players', 'players'], ['events', 'schedule']]) {
      await seedStaleScroll(page);
      await navigateByKey(page, key);
      const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]:visible').first();
      await assertOpeningTop(page, stage, `Coach ${name}`, `webkit-coach-${name}-opening-390.png`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
});

test('Player Demo Home and Train always open at the true top in iPhone WebKit', async () => {
  test.setTimeout(180_000);
  const { browser, context, page } = await createDemo('player');
  try {
    await navigateByKey(page, 'log-drill');
    await seedStaleScroll(page);
    await navigateByKey(page, 'home');
    await assertOpeningTop(page, page.getByTestId('player-dashboard-identity-header'), 'Player Home', 'webkit-player-home-opening-390.png');

    await seedStaleScroll(page);
    await navigateByKey(page, 'log-drill');
    const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]:visible').first();
    await assertOpeningTop(page, stage, 'Player Train', 'webkit-player-train-opening-390.png');
  } finally {
    await context.close();
    await browser.close();
  }
});
