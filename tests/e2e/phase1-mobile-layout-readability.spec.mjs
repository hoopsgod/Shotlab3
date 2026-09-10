import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(process.cwd(), 'artifacts/phase1-mobile-layout-readability');
const EVIDENCE = process.env.PHASE1_EVIDENCE || 'after';
const CAPTURE_ONLY = process.env.PHASE1_CAPTURE_ONLY === '1';
const VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];

fs.mkdirSync(path.join(OUTPUT, EVIDENCE), { recursive: true });
const evidenceRows = [];

function rgb(value = '') {
  const match = String(value).match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/i);
  return match ? match.slice(1, 4).map(Number) : null;
}
function channel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(color) {
  return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
}
function contrast(left, right) {
  const a = luminance(left); const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function close(a, b, tolerance = 2) { return Math.abs(a - b) <= tolerance; }

async function safeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function freezeMotion(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.fonts?.ready);
}

async function capture(page, viewport, name) {
  if (viewport.width !== 390) return;
  await page.screenshot({ path: path.join(OUTPUT, EVIDENCE, `390-${name}.png`), fullPage: true });
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
}

async function navigate(page, key) {
  const visibleDirect = page.locator(`[data-nav-key="${key}"]:visible`).first();
  if (await visibleDirect.count()) {
    await visibleDirect.click();
    await page.waitForTimeout(160);
    return;
  }
  const more = page.getByTestId('mobile-navigation-more');
  if (await more.count()) {
    await more.click();
    const item = page.locator(`[data-nav-key="${key}"]:visible`).first();
    await expect(item).toBeVisible();
    await item.click();
    await page.waitForTimeout(160);
    return;
  }
  throw new Error(`Could not navigate to ${key}`);
}

