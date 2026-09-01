import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { collectMobileGeometry, expectMobileGeometry } from './support/mobile-geometry-contract.mjs';
import { enterPhase1BSession } from './support/phase1b-state-fixtures.mjs';

const OUTPUT_DIR = path.resolve(process.cwd(), 'artifacts/phase1b');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });

const CASES = [
  { role: 'coach', scenario: 'populated', label: 'coach-populated' },
  { role: 'coach', scenario: 'empty', label: 'coach-empty-onboarding' },
  { role: 'coach', scenario: 'stress', label: 'coach-branding-stress' },
  { role: 'player', scenario: 'populated', label: 'player-populated' },
  { role: 'player', scenario: 'firstUse', label: 'player-first-use' },
  { role: 'player', scenario: 'stress', label: 'player-branding-stress' },
];

const ROUTES = {
  coach: [
    {
      key: 'home', readyTestId: 'coach-command-center-full', root: '[data-testid="coach-command-center-full"]',
      geometry: {
        targets: {
          workspace: '.performance-workspace--coach', routeShell: '[data-testid="coach-command-center-full"]',
          contentRail: '[data-testid="coach-command-center-full"] .missionControl',
          titleStage: '[data-team-identity-stage="coach-mission-control"]', primaryRegion: '[data-testid="coach-primary-objective"]',
        },
        centered: ['routeShell', 'contentRail', 'titleStage'],
      },
    },
    {
      key: 'players', readyTestId: 'coach-players-interactive-dashboard', root: '[data-testid="coach-players-interactive-dashboard"]',
      geometry: {
        targets: {
          workspace: '.performance-workspace--coach', routeShell: '[data-testid="coach-players-interactive-dashboard"]',
          contentRail: '[data-testid="coach-players-interactive-dashboard"]', titleStage: '[data-testid="coach-players-command-bar"]',
          primaryRegion: '[data-testid="coach-players-command-bar"]',
        },
        centered: ['routeShell', 'titleStage', 'primaryRegion'],
        localScrollSelectors: ['[aria-label="Dashboard view filters"]'],
      },
    },
    {
      key: 'events', readyTestId: 'coach-events-interactive-dashboard', root: '[data-testid="coach-events-interactive-dashboard"]',
      geometry: {
        targets: {
          workspace: '.performance-workspace--coach', routeShell: '[data-testid="coach-events-interactive-dashboard"]',
          contentRail: '[data-testid="coach-events-interactive-dashboard"]', titleStage: '[data-testid="coach-events-command-bar"]',
          primaryRegion: '[data-testid="coach-events-decision-brief"]',
        },
        centered: ['routeShell', 'titleStage', 'primaryRegion'],
      },
    },
  ],
  player: [
    {
      key: 'home', readyTestId: 'player-daily-command-center', root: '[data-testid="player-daily-command-center"]',
      geometry: {
        targets: {
          workspace: '.player-scroll-container', routeShell: '[data-testid="player-daily-command-center"]',
          contentRail: '[data-testid="player-daily-command-center"]',
          titleStage: '[data-testid="player-daily-command-center"] [data-command-role="primary"]',
          primaryRegion: '[data-testid="player-daily-command-center"] [data-layout-role="primary-decision"]',
        },
        centered: ['routeShell', 'titleStage', 'primaryRegion'],
      },
    },
    {
      key: 'profile', readyTestId: 'player-profile-workspace', root: '[data-testid="player-profile-workspace"]',
      geometry: {
        targets: {
          workspace: '.player-scroll-container', routeShell: '[data-testid="player-profile-workspace"]',
          contentRail: '[data-testid="player-progress-story"]', titleStage: '[data-testid="player-progress-team-title"]',
          primaryRegion: '[data-testid="player-progress-story-hero"]',
        },
        centered: ['routeShell', 'contentRail', 'titleStage'],
      },
    },
  ],
};

function normalizeClasses(value) {
  return String(value || '').split(/\s+/).filter(Boolean).sort().join(' ');
}

async function navigate(page, key, readyTestId) {
  if (key === 'home') {
    await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 20_000 });
    return;
  }
  const direct = page.getByTestId('mobile-navigation-dock').locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId('mobile-navigation-more').click();
    const sheet = page.getByTestId('mobile-navigation-sheet');
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 20_000 });
}

