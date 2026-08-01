import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const playerHeaderSource = readFileSync(new URL('../src/components/PlayerDashboardHeader.jsx', import.meta.url), 'utf8');

test('player home mobile dashboard keeps mission, schedule, primary shot CTA, and schedule CTAs', () => {
  assert.match(source, /className="player-home-compact-dashboard"/);
  assert.match(source, /<PlayerDailyCommandCenter model=\{dailyCommandModel\} onAction=\{handleDailyCommandAction\}\/>/);
  assert.match(source, /const missionCtaLabel="Log Shots";/);
  assert.match(source, /title="Upcoming schedule"[\s\S]*testId="player-upcoming-schedule"/);
  assert.match(source, /onClick=\{\(\)=>switchTab\(item\.target\)\}/);
});

test('player home compact mobile layer is scoped to dashboard presentation tokens', () => {
  assert.match(source, /const _PLAYER_COMPACT_DASHBOARD_CSS=`/);
  assert.match(source, /--player-dashboard-card-pad/);
  assert.match(source, /--player-dashboard-card-pad-compact/);
  assert.match(source, /--player-dashboard-chip-pad/);
  assert.match(source, /--player-dashboard-gap/);
  assert.match(source, /--player-dashboard-section-title/);
  assert.match(source, /@media \(max-width:767px\)/);
  assert.match(source, /\.player-home-compact-dashboard/);
  assert.doesNotMatch(source, /player-mobile-header/);
  assert.doesNotMatch(source, /player-home-compactHeader/);
  assert.doesNotMatch(source, /player-home-compactScroll/);
  const compactCss = source.match(/const _PLAYER_COMPACT_DASHBOARD_CSS=`([\s\S]*?)`;\nconst Styles=\(\)=>/)?.[1] || '';
  assert.doesNotMatch(compactCss, /!important/);
});

test('player home schedule section is not removed and still derives event plus S&C cards', () => {
  assert.match(source, /const upcomingScheduleItems=deriveUpcomingSchedule\(\{events,rsvps,scSessions,scRsvps,userEmail:u\?\.email,today\}\);/);
  assert.match(source, /upcomingScheduleItems\.length===0\?/);
  assert.match(source, /upcomingScheduleItems\.map\(item=>/);
  assert.match(source, /No upcoming event or S&amp;C session is scheduled yet\./);
});

test('presentation-only dashboard PR leaves shot logging, event RSVP, and S&C handler names intact', () => {
  assert.match(source, /const addShotLog=async\(made,date\)=>/);
  assert.match(source, /const retryHomeShotLog=async\(log\)=>/);
  assert.match(source, /const toggleRsvp=async\(eid\)=>/);
  assert.match(source, /const addRsvp=async\(eid,email,name\)=>/);
  assert.match(source, /const removeRsvp=async\(eid,email\)=>/);
  assert.match(source, /const toggleScRsvp=async\(sid\)=>/);
  assert.match(source, /const addScLog=async\(log\)=>/);
  assert.match(source, /const handleAddScLog=async\(\)=>/);
});

test('player dashboard uses iOS safe-area bottom spacing in its mobile scroll container', () => {
  assert.match(source, /\.player-scroll-container\{--player-scroll-bottom-padding:calc\(var\(--bottom-nav-content-padding, 88px\) \+ 24px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(source, /@media \(max-width:767px\)\{[\s\S]*\.player-scroll-container\{--player-scroll-bottom-padding:calc\(var\(--bottom-nav-content-padding, 88px\) \+ 24px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(source, /className="player-scroll-container"/);
  assert.match(source, /padding:isDesktop\?"14px 20px 36px":"16px 20px var\(--player-scroll-bottom-padding\)"/);
  assert.match(source, /scroll-padding-bottom:var\(--player-scroll-bottom-padding\)/);
  assert.match(source, /-webkit-overflow-scrolling:touch/);
});

test('bottom nav and floating mobile controls reserve enough content padding to avoid overlap', () => {
  assert.match(source, /const navHeight=82;/);
  assert.match(source, /const baseBottom=isLikelyMobileSafari\?32:18;/);
  assert.match(source, /root\.style\.setProperty\("--bottom-nav-offset",`calc\(\$\{baseBottom\}px \+ env\(safe-area-inset-bottom, 0px\) \+ \$\{Math\.round\(visualOffset\)\}px\)`\);/);
  assert.match(source, /root\.style\.setProperty\("--bottom-nav-content-padding",`calc\(\$\{navHeight\+baseBottom\+36\}px \+ env\(safe-area-inset-bottom, 0px\) \+ \$\{Math\.round\(keyboardInset\)\}px\)`\);/);
  assert.match(source, /className="bottom-nav"[\s\S]*left:"max\(12px, env\(safe-area-inset-left, 0px\)\)"/);
  assert.match(source, /className="bottom-nav"[\s\S]*right:"max\(12px, env\(safe-area-inset-right, 0px\)\)"/);
  assert.match(source, /className="bottom-nav"[\s\S]*bottom:"var\(--bottom-nav-offset, max\(28px, calc\(env\(safe-area-inset-bottom, 0px\) \+ 18px\)\)\)"/);
  assert.match(source, /className="bottom-nav"[\s\S]*borderRadius:22/);
});

test('player dashboard header still renders the large team brand mark and keeps player theme out', () => {
  assert.match(source, /<PlayerDashboardHeader[\s\S]*userName=\{u\.name\}/);
  assert.match(playerHeaderSource, /useTeamBranding/);
  assert.match(playerHeaderSource, /<img className=\{styles\.brandMark\}/);
  assert.doesNotMatch(source, /aria-label="Player Theme"|>Player Theme<|Toggle theme/);
});

test('log shots and dashboard navigation handlers remain wired from the player home shell', () => {
  assert.match(source, /const missionCtaLabel="Log Shots";/);
  assert.match(source, /const handleDailyCommandAction=useCallback\(\(action=\{\}\)=>\{[\s\S]*switchTab\(target\)/);
  assert.match(source, /<PlayerDailyCommandCenter model=\{dailyCommandModel\} onAction=\{handleDailyCommandAction\}\/>/);
  assert.match(source, /onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(source, /onClick=\{\(\)=>switchTab\(item\.target\)\}/);
  assert.match(source, /<MobileNavigation primaryItems=\{playerMobilePrimaryItems\} secondaryItems=\{playerMobileSecondaryItems\} activeKey=\{tab\} onChange=\{switchTab\}/);
  ['addShotLog', 'toggleRsvp', 'toggleScRsvp', 'homeShotsLeaderboard', 'refreshHomeShotsLeaderboard'].forEach((handlerName) => {
    assert.equal(source.includes(handlerName), true, `${handlerName} should remain present`);
  });
});
