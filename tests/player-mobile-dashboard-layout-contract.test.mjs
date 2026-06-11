import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('player home mobile dashboard keeps mission, schedule, primary shot CTA, and schedule CTAs', () => {
  assert.match(source, /className="player-home-compact-dashboard"/);
  assert.match(source, /aria-label="Today's mission"/);
  assert.match(source, /TODAY'S MISSION/);
  assert.match(source, /const missionCtaLabel="Log Shots";/);
  assert.match(source, /\{missionCtaLabel\.toUpperCase\(\)\}/);
  assert.match(source, /aria-label="Upcoming Schedule" data-testid="player-upcoming-schedule"/);
  assert.match(source, /UPCOMING SCHEDULE/);
  assert.match(source, /className="pageHeaderPill player-dashboard-scheduleCta" onClick=\{\(\)=>switchTab\(item\.target\)\}/);
});

test('player home compact mobile layer is scoped to dashboard presentation tokens', () => {
  assert.match(source, /const _PLAYER_COMPACT_DASHBOARD_CSS=`/);
  assert.match(source, /--player-dashboard-card-pad/);
  assert.match(source, /--player-dashboard-card-pad-compact/);
  assert.match(source, /--player-dashboard-chip-pad/);
  assert.match(source, /--player-dashboard-logo-size/);
  assert.match(source, /--player-dashboard-gap/);
  assert.match(source, /--player-dashboard-section-title/);
  assert.match(source, /@media \(max-width:767px\)/);
  assert.match(source, /\.player-home-compact-dashboard/);
  assert.match(source, /className=\{tab==="home"&&!active\?"player-mobile-header player-home-compactHeader":"player-mobile-header"\}/);
  assert.match(source, /className=\{tab==="home"&&!active\?"player-mobile-scroll player-home-compactScroll":"player-mobile-scroll"\}/);
  const compactCss = source.match(/const _PLAYER_COMPACT_DASHBOARD_CSS=`([\s\S]*?)`;\nconst Styles=\(\)=>/)?.[1] || '';
  assert.doesNotMatch(compactCss, /!important/);
});

test('player home schedule section is not removed and still derives event plus S&C cards', () => {
  assert.match(source, /const upcomingScheduleItems=deriveUpcomingSchedule\(\{events,rsvps,scSessions,scRsvps,userEmail:u\?\.email,today\}\);/);
  assert.match(source, /upcomingScheduleItems\.length===0\?/);
  assert.match(source, /upcomingScheduleItems\.map\(item=>/);
  assert.match(source, /No upcoming event or S&C session is scheduled yet\./);
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
