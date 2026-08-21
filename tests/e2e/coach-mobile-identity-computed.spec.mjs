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
  const serialized = String(value).trim();
  const parts = serialized.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (parts?.length === 3 && serialized.startsWith('color(srgb ')) return parts.map((part) => part * 255);
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
      const realityButtons = [...(reality?.querySelectorAll(':scope > button') || [])];
      const primary = hero?.querySelector('.mcPrimary');
      const attention = document.querySelector('.mcAttention');
      const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
      const menu = header?.querySelector('.mcMobileMenu');
      const bell = header?.querySelector('.mcBell');
      const headerBrand = header?.querySelector('.mcBrandLockup');
      const teamSelect = header?.querySelector('.mcTeamSelect');
      const headerStyle = header ? getComputedStyle(header) : null;
      const identityStyle = identity ? getComputedStyle(identity) : null;
      const teamStyle = team ? getComputedStyle(team) : null;
      const titleStyle = title ? getComputedStyle(title) : null;
      const detailStyle = detail ? getComputedStyle(detail) : null;
      const realityStyle = reality ? getComputedStyle(reality) : null;
      const primaryStyle = primary ? getComputedStyle(primary) : null;
      const menuStyle = menu ? getComputedStyle(menu) : null;
      const bellStyle = bell ? getComputedStyle(bell) : null;
      return {
        viewport: { width: innerWidth, height: innerHeight },
        header: rect(header), identity: rect(identity), hero: rect(hero), team: rect(team), eyebrow: rect(eyebrow), mark: rect(mark), image: rect(image), title: rect(title), detail: rect(detail), reality: rect(reality), attention: rect(attention), dock: rect(dock), menu: rect(menu), bell: rect(bell),
        teamIdentitySize: teamStyle ? Number.parseFloat(teamStyle.fontSize) : 0,
        decisionTitleSize: titleStyle ? Number.parseFloat(titleStyle.fontSize) : 0,
        imageStyle: image ? { objectFit: getComputedStyle(image).objectFit, width: getComputedStyle(image).width, height: getComputedStyle(image).height, position: getComputedStyle(image).position } : null,
        teamColor: team ? getComputedStyle(team).color : '',
        eyebrowColor: eyebrow ? getComputedStyle(eyebrow).color : '',
        heroBackground: hero ? getComputedStyle(hero).backgroundColor : '',
        heroBackgroundImage: hero ? getComputedStyle(hero).backgroundImage : '',
        identityBackground: identityStyle?.backgroundColor || '',
        identityBackgroundImage: identityStyle?.backgroundImage || '',
        detailBackgroundColor: detailStyle?.backgroundColor || '',
        detailBackgroundImage: detailStyle?.backgroundImage || '',
        realityBackgroundColor: realityStyle?.backgroundColor || '',
        realityBackgroundImage: realityStyle?.backgroundImage || '',
        realityBackground: realityStyle?.background || '',
        realityBorder: realityStyle?.borderBottom || '',
        realityColumns: realityStyle?.gridTemplateColumns.split(' ').filter(Boolean).length || 0,
        metricButtons: realityButtons.map((button) => ({
          background: getComputedStyle(button).backgroundColor,
          borderLeft: getComputedStyle(button).borderLeft,
          height: button.getBoundingClientRect().height,
          valueColor: getComputedStyle(button.querySelector('strong')).color,
          labelColor: getComputedStyle(button.querySelector('small')).color,
        })),
        primaryBackground: primaryStyle?.backgroundColor || '',
        primaryColor: primaryStyle?.color || '',
        primaryBorder: primaryStyle?.border || '',
        primaryHeight: primary?.getBoundingClientRect().height || 0,
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
    // Mission Control intentionally keeps team identity compact and gives the decision headline title authority.
    expect(metrics.teamIdentitySize).toBeGreaterThanOrEqual(14);
    expect(metrics.teamIdentitySize).toBeLessThanOrEqual(20);
    expect(metrics.decisionTitleSize).toBeGreaterThanOrEqual(30);
    expect(metrics.decisionTitleSize).toBeLessThanOrEqual(48);
    expect(metrics.decisionTitleSize - metrics.teamIdentitySize).toBeGreaterThanOrEqual(12);
    expect(metrics.hero.height).toBeGreaterThanOrEqual(400);
    expect(metrics.hero.height).toBeLessThanOrEqual(580);
    expect(metrics.title.top).toBeGreaterThanOrEqual(metrics.identity.bottom - 1);
    expect(metrics.title.top).toBeLessThanOrEqual(metrics.identity.bottom + 48);
    expect(metrics.detail.top).toBeGreaterThanOrEqual(metrics.title.top);
    expect(metrics.title.height).toBeLessThanOrEqual(90);
    expect(Math.abs(metrics.title.left - metrics.detail.left)).toBeLessThanOrEqual(1);
    expect(metrics.title.right).toBeLessThanOrEqual(metrics.detail.right + 1);
    expect(metrics.title.width).toBeLessThanOrEqual(metrics.detail.width + 1);
    expect(Math.abs(metrics.detail.left - metrics.reality.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.detail.right - metrics.reality.right)).toBeLessThanOrEqual(1);
    expect(metrics.detailBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(metrics.detailBackgroundImage).toContain('linear-gradient');
    expect(metrics.reality.top).toBeGreaterThanOrEqual(metrics.detail.bottom - 1);
    expect(metrics.reality.top).toBeLessThan(viewport.height);
    expect(metrics.realityBackgroundImage).toContain('linear-gradient');
    expect(metrics.realityBackground).not.toBe('rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box');
    expect(metrics.realityBorder).toContain('solid');
    expect(metrics.realityColumns).toBe(3);
    expect(metrics.metricButtons).toHaveLength(3);
    for (const metric of metrics.metricButtons) {
      expect(metric.background).toBe('rgba(0, 0, 0, 0)');
      expect(metric.height).toBeGreaterThanOrEqual(44);
      expect(contrast(parseRgb(metric.valueColor), [7, 24, 32])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(parseRgb(metric.labelColor), [7, 24, 32])).toBeGreaterThanOrEqual(4.5);
    }
    expect(metrics.primaryHeight).toBeGreaterThanOrEqual(54);
    expect(metrics.primaryBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(metrics.primaryColor).toBe('rgb(7, 16, 7)');
    expect(metrics.primaryBorder).toContain('solid');
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.attention.top).toBeLessThan(metrics.dock.top);

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

    expect(metrics.identityBackgroundImage).toContain('linear-gradient');
    expect(luminance(parseRgb(metrics.identityBackground))).toBeLessThan(0.2);
    expect(luminance(parseRgb(metrics.heroBackground))).toBeGreaterThan(0.75);
    const identityBg = parseRgb(metrics.identityBackground || 'rgb(6, 25, 35)');
    expect(contrast(parseRgb(metrics.teamColor), identityBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(parseRgb(metrics.eyebrowColor), identityBg)).toBeGreaterThanOrEqual(4.5);

    fs.writeFileSync(path.join(OUTPUT, `coach-demo-${viewport.width}x${viewport.height}.json`), `${JSON.stringify({ ...metrics, identityRegionHeight }, null, 2)}\n`);
    if (viewport.width === 390) {
      await page.screenshot({ path: path.join(OUTPUT, 'coach-demo-390x844-initial.png'), animations: 'disabled', fullPage: false });
      await page.screenshot({ path: path.join(OUTPUT, 'coach-demo-390x844-full.png'), animations: 'disabled', fullPage: true });
    }
  });
}
