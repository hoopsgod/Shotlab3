import { test, expect, webkit } from '@playwright/test';
import fs from 'node:fs';

const OUTPUT_DIR = 'parity-evidence';
const VIEWPORT = { width: 390, height: 844 };
const SHOT_TRACKER_VIEWPORT = { width: 393, height: 852 };
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function createDemo(role, viewport = VIEWPORT) {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    viewport,
    screen: viewport,
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
  const title = marker.locator('[data-identity-role="page-title"]').first();
  const summary = marker.locator('.teamIdentityTitleStage__summary').first();
  await expect(title).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(700);

  const state = await marker.evaluate((node) => {
    const stage = node.getBoundingClientRect();
    const heading = node.querySelector('[data-identity-role="page-title"]')?.getBoundingClientRect();
    const supporting = node.querySelector('.teamIdentityTitleStage__summary')?.getBoundingClientRect();
    const player = document.querySelector('.player-scroll-container');
    const coach = document.querySelector('.performance-shell--coach.is-mobile > .shell-main > .content-wrap');
    const owner = player || coach;
    return {
      stageTop: stage.top,
      stageBottom: stage.bottom,
      titleTop: heading?.top ?? -1,
      titleBottom: heading?.bottom ?? -1,
      summaryTop: supporting?.top ?? -1,
      summaryBottom: supporting?.bottom ?? -1,
      viewportHeight: window.innerHeight,
      rootScrollTop: document.scrollingElement?.scrollTop || 0,
      ownerScrollTop: owner?.scrollTop || 0,
    };
  });

  const diagnostic = `${label} opening geometry: ${JSON.stringify(state)}`;
  expect(state.rootScrollTop, diagnostic).toBeLessThanOrEqual(1);
  expect(state.ownerScrollTop, diagnostic).toBeLessThanOrEqual(1);
  expect(state.stageTop, diagnostic).toBeGreaterThanOrEqual(0);
  expect(state.stageTop, diagnostic).toBeLessThan(190);
  expect(state.titleTop, `${diagnostic}; heading must be fully below the viewport top`).toBeGreaterThanOrEqual(0);
  expect(state.titleBottom, `${diagnostic}; heading must be fully inside the opening viewport`).toBeLessThanOrEqual(state.viewportHeight);
  expect(state.titleBottom, diagnostic).toBeGreaterThan(state.titleTop);
  if (await summary.count()) {
    expect(state.summaryTop, `${diagnostic}; supporting copy must not be cropped`).toBeGreaterThanOrEqual(state.titleBottom);
    expect(state.summaryBottom, `${diagnostic}; supporting copy must remain visible on load`).toBeLessThanOrEqual(state.viewportHeight);
  }
  await page.screenshot({ path: `${OUTPUT_DIR}/${screenshot}`, animations: 'disabled' });
}

test('Coach Demo Drills, Players, and Schedule always open with the full heading visible in iPhone WebKit', async () => {
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

test('Player Demo Home and Train always open with the full heading visible in iPhone WebKit', async () => {
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


test('Player Demo Shot Tracker centers equal controls at 393px in iPhone WebKit', async () => {
  test.setTimeout(120_000);
  const { browser, context, page } = await createDemo('player', SHOT_TRACKER_VIEWPORT);
  try {
    await navigateByKey(page, 'log-drill');
    const tracker = page.getByTestId('player-shot-logging-region');
    await expect(tracker).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(500);

    const geometry = await tracker.locator('.player-logging-field').evaluateAll((elements) => elements.map((element) => {
      const field = element.getBoundingClientRect();
      const labelElement = element.querySelector('label');
      const inputElement = element.querySelector('input');
      const label = labelElement?.getBoundingClientRect();
      const input = inputElement?.getBoundingClientRect();
      return {
        fieldLeft: field.left,
        fieldRight: field.right,
        fieldWidth: field.width,
        labelLeft: label?.left || 0,
        labelRight: label?.right || 0,
        labelTextAlign: labelElement ? getComputedStyle(labelElement).textAlign : '',
        inputLeft: input?.left || 0,
        inputRight: input?.right || 0,
        inputWidth: input?.width || 0,
        inputHeight: input?.height || 0,
        inputBottom: input?.bottom || 0,
        fieldBottom: field.bottom,
        inputTextAlign: inputElement ? getComputedStyle(inputElement).textAlign : '',
      };
    }));
    const submitTop = await tracker.getByRole('button', { name: 'LOG SHOTS', exact: true }).evaluate((element) => element.getBoundingClientRect().top);

    expect(geometry).toHaveLength(2);
    expect(Math.abs(geometry[0].fieldWidth - geometry[1].fieldWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry[0].inputHeight - geometry[1].inputHeight)).toBeLessThanOrEqual(1);
    for (const field of geometry) {
      const fieldCenter = (field.fieldLeft + field.fieldRight) / 2;
      expect(field.inputLeft).toBeGreaterThanOrEqual(field.fieldLeft - 0.5);
      expect(field.inputRight).toBeLessThanOrEqual(field.fieldRight + 0.5);
      expect(Math.abs(field.inputWidth - field.fieldWidth)).toBeLessThanOrEqual(1);
      expect(field.inputBottom, 'native input must remain inside its field flow box').toBeLessThanOrEqual(field.fieldBottom + 0.5);
      expect(submitTop - field.inputBottom, 'submit action must clear both native input border boxes').toBeGreaterThanOrEqual(12);
      expect(Math.abs(((field.labelLeft + field.labelRight) / 2) - fieldCenter)).toBeLessThanOrEqual(1);
      expect(field.labelTextAlign).toBe('center');
      expect(field.inputTextAlign).toBe('center');
    }

    await tracker.screenshot({ path: `${OUTPUT_DIR}/webkit-player-shot-tracker-393.png`, animations: 'disabled' });
  } finally {
    await context.close();
    await browser.close();
  }
});
