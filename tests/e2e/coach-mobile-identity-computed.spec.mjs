import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(process.cwd(), 'artifacts/coach-mobile-identity-computed');
fs.mkdirSync(OUTPUT, { recursive: true });
const VIEWPORTS = [
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 468, height: 932 },
];

async function safeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterCoachDemo(page) {
  await safeRoutes(page);
  await page.goto('/');
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.getByRole('button', { name: /Coach demo/i }).click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('coach-primary-objective')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
}

function channel(value) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(rgb) { return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]); }
function contrast(a, b) {
  const l1 = luminance(a); const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function parseRgb(value) {
  const parts = String(value).match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return parts?.length === 3 ? parts : [0, 0, 0];
}

for (const viewport of VIEWPORTS) {
  test(`Coach Demo computed identity is bounded and decision-first at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterCoachDemo(page);

    const metrics = await page.evaluate(() => {
      const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; })() : null;
      const hero = document.querySelector('[data-testid="coach-primary-objective"]');
      const header = document.querySelector('[data-testid="mission-control-team-header"]');
      const identity = hero?.querySelector('.mcHeroIdentity');
      const team = hero?.querySelector('.mcProgramIdentity');
      const eyebrow = hero?.querySelector('.mcEyebrow');
      const mark = hero?.querySelector('.mcHeroTeamMark');
      const image = mark?.querySelector('img');
      const title = hero?.querySelector('h1');
      const detail = hero?.querySelector('.mcHeroContent > p');
      const reality = document.querySelector('.mcRealityStrip');
      const menu = header?.querySelector('.mcMobileMenu');
      const bell = header?.querySelector('.mcBell');
      const headerBrand = header?.querySelector('.mcBrandLockup');
      const teamSelect = header?.querySelector('.mcTeamSelect');
      const headerStyle = header ? getComputedStyle(header) : null;
      const menuStyle = menu ? getComputedStyle(menu) : null;
      const bellStyle = bell ? getComputedStyle(bell) : null;
      return {
        viewport: { width: innerWidth, height: innerHeight },
        header: rect(header), identity: rect(identity), hero: rect(hero), team: rect(team), eyebrow: rect(eyebrow), mark: rect(mark), image: rect(image), title: rect(title), detail: rect(detail), reality: rect(reality), menu: rect(menu), bell: rect(bell),
        imageStyle: image ? { objectFit: getComputedStyle(image).objectFit, width: getComputedStyle(image).width, height: getComputedStyle(image).height, position: getComputedStyle(image).position } : null,
        teamColor: team ? getComputedStyle(team).color : '',
        eyebrowColor: eyebrow ? getComputedStyle(eyebrow).color : '',
        heroBackground: hero ? getComputedStyle(hero).backgroundColor : '',
        heroBackgroundImage: hero ? getComputedStyle(hero).backgroundImage : '',
        headerBackground: headerStyle?.backgroundColor || '',
        headerBackgroundImage: headerStyle?.backgroundImage || '',
        headerColor: headerStyle?.color || '',
        menuBackground: menuStyle?.backgroundColor || '',
        menuColor: menuStyle?.color || '',
        bellBackground: bellStyle?.backgroundColor || '',
        bellColor: bellStyle?.color || '',
        headerBrandDisplay: headerBrand ? getComputedStyle(headerBrand).display : 'missing',
        teamSelectDisplay: teamSelect ? getComputedStyle(teamSelect).display : 'missing',
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      };
    });

    expect(metrics.mark.width).toBeGreaterThanOrEqual(100);
    expect(metrics.mark.width).toBeLessThanOrEqual(115);
    expect(metrics.mark.height).toBeGreaterThanOrEqual(100);
    expect(metrics.mark.height).toBeLessThanOrEqual(115);
    expect(metrics.imageStyle.objectFit).toBe('contain');
    expect(metrics.image.left).toBeGreaterThanOrEqual(metrics.mark.left - 1);
    expect(metrics.image.right).toBeLessThanOrEqual(metrics.mark.right + 1);
    expect(metrics.image.top).toBeGreaterThanOrEqual(metrics.mark.top - 1);
    expect(metrics.image.bottom).toBeLessThanOrEqual(metrics.mark.bottom + 1);
    expect(metrics.mark.left).toBeGreaterThanOrEqual(0);
    expect(metrics.mark.right).toBeLessThanOrEqual(viewport.width);

    const identityRegionHeight = metrics.identity.bottom - metrics.header.top;
    expect(identityRegionHeight).toBeGreaterThanOrEqual(160);
    expect(identityRegionHeight).toBeLessThanOrEqual(300);
    expect(metrics.hero.height).toBeGreaterThanOrEqual(400);
    expect(metrics.hero.height).toBeLessThanOrEqual(460);
    expect(metrics.title.top).toBeLessThanOrEqual(310);
    expect(metrics.title.top).toBeLessThan(viewport.height * 0.4);
    expect(metrics.reality.top).toBeLessThan(viewport.height);
    expect(metrics.overflow).toBeLessThanOrEqual(1);

    expect(metrics.headerBrandDisplay).toBe('none');
    expect(metrics.teamSelectDisplay).toBe('none');
    expect(metrics.heroBackgroundImage).not.toContain('titans-exact-logo');
    expect(metrics.mark.top).toBeGreaterThanOrEqual(metrics.menu.bottom - 1);
    expect(metrics.mark.top).toBeGreaterThanOrEqual(metrics.bell.bottom - 1);
    expect(metrics.mark.left).toBeGreaterThanOrEqual(metrics.team.right - 1);

    expect(metrics.headerBackgroundImage).toContain('linear-gradient');
    expect(luminance(parseRgb(metrics.headerBackground))).toBeLessThan(0.2);
    expect(luminance(parseRgb(metrics.headerColor))).toBeGreaterThan(0.75);
    expect(luminance(parseRgb(metrics.menuBackground))).toBeLessThan(0.2);
    expect(luminance(parseRgb(metrics.menuColor))).toBeGreaterThan(0.75);
    expect(luminance(parseRgb(metrics.bellBackground))).toBeLessThan(0.2);
    expect(luminance(parseRgb(metrics.bellColor))).toBeGreaterThan(0.75);

    const bg = parseRgb(metrics.heroBackground || 'rgb(7, 28, 40)');
    expect(contrast(parseRgb(metrics.teamColor), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(parseRgb(metrics.eyebrowColor), bg)).toBeGreaterThanOrEqual(4.5);

    fs.writeFileSync(path.join(OUTPUT, `coach-demo-${viewport.width}x${viewport.height}.json`), `${JSON.stringify({ ...metrics, identityRegionHeight }, null, 2)}\n`);
    if (viewport.width === 390) {
      await page.screenshot({ path: path.join(OUTPUT, 'coach-demo-390x844-initial.png'), animations: 'disabled', fullPage: false });
      await page.screenshot({ path: path.join(OUTPUT, 'coach-demo-390x844-full.png'), animations: 'disabled', fullPage: true });
    }
  });
}
