import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveUpcomingSchedule } from '../src/lib/playerDashboardSelectors.js';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

function scPanelSource(source) {
  const start = source.indexOf('function SCPanel(');
  const end = source.indexOf('// ═══════════════════════════════════════\n// HISTORY', start);
  assert.notEqual(start, -1, 'SCPanel function should exist');
  assert.notEqual(end, -1, 'SCPanel history boundary should exist');
  return source.slice(start, end);
}

function coachScSource(source) {
  const start = source.indexOf('{/* ═════════════ S&C MANAGEMENT ═════════════ */}');
  const end = source.indexOf('<CoachProgramScoreDrawer', start);
  assert.notEqual(start, -1, 'Coach S&C management section should exist');
  assert.notEqual(end, -1, 'Coach S&C management boundary should exist');
  return source.slice(start, end);
}

test('player S&C page does not render RSVP attendee names or avatar cards', async () => {
  const source = await appSource();
  const panel = scPanelSource(source);

  assert.doesNotMatch(panel, /sr\.map\(\(r,i\)=>/);
  assert.doesNotMatch(panel, /<Av n=\{r\.name\}[^>]*email=\{r\.email\}/);
  assert.doesNotMatch(panel, /LIFTING LEADERBOARD/);
  assert.match(panel, /RSVP privacy is protected for players/);
  assert.match(panel, /Your RSVP status: \{going\?"Going":"Not RSVP’d"\}/);
});

test('coach S&C view still renders RSVP attendee names with counts and missing count', async () => {
  const source = await appSource();
  const coachSc = coachScSource(source);

  assert.match(coachSc, /const srNames=sr\.map\(r=>r\.name\|\|players\.find\(p=>p\.email===r\.email\)\?\.name\|\|r\.email\)\.filter\(Boolean\);const missing=Math\.max\(0,ups\.length-sr\.length\);/);
  assert.match(coachSc, /\{sr\.length\} confirmed/);
  assert.match(coachSc, /\{missing\} missing/);
  assert.match(coachSc, /\{srNames\.length>0\?srNames\.join\(", "\):"No S&C RSVPs yet"\}/);
});

test('player dashboard includes prominent Upcoming Schedule / Next Up section', async () => {
  const source = await appSource();

  assert.match(source, /title="Upcoming schedule"[\s\S]*testId="player-upcoming-schedule"/);
  assert.match(source, /summary=\{upcomingScheduleItems\.length\?`\$\{upcomingScheduleItems\.length\} scheduled/);
  assert.match(source, /upcomingScheduleItems=deriveUpcomingSchedule\(\{events,rsvps,scSessions,scRsvps,userEmail:u\?\.email,today\}\);/);
});

test('upcoming schedule selector supports both event and S&C session cards with RSVP status', () => {
  const rows = deriveUpcomingSchedule({
    today: '2026-06-09',
    userEmail: 'player@example.com',
    events: [{ id: 'event-1', title: 'Team Practice', date: '2026-06-10', time: '7:00 PM', location: 'Main Gym' }],
    rsvps: [{ eventId: 'event-1', email: 'player@example.com' }],
    scSessions: [{ id: 'sc-1', sport: 'Lower Body Strength', date: '2026-06-11', time: '6:00 AM', location: 'Weight Room' }],
    scRsvps: [],
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.kind), ['event', 'sc']);
  assert.equal(rows[0].rsvpStatus, 'Going');
  assert.equal(rows[1].rsvpStatus, 'Not RSVP’d');
  assert.equal(rows[0].cta, 'Open Events');
  assert.equal(rows[1].cta, 'Open S&C');
});

test('RSVP buttons do not render raw HTML entity text and no dead top Add button exists', async () => {
  const source = await appSource();

  assert.doesNotMatch(source, /&#10003; I\'M GOING/);
  assert.doesNotMatch(source, /RSVP NOW &#8594;/);
  assert.doesNotMatch(source, /&#10003; YOU\'RE IN/);
  assert.doesNotMatch(source, /coach-events-top-create-event/);
  assert.match(source, /<CoachPageDashboardHeader eyebrow="Performance operations" title="Strength & Conditioning Dashboard"[\s\S]*actions=\{\[\{key:"add",label:"Add Session",onClick:openCoachScSessionForm\}\]\}/);
  assert.match(source, /onClick=\{toggleCoachScSessionForm\}[\s\S]*\{showAddSC\?"CANCEL":"\+ ADD SESSION"\}/);
});
