import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(process.cwd(), 'artifacts/phase1-mobile-layout-readability');
const EVIDENCE = process.env.PHASE1_EVIDENCE || 'after';
const CAPTURE_ONLY = process.env.PHASE1_CAPTURE_ONLY === '1';
const VIEWPORTS = [
  { width: 320, height: 844 }, { width: 375, height: 844 },
  { width: 390, height: 844 }, { width: 430, height: 932 },
  { width: 768, height: 1024 }, { width: 1280, height: 900 },
];
fs.mkdirSync(path.join(OUTPUT, EVIDENCE), { recursive: true });
const evidence = [];

const close = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;
const rgb = (value = '') => {
  const m = String(value).match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/i);
  return m ? m.slice(1, 4).map(Number) : null;
};
const channel = (value) => { const v=value/255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4; };
const luminance = (c) => .2126*channel(c[0]) + .7152*channel(c[1]) + .0722*channel(c[2]);
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', r => r.fulfill({ status:200, contentType:'application/json', body:'{"ok":true,"archives":[]}' }));
  await page.route('**/v1/leaderboards/home-shots**', r => r.fulfill({ status:200, contentType:'application/json', body:'{"leaderboard":[]}' }));
  await page.route('**/v1/coach/players/provision**', r => r.fulfill({ status:200, contentType:'application/json', body:'{"ok":true,"invitations":[]}' }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, r => r.fulfill({ status:200, contentType:'application/json', body:'[]' }));
}
async function waitForAuth(page) {
  const card=page.locator('.auth-card-enter');
  await expect(card).toBeVisible({timeout:30000});
  await expect(card.locator('input[type="email"]')).toBeVisible();
  await expect(card.locator('input[type="password"]')).toBeVisible();
  await expect(card.locator(':scope > button.cta-primary')).toBeVisible();
}
async function freeze(page) {
  await page.addStyleTag({ content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.fonts?.ready);
}
async function shot(page, viewport, name) {
  if (viewport.width === 390) await page.screenshot({ path:path.join(OUTPUT,EVIDENCE,`390-${name}.png`), fullPage:true });
}
async function overflow(page) {
  return page.evaluate(() => ({ viewport:innerWidth, doc:document.documentElement.scrollWidth, body:document.body.scrollWidth }));
}
async function assertNoPageOverflow(page) {
  const size=await overflow(page); expect(size.doc-size.viewport).toBeLessThanOrEqual(1); expect(size.body-size.viewport).toBeLessThanOrEqual(1);
}
async function navigate(page, key) {
  let item=page.locator(`[data-nav-key="${key}"]:visible`).first();
  if (!(await item.count())) {
    const desktopLabels={players:'Players',events:'Events',drills:'Drills'};
    const desktopNav=page.locator('.sidebar-nav[aria-label="Coach navigation"]:visible');
    if (await desktopNav.count()) {
      item=desktopNav.locator('.nav-item:visible').filter({hasText:desktopLabels[key]}).first();
    } else {
      const more=page.getByTestId('mobile-navigation-more');
      await expect(more).toBeVisible();
      await more.click();
      item=page.locator(`[data-nav-key="${key}"]:visible`).first();
    }
  }
  await expect(item).toBeVisible();
  await item.click();
  await page.waitForTimeout(180);
}
async function enterCoachDemo(page) {
  const button=page.getByRole('button',{name:/Coach demo/i});
  await expect(button).toBeVisible({timeout:20000});
  await button.click();
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({timeout:20000});
  await page.waitForTimeout(250);
}

for (const viewport of VIEWPORTS) {
  test(`Phase 1 Coach surfaces remain bounded and readable at ${viewport.width}px`, async ({page}) => {
    const pageErrors=[]; page.on('pageerror', e => pageErrors.push(e.message));
    await page.setViewportSize(viewport); await installSafeRoutes(page); await page.goto('/'); await waitForAuth(page); await freeze(page);

    const auth=await page.evaluate(() => {
      const rect=(n)=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
      const card=document.querySelector('.auth-card-enter');
      return { card:rect(card), email:rect(card.querySelector('input[type="email"]')), password:rect(card.querySelector('input[type="password"]')), button:rect(card.querySelector(':scope > button.cta-primary')) };
    });
    await shot(page,viewport,'signin');
    if (!CAPTURE_ONLY && viewport.width <= 430) {
      expect(close(auth.email.left,auth.password.left)).toBe(true); expect(close(auth.email.right,auth.password.right)).toBe(true);
      expect(close(auth.email.left,auth.button.left)).toBe(true); expect(close(auth.email.right,auth.button.right)).toBe(true);
      for (const control of [auth.email,auth.password,auth.button]) { expect(control.left).toBeGreaterThanOrEqual(auth.card.left-1); expect(control.right).toBeLessThanOrEqual(auth.card.right+1); }
    }
    if (!CAPTURE_ONLY) await assertNoPageOverflow(page);

    await enterCoachDemo(page);
    const assignment=page.getByTestId('coach-assignment-accountability');
    await expect(assignment).toBeVisible({timeout:10000});
    const dashboard=await page.evaluate(() => {
      const panel=document.querySelector('[data-testid="coach-program-pulse"]');
      const lead=panel.querySelector('.mcPulseLead'), score=panel.querySelector('.mcHealthScore'), heading=panel.querySelector('h2'), caption=panel.querySelector('.mcPulseCaption');
      const original=score.textContent;
      const pulse=['0%','50%','100%'].map(value=>{score.textContent=value;const r=score.getBoundingClientRect(),l=lead.getBoundingClientRect(),h=heading.getBoundingClientRect();return {value,left:r.left,right:r.right,top:r.top,bottom:r.bottom,leadRight:l.right,leadTop:l.top,leadBottom:l.bottom,headingRight:h.right,fontSize:parseFloat(getComputedStyle(score).fontSize)}});
      score.textContent=original;
      const facts=[...document.querySelectorAll('.mcAssignmentStateFact')].map(node=>{const r=node.getBoundingClientRect(),label=node.querySelector('small');return {top:r.top,left:r.left,right:r.right,labelSize:parseFloat(getComputedStyle(label).fontSize)}});
      const p=panel.getBoundingClientRect(),c=caption.getBoundingClientRect();
      return { pulse, facts, panel:{left:p.left,right:p.right}, caption:{left:c.left,right:c.right} };
    });
    await shot(page,viewport,'dashboard');
    if (!CAPTURE_ONLY) {
      expect(dashboard.facts).toHaveLength(5); for (const fact of dashboard.facts) expect(fact.labelSize).toBeGreaterThanOrEqual(9);
      if (viewport.width <= 420) {
        expect(close(dashboard.facts[0].top,dashboard.facts[1].top,1)).toBe(true);
        expect(close(dashboard.facts[2].top,dashboard.facts[3].top,1)).toBe(true); expect(close(dashboard.facts[3].top,dashboard.facts[4].top,1)).toBe(true);
        expect(dashboard.facts[2].top).toBeGreaterThan(dashboard.facts[0].top+1);
      } else expect(dashboard.facts.every(f=>close(f.top,dashboard.facts[0].top,1))).toBe(true);
      if (viewport.width <= 430) {
        for (const sample of dashboard.pulse) {
          expect(sample.fontSize).toBeGreaterThanOrEqual(36); expect(sample.fontSize).toBeLessThanOrEqual(44);
          expect(sample.left).toBeGreaterThanOrEqual(sample.headingRight+11); expect(sample.right).toBeLessThanOrEqual(sample.leadRight+1);
          expect(sample.top).toBeGreaterThanOrEqual(sample.leadTop-1); expect(sample.bottom).toBeLessThanOrEqual(sample.leadBottom+1);
        }
      }
      expect(dashboard.caption.left).toBeGreaterThanOrEqual(dashboard.panel.left-1); expect(dashboard.caption.right).toBeLessThanOrEqual(dashboard.panel.right+1);
      await assertNoPageOverflow(page);
    }

    await navigate(page,'players');
    const playerRail=page.getByTestId('coach-players-filter-rail'); await expect(playerRail).toBeVisible({timeout:10000});
    const players=await playerRail.evaluate(rail=>{
      const r=n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width}};
      const effectiveBackground=(node)=>{
        for(let current=node;current;current=current.parentElement){
          const value=getComputedStyle(current).backgroundColor;
          const match=value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
          if(!match) continue;
          const alpha=match[4] == null ? 1 : Number(match[4]);
          if(alpha >= .99) return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
        }
        return 'rgb(255, 255, 255)';
      };
      const search=rail.querySelector('label'),group=rail.querySelector('[role="group"]'),summary=document.querySelector('[data-testid="coach-players-command-bar"] [class*="summary"]'),style=getComputedStyle(rail);
      return {rail:r(rail),search:r(search),group:r(group),railScroll:rail.scrollWidth-rail.clientWidth,groupScroll:group.scrollWidth-group.clientWidth,paddingLeft:parseFloat(style.paddingLeft)||0,paddingRight:parseFloat(style.paddingRight)||0,summaryColor:getComputedStyle(summary).color,summaryBackground:effectiveBackground(summary)};
    });
    await shot(page,viewport,'players');
    if (!CAPTURE_ONLY) {
      if (viewport.width <= 820) {
        expect(close(players.search.left,players.rail.left+players.paddingLeft,2)).toBe(true); expect(close(players.search.right,players.rail.right-players.paddingRight,2)).toBe(true);
        expect(players.group.top).toBeGreaterThanOrEqual(players.search.bottom-1); expect(players.railScroll).toBeLessThanOrEqual(1); expect(players.groupScroll).toBeLessThanOrEqual(1);
      }
      const color=rgb(players.summaryColor),background=rgb(players.summaryBackground); if (color&&background) expect(contrast(color,background)).toBeGreaterThanOrEqual(4.5);
      await assertNoPageOverflow(page);
    }

    await navigate(page,'events');
    const eventRail=page.getByTestId('coach-events-filter-rail'); await expect(eventRail).toBeVisible({timeout:10000});
    const schedule=await eventRail.evaluate(rail=>{
      const r=n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width}};
      const search=rail.querySelector('label'),group=rail.querySelector('[role="group"]'),input=rail.querySelector('input'),trailing=rail.lastElementChild;
      return {rail:r(rail),search:r(search),group:r(group),trailing:r(trailing),placeholder:getComputedStyle(input,'::placeholder').color};
    });
    await shot(page,viewport,'schedule');
    if (!CAPTURE_ONLY) {
      if (viewport.width <= 760) {
        expect(close(schedule.search.left,schedule.rail.left,2)).toBe(true); expect(close(schedule.search.right,schedule.rail.right,2)).toBe(true);
        expect(schedule.group.top).toBeGreaterThanOrEqual(schedule.search.bottom-1); expect(schedule.trailing.top).toBeGreaterThanOrEqual(schedule.group.bottom-1);
        const color=rgb(schedule.placeholder); if (color) expect(contrast(color,[255,255,255])).toBeGreaterThanOrEqual(4.5);
      }
      await assertNoPageOverflow(page);
    }

    await navigate(page,'drills');
    const drills=page.getByTestId('coach-page-dashboard-drills-decision-brief'); await expect(drills).toBeVisible({timeout:10000});
    const drillMetrics=await drills.evaluate(stage=>({
      labels:[...stage.querySelectorAll('[data-route-stage-metric-label]')].map(n=>({fontSize:parseFloat(getComputedStyle(n).fontSize),whiteSpace:getComputedStyle(n).whiteSpace,overflow:getComputedStyle(n).overflow})),
      details:[...stage.querySelectorAll('[data-route-stage-metric-detail]')].map(n=>({fontSize:parseFloat(getComputedStyle(n).fontSize),whiteSpace:getComputedStyle(n).whiteSpace,overflow:getComputedStyle(n).overflow})),
    }));
    await shot(page,viewport,'drills');
    if (!CAPTURE_ONLY) {
      expect(drillMetrics.labels.length).toBeGreaterThan(0);
      for (const label of drillMetrics.labels) { expect(label.fontSize).toBeGreaterThanOrEqual(10); expect(label.whiteSpace).not.toBe('nowrap'); expect(label.overflow).not.toBe('hidden'); }
      for (const detail of drillMetrics.details) { expect(detail.fontSize).toBeGreaterThanOrEqual(11); expect(detail.whiteSpace).not.toBe('nowrap'); expect(detail.overflow).not.toBe('hidden'); }
      await assertNoPageOverflow(page);
      if (viewport.width <= 430) {
        await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight)); await page.waitForTimeout(80);
        const access=await page.evaluate(()=>{const d=document.querySelector('[data-testid="mobile-navigation-dock"]'),p=document.querySelector('[data-testid="coach-page-dashboard-drills"]');if(!d||!p)return null;return {dockTop:d.getBoundingClientRect().top,pageBottom:p.getBoundingClientRect().bottom}});
        if (access) expect(access.pageBottom).toBeLessThanOrEqual(access.dockTop+2);
      }
      expect(pageErrors).toEqual([]);
    }

    evidence.push({viewport:viewport.width,auth,dashboard,players,schedule,drillMetrics,pageErrors});
    fs.writeFileSync(path.join(OUTPUT,EVIDENCE,'metrics.json'),`${JSON.stringify(evidence,null,2)}\n`);
  });
}