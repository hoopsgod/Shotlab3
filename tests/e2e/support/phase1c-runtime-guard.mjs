import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { collectMobileGeometry, expectMobileGeometry } from './mobile-geometry-contract.mjs';

const OUTPUT_ROOT = path.resolve(process.cwd(), 'artifacts/phase1c');
const SCREENSHOT_DIR = path.join(OUTPUT_ROOT, 'screenshots');
const RUNTIME_DIR = path.join(OUTPUT_ROOT, 'runtime');
const FIXED_NOW = Date.parse('2026-09-01T12:00:00-04:00');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(RUNTIME_DIR, { recursive: true });

function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const keys = [...url.searchParams.keys()].sort();
    return `${url.origin}${url.pathname}${keys.length ? `?${keys.map((key) => `${key}=…`).join('&')}` : ''}`;
  } catch {
    return String(rawUrl || '');
  }
}

function isCriticalRequest(rawUrl) {
  const value = String(rawUrl || '').toLowerCase();
  if (value.includes('/auth/v1/')) return true;
  if (value.includes('/rest/v1/')) {
    return ['player', 'team', 'event', 'rsvp', 'assignment', 'leaderboard', 'progress', 'score', 'shotlog']
      .some((token) => value.includes(token));
  }
  if (!value.includes('/v1/')) return false;
  return ['auth', 'restore-context', 'player', 'event', 'assignment', 'leaderboard', 'progress', 'score', 'shot', 'season-archive', 'team-priorit']
    .some((token) => value.includes(token));
}

export async function installPhase1CFixedTime(page) {
  await page.addInitScript(({ fixedNow }) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }
      static now() { return fixedNow; }
    }
    FixedDate.parse = RealDate.parse;
    FixedDate.UTC = RealDate.UTC;
    globalThis.Date = FixedDate;
  }, { fixedNow: FIXED_NOW });
}

export function attachPhase1CRuntimeGuard(page, label) {
  const state = {
    label,
    pageErrors: [],
    consoleErrors: [],
    failedCriticalRequests: [],
    badCriticalResponses: [],
    observedCriticalResponses: [],
  };

  page.on('pageerror', (error) => {
    state.pageErrors.push({ message: String(error?.message || error), stack: String(error?.stack || '') });
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location?.() || {};
    state.consoleErrors.push({
      text: message.text(),
      source: location.url ? sanitizeUrl(location.url) : '',
      line: location.lineNumber ?? null,
      column: location.columnNumber ?? null,
    });
  });

  page.on('requestfailed', (request) => {
    if (!isCriticalRequest(request.url())) return;
    state.failedCriticalRequests.push({
      method: request.method(),
      url: sanitizeUrl(request.url()),
      errorText: request.failure()?.errorText || 'request failed',
    });
  });

  page.on('response', (response) => {
    if (!isCriticalRequest(response.url())) return;
    const record = { method: response.request().method(), url: sanitizeUrl(response.url()), status: response.status() };
    state.observedCriticalResponses.push(record);
    if (response.status() >= 400) state.badCriticalResponses.push(record);
  });

  return {
    snapshot() {
      return JSON.parse(JSON.stringify(state));
    },
    assertClean() {
      expect(state.pageErrors, `${label}: uncaught page exceptions`).toEqual([]);
      expect(state.consoleErrors, `${label}: unexpected console errors`).toEqual([]);
      expect(state.failedCriticalRequests, `${label}: failed critical requests`).toEqual([]);
      expect(state.badCriticalResponses, `${label}: unexpected critical response failures`).toEqual([]);
    },
  };
}

async function settleVisuals(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: `
    *,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}
    html,body{scrollbar-width:none!important}
    ::-webkit-scrollbar{display:none!important}
  ` });
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    document.querySelector('.player-scroll-container')?.scrollTo(0, 0);
    document.querySelector('.performance-workspace--coach')?.scrollTo(0, 0);
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? image.decode?.().catch(() => {}) : Promise.resolve()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function collectViewportContainment(page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollX: window.scrollX,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

export async function capturePhase1CSnapshot(page, guard, name, { geometry = null } = {}) {
  await settleVisuals(page);
  const containment = await collectViewportContainment(page);
  expect(containment.scrollX, `${name}: horizontal document offset`).toBe(0);
  expect(containment.documentScrollWidth - containment.documentClientWidth, `${name}: document overflow`).toBeLessThanOrEqual(1);
  expect(containment.bodyScrollWidth - containment.innerWidth, `${name}: body overflow`).toBeLessThanOrEqual(1);

  let geometryEvidence = null;
  if (geometry) {
    geometryEvidence = await collectMobileGeometry(page, geometry);
    expectMobileGeometry(geometryEvidence, name);
  }

  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    caret: 'hide',
    fullPage: false,
    maxDiffPixelRatio: 0.002,
    threshold: 0.2,
  });

  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, animations: 'disabled', caret: 'hide', fullPage: false });
  expect(fs.statSync(screenshotPath).size, `${name}: screenshot evidence must not be empty`).toBeGreaterThan(5_000);

  const runtime = guard.snapshot();
  const evidence = {
    exactHead: process.env.GITHUB_SHA || 'local-checkout',
    name,
    containment,
    geometry: geometryEvidence,
    runtime,
  };
  fs.writeFileSync(path.join(RUNTIME_DIR, `${name}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
  guard.assertClean();
  return evidence;
}