async function collectOwnership(page, rootSelector) {
  return page.locator(rootSelector).evaluate((root) => {
    const round = (value) => Math.round(value * 2) / 2;
    const candidates = [root, ...root.querySelectorAll('[data-layout-role], [data-page-hierarchy], [data-command-role], [data-team-identity-stage]')];
    return candidates.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        className: String(node.className || '').split(/\s+/).filter(Boolean).sort().join(' '),
        testId: node.getAttribute('data-testid') || '',
        layoutRole: node.getAttribute('data-layout-role') || '',
        pageHierarchy: node.getAttribute('data-page-hierarchy') || '',
        commandRole: node.getAttribute('data-command-role') || '',
        teamIdentityStage: node.getAttribute('data-team-identity-stage') || '',
        display: style.display,
        position: style.position,
        boxSizing: style.boxSizing,
        maxWidth: style.maxWidth,
        width: round(rect.width),
        x: round(rect.x),
        leftRail: round(rect.left),
        rightRail: round(innerWidth - rect.right),
      };
    });
  });
}

async function expectPairRoute(demo, registered, route, evidenceLabel) {
  await navigate(demo, route.key, route.readyTestId);
  await navigate(registered, route.key, route.readyTestId);
  await Promise.all([
    demo.evaluate(() => document.fonts?.ready),
    registered.evaluate(() => document.fonts?.ready),
  ]);

  const demoGeometry = await collectMobileGeometry(demo, route.geometry);
  const registeredGeometry = await collectMobileGeometry(registered, route.geometry);
  expectMobileGeometry(demoGeometry, `${evidenceLabel} Demo`);
  expectMobileGeometry(registeredGeometry, `${evidenceLabel} registered`);

  const demoOwnership = await collectOwnership(demo, route.root);
  const registeredOwnership = await collectOwnership(registered, route.root);
  expect(demoOwnership, `${evidenceLabel} must keep identical Demo/registered layout ownership`).toEqual(registeredOwnership);

  const evidence = { demoGeometry, registeredGeometry, demoOwnership, registeredOwnership };
  fs.writeFileSync(path.join(OUTPUT_DIR, `${evidenceLabel}.json`), JSON.stringify(evidence, null, 2));
  await demo.screenshot({ path: path.join(OUTPUT_DIR, `${evidenceLabel}-demo.png`), fullPage: true });
  await registered.screenshot({ path: path.join(OUTPUT_DIR, `${evidenceLabel}-registered.png`), fullPage: true });
}

async function expectStateLoaded(page, role, scenario) {
  const state = await page.evaluate(() => {
    const read = (key) => {
      try { return JSON.parse(window.localStorage.getItem(key) || '[]'); } catch { return []; }
    };
    return {
      players: read('sl:players').length,
      scores: read('sl:scores').length,
      shots: read('sl:shotlogs').length,
      events: read('sl:events').length,
    };
  });
  if (scenario === 'populated' || scenario === 'stress') {
    expect(state.players).toBeGreaterThanOrEqual(role === 'coach' ? 3 : 1);
    expect(state.scores).toBeGreaterThan(0);
    expect(state.events).toBeGreaterThan(0);
  } else {
    expect(state.scores).toBe(0);
    expect(state.shots).toBe(0);
    expect(state.events).toBe(0);
  }

  if (role === 'coach' && scenario === 'empty') {
    await expect(page.getByTestId('coach-command-center-full')).toHaveClass(/is-onboarding/);
  }
}

for (const fixtureCase of CASES) {
  test(`${fixtureCase.label} keeps Demo and registered layout authority identical`, async ({ browser }, testInfo) => {
    const demoSession = await enterPhase1BSession(browser, { role: fixtureCase.role, scenario: fixtureCase.scenario, mode: 'demo' });
    const registeredSession = await enterPhase1BSession(browser, { role: fixtureCase.role, scenario: fixtureCase.scenario, mode: 'registered' });
    try {
      await expectStateLoaded(demoSession.page, fixtureCase.role, fixtureCase.scenario);
      await expectStateLoaded(registeredSession.page, fixtureCase.role, fixtureCase.scenario);

      for (const route of ROUTES[fixtureCase.role]) {
        const label = `${fixtureCase.label}-${route.key}-${testInfo.project.name}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
        await expectPairRoute(demoSession.page, registeredSession.page, route, label);
      }

      const demoRoot = demoSession.page.getByTestId(fixtureCase.role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center');
      const registeredRoot = registeredSession.page.getByTestId(fixtureCase.role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center');
      if (await demoRoot.count() && await registeredRoot.count()) {
        expect(normalizeClasses(await demoRoot.getAttribute('class'))).toBe(normalizeClasses(await registeredRoot.getAttribute('class')));
      }
    } finally {
      await demoSession.context.close();
      await registeredSession.context.close();
    }
  });
}