async function enterCoachDemo(page) {
  const demo = page.getByRole('button', { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(220);
}

for (const viewport of VIEWPORTS) {
  test(`Phase 1 coach layout/readability at ${viewport.width}px`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize(viewport);
    await safeRoutes(page);
    await page.goto('/');
    await freezeMotion(page);

    const email = page.locator('.auth-card-enter input[type="email"]');
    const password = page.locator('.auth-card-enter input[type="password"]');
    const signIn = page.locator('.auth-card-enter > button.cta-primary');
    await expect(email).toBeVisible({ timeout: 20_000 });
    await expect(signIn).toBeVisible();
    const auth = await page.evaluate(() => {
      const rect = (node) => { const r = node.getBoundingClientRect(); return { left:r.left, right:r.right, width:r.width }; };
      const card = document.querySelector('.auth-card-enter');
      const mail = card?.querySelector('input[type="email"]');
      const pass = card?.querySelector('input[type="password"]');
      const button = card?.querySelector(':scope > button.cta-primary');
      return { card:rect(card), email:rect(mail), password:rect(pass), button:rect(button) };
    });
    await capture(page, viewport, 'signin');

    if (!CAPTURE_ONLY) {
      expect(close(auth.email.left, auth.password.left)).toBe(true);
      expect(close(auth.email.right, auth.password.right)).toBe(true);
      expect(close(auth.email.left, auth.button.left)).toBe(true);
      expect(close(auth.email.right, auth.button.right)).toBe(true);
      for (const control of [auth.email, auth.password, auth.button]) {
        expect(control.left).toBeGreaterThanOrEqual(auth.card.left - 1);
        expect(control.right).toBeLessThanOrEqual(auth.card.right + 1);
      }
      const overflow = await noHorizontalOverflow(page);
      expect(overflow.document - overflow.viewport).toBeLessThanOrEqual(1);
      expect(overflow.body - overflow.viewport).toBeLessThanOrEqual(1);
    }

    await enterCoachDemo(page);
    const pulse = page.getByTestId('coach-program-pulse');
    await expect(pulse).toBeVisible({ timeout: 20_000 });
    const pulseMetrics = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="coach-program-pulse"]');
      const lead = panel?.querySelector('.mcPulseLead');
      const score = panel?.querySelector('.mcHealthScore');
      const heading = panel?.querySelector('h2');
      const caption = panel?.querySelector('.mcPulseCaption');
      if (!panel || !lead || !score || !heading || !caption) return null;
      const original = score.textContent;
      const samples = ['0%', '50%', '100%'].map((value) => {
        score.textContent = value;
        const r = score.getBoundingClientRect();
        const l = lead.getBoundingClientRect();
        const h = heading.getBoundingClientRect();
        return { value, left:r.left, right:r.right, top:r.top, bottom:r.bottom, leadLeft:l.left, leadRight:l.right, leadTop:l.top, leadBottom:l.bottom, headingRight:h.right, fontSize:parseFloat(getComputedStyle(score).fontSize) };
      });
      score.textContent = original;
      const panelRect = panel.getBoundingClientRect();
      const captionRect = caption.getBoundingClientRect();
      return { samples, panel:{left:panelRect.left,right:panelRect.right}, caption:{left:captionRect.left,right:captionRect.right} };
    });
    await capture(page, viewport, 'dashboard');

    if (!CAPTURE_ONLY) {
      expect(pulseMetrics).not.toBeNull();
      for (const sample of pulseMetrics.samples) {
        expect(sample.fontSize).toBeGreaterThanOrEqual(36);
        expect(sample.fontSize).toBeLessThanOrEqual(44);
        expect(sample.left).toBeGreaterThanOrEqual(sample.headingRight + 11);
        expect(sample.right).toBeLessThanOrEqual(sample.leadRight + 1);
        expect(sample.top).toBeGreaterThanOrEqual(sample.leadTop - 1);
        expect(sample.bottom).toBeLessThanOrEqual(sample.leadBottom + 1);
      }
      expect(pulseMetrics.caption.left).toBeGreaterThanOrEqual(pulseMetrics.panel.left - 1);
      expect(pulseMetrics.caption.right).toBeLessThanOrEqual(pulseMetrics.panel.right + 1);
    }

    const assignment = page.getByTestId('coach-assignment-accountability');
    if (await assignment.count()) {
      await expect(assignment).toBeVisible();
      const assignmentFacts = await assignment.locator('.mcAssignmentStateFact').evaluateAll((nodes) => nodes.map((node) => {
        const r = node.getBoundingClientRect();
        const label = node.querySelector('small');
        return { top:r.top, left:r.left, right:r.right, labelSize:label ? parseFloat(getComputedStyle(label).fontSize) : 0 };
      }));
      if (!CAPTURE_ONLY) {
        expect(assignmentFacts).toHaveLength(5);
        for (const fact of assignmentFacts) expect(fact.labelSize).toBeGreaterThanOrEqual(9);
        if (viewport.width <= 420) {
          expect(close(assignmentFacts[0].top, assignmentFacts[1].top, 1)).toBe(true);
          expect(close(assignmentFacts[2].top, assignmentFacts[3].top, 1)).toBe(true);
          expect(close(assignmentFacts[3].top, assignmentFacts[4].top, 1)).toBe(true);
          expect(assignmentFacts[2].top).toBeGreaterThan(assignmentFacts[0].top + 1);
        } else {
          expect(assignmentFacts.every((fact) => close(fact.top, assignmentFacts[0].top, 1))).toBe(true);
        }
      }
    }

    await navigate(page, 'players');
    const playerRail = page.getByTestId('coach-players-filter-rail');
    await expect(playerRail).toBeVisible({ timeout: 20_000 });
    const playerLayout = await playerRail.evaluate((rail) => {
      const search = rail.querySelector('label');
      const group = rail.querySelector('[role="group"]');
      const summary = document.querySelector('[data-testid="coach-players-command-bar"] [class*="summary"]');
      const r = (node) => { const box=node.getBoundingClientRect(); return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width}; };
      return {
        rail:r(rail), search:r(search), group:r(group),
        railScrollWidth:rail.scrollWidth, railClientWidth:rail.clientWidth,
        groupScrollWidth:group.scrollWidth, groupClientWidth:group.clientWidth,
        summaryColor:summary ? getComputedStyle(summary).color : '',
      };
    });
    await capture(page, viewport, 'players');
    if (!CAPTURE_ONLY) {
      expect(close(playerLayout.search.left, playerLayout.rail.left, 2)).toBe(true);
      expect(close(playerLayout.search.right, playerLayout.rail.right, 2)).toBe(true);
      expect(playerLayout.group.top).toBeGreaterThanOrEqual(playerLayout.search.bottom - 1);
      expect(playerLayout.railScrollWidth - playerLayout.railClientWidth).toBeLessThanOrEqual(1);
      if (viewport.width <= 820) expect(playerLayout.groupScrollWidth - playerLayout.groupClientWidth).toBeLessThanOrEqual(1);
      const summaryColor = rgb(playerLayout.summaryColor);
      if (summaryColor) expect(contrast(summaryColor, [244, 240, 231])).toBeGreaterThanOrEqual(4.5);
      const overflow = await noHorizontalOverflow(page);
      expect(overflow.document - overflow.viewport).toBeLessThanOrEqual(1);
      expect(overflow.body - overflow.viewport).toBeLessThanOrEqual(1);
    }

    await navigate(page, 'events');
    const eventRail = page.getByTestId('coach-events-filter-rail');
    await expect(eventRail).toBeVisible({ timeout: 20_000 });
    const eventLayout = await eventRail.evaluate((rail) => {
      const search = rail.querySelector('label');
      const input = rail.querySelector('input');
      const group = rail.querySelector('[role="group"]');
      const trailing = rail.lastElementChild;
      const r = (node) => { const box=node.getBoundingClientRect(); return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width}; };
      return { rail:r(rail), search:r(search), group:r(group), trailing:r(trailing), placeholder:getComputedStyle(input, '::placeholder').color };
    });
    await capture(page, viewport, 'schedule');
    if (!CAPTURE_ONLY) {
      if (viewport.width <= 760) {
        expect(close(eventLayout.search.left, eventLayout.rail.left, 2)).toBe(true);
        expect(close(eventLayout.search.right, eventLayout.rail.right, 2)).toBe(true);
        expect(eventLayout.group.top).toBeGreaterThanOrEqual(eventLayout.search.bottom - 1);
        expect(eventLayout.trailing.top).toBeGreaterThanOrEqual(eventLayout.group.bottom - 1);
      }
      const placeholder = rgb(eventLayout.placeholder);
      if (placeholder) expect(contrast(placeholder, [255,255,255])).toBeGreaterThanOrEqual(4.5);
      const overflow = await noHorizontalOverflow(page);
      expect(overflow.document - overflow.viewport).toBeLessThanOrEqual(1);
      expect(overflow.body - overflow.viewport).toBeLessThanOrEqual(1);
    }

    await navigate(page, 'drills');
    const drills = page.getByTestId('coach-page-dashboard-drills-decision-brief');
    await expect(drills).toBeVisible({ timeout: 20_000 });
    const drillMetrics = await drills.evaluate((stage) => ({
      labels:[...stage.querySelectorAll('[data-route-stage-metric-label]')].map((node) => ({ fontSize:parseFloat(getComputedStyle(node).fontSize), whiteSpace:getComputedStyle(node).whiteSpace, overflow:getComputedStyle(node).overflow, scrollWidth:node.scrollWidth, clientWidth:node.clientWidth })),
      details:[...stage.querySelectorAll('[data-route-stage-metric-detail]')].map((node) => ({ fontSize:parseFloat(getComputedStyle(node).fontSize), whiteSpace:getComputedStyle(node).whiteSpace, overflow:getComputedStyle(node).overflow, scrollWidth:node.scrollWidth, clientWidth:node.clientWidth })),
    }));
    await capture(page, viewport, 'drills');
    if (!CAPTURE_ONLY) {
      expect(drillMetrics.labels.length).toBeGreaterThan(0);
      for (const label of drillMetrics.labels) {
        expect(label.fontSize).toBeGreaterThanOrEqual(10);
        expect(label.whiteSpace).not.toBe('nowrap');
        expect(label.overflow).not.toBe('hidden');
      }
      for (const detail of drillMetrics.details) {
        expect(detail.fontSize).toBeGreaterThanOrEqual(11);
        expect(detail.whiteSpace).not.toBe('nowrap');
        expect(detail.overflow).not.toBe('hidden');
      }
      const overflow = await noHorizontalOverflow(page);
      expect(overflow.document - overflow.viewport).toBeLessThanOrEqual(1);
      expect(overflow.body - overflow.viewport).toBeLessThanOrEqual(1);
      if (viewport.width <= 430) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(100);
        const access = await page.evaluate(() => {
          const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
          const pageNode = document.querySelector('[data-testid="coach-page-dashboard-drills"]');
          if (!dock || !pageNode) return null;
          const dockRect=dock.getBoundingClientRect(); const pageRect=pageNode.getBoundingClientRect();
          return { dockTop:dockRect.top, pageBottom:pageRect.bottom };
        });
        if (access) expect(access.pageBottom).toBeLessThanOrEqual(access.dockTop + 2);
      }
    }

    evidenceRows.push({ viewport: viewport.width, auth, pulse: pulseMetrics, playerLayout, eventLayout, drillMetrics, pageErrors });
    fs.writeFileSync(path.join(OUTPUT, EVIDENCE, 'metrics.json'), `${JSON.stringify(evidenceRows, null, 2)}\n`);
    if (!CAPTURE_ONLY) expect(pageErrors).toEqual([]);
  });
}