import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect } from '@playwright/test';
import { collectMobileGeometry, expectMobileGeometry } from './mobile-geometry-contract.mjs';

const OUTPUT_ROOT = path.resolve(process.cwd(), 'artifacts/phase1c');
const SCREENSHOT_DIR = path.join(OUTPUT_ROOT, 'screenshots');
const RUNTIME_DIR = path.join(OUTPUT_ROOT, 'runtime');
const EXACT_HEAD_PATH = path.join(OUTPUT_ROOT, 'exact-head-sha.txt');
const FIXED_NOW = Date.parse('2026-09-01T12:00:00-04:00');
const EXACT_VISUAL_BASELINE_HASHES = new Map([
  // Exact GitHub Actions Linux/Chromium evidence only; never regenerate these from a local browser.
  // The inherited CI-debt stabilization intentionally compacts the Coach Home title stage while
  // preserving branding, CTA visibility, mobile-dock clearance, and horizontal containment.
  ['coach-mission-control-demo-empty-390', '5ae119686ecef63a6de0d9cd1518a4e6a9f7b28d69860a738c69a724d8310f34'],
  ['coach-mission-control-registered-empty-390', 'a03078f21b4b3e5b889c6f4f976eade65c021315716d8c4063cfbf651ab762ed'],
  // Phase 7D.2 restores the reviewed flat roster composition. Phase 7E keeps that composition
  // and adds the reviewed restrained team-brand row tint. The app-wide heading pass adds the
  // reviewed compact editorial title treatment while preserving the roster composition below it.
  ['coach-players-registered-populated-390', [
    'd613a65be33b24e9be224161e2bc30a0cc119c9a1fb846de9728a0736111beee',
    '91de0c9f4a4bfba1695466341b705d6a0371e0c8ab92433ece5cd2acaea0c6e3',
    'a3407c36f7b76bbb2b98b664acd89f759a4eaabfae27326576465fff851945a2',
    '37b37fb495cfca1747ae79810b6103964971fa4bf2e222cc6c601133dead9b2c',
    '549a327449c8a375e7dd45f738a62b651263fa83bb859732c40f0476153dc07f',
  ]],
  // The app-wide heading pass intentionally replaces the generic Events intro copy with the
  // reviewed live RSVP status. Lock that exact CI-rendered state by digest so Phase 1C does not
  // depend on a repository PNG binary for this intentionally changed surface.
  ['coach-events-registered-populated-390', [
    '03e08a265baa8384f207499e9a830191afbbc8110caf64cfe8b238cb2ea591fe',
    'b1f9bf67a81a471ac9f7f74ba03f8b7f2a67e45951c168377713e2bbbe0bf211',
  ]],
  // Phase 7E now keeps photo ownership in More > Personalize, so Progress returns to the
  // previously reviewed compact state with no photo panel or unrelated visual drift.
  ['player-progress-registered-populated-390', [
    'ab2357b3e1393fb78d270b8eb840ff8dfec0627ae65576d7cd3be8faee4059d7',
    '33201cf2a3bb26b98774eccf2edde46e53963a59d574aa9a29b27696a61008a5',
    '8f7916dd1cf2877d3c2d62c551742364edd0521aa5ca68532409602b6a94852d',
  ]],
  // These edge/stress captures are the same reviewed compact Coach Home composition at widths
  // that exercise long team identity and the minimum/maximum Phase 1C mobile geometry bounds.
  ['coach-home-branding-stress-390', 'e0b049843519fc7b4b54053fc1e7b6453d92a794f359d0db34d92ada4cfdc482'],
  ['coach-home-edge-320', '0bb8db1efe60f61aca78ffaa1be94ada300de5610b855961aeec19e7140fa775'],
  ['coach-home-edge-430', '50c882de67dbd200167f9f11e01c000eba9f1283ffd898e2e399bae9f1dc0dc1'],
]);

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(RUNTIME_DIR, { recursive: true });

function exactHeadSha() {
  try {
    const value = fs.readFileSync(EXACT_HEAD_PATH, 'utf8').trim();
    if (/^[0-9a-f]{40}$/i.test(value)) return value;
  } catch {}
  return process.env.PHASE1C_HEAD_SHA || process.env.GITHUB_SHA || 'local-checkout';
}

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
    *,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
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

  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, animations: 'disabled', caret: 'hide', fullPage: false, scale: 'css' });
  expect(fs.statSync(screenshotPath).size, `${name}: screenshot evidence must not be empty`).toBeGreaterThan(5_000);

  const exactVisualBaselineHash = EXACT_VISUAL_BASELINE_HASHES.get(name);
  if (exactVisualBaselineHash) {
    const digest = createHash('sha256').update(fs.readFileSync(screenshotPath)).digest('hex');
    const acceptedDigests = Array.isArray(exactVisualBaselineHash) ? exactVisualBaselineHash : [exactVisualBaselineHash];
    expect(acceptedDigests, `${name}: exact visual baseline hash`).toContain(digest);
  } else {
    await expect(page).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.002,
      threshold: 0.2,
    });
  }

  const runtime = guard.snapshot();
  const evidence = {
    exactHead: exactHeadSha(),
    name,
    containment,
    geometry: geometryEvidence,
    runtime,
  };
  fs.writeFileSync(path.join(RUNTIME_DIR, `${name}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
}
