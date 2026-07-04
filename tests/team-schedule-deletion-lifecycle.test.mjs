import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deleteTeamEvent, deleteTeamScSession } from '../src/lib/teamScheduleDeletion.js';

const coach = { role: 'coach', teamId: 'team-a', email: 'coach@team-a.test' };
const player = { role: 'player', teamId: 'team-a', email: 'player@team-a.test' };

const fixtures = () => ({
  events: [
    { id: 'event-delete', teamId: 'team-a', title: 'Old Event' },
    { id: 'event-keep', teamId: 'team-a', title: 'Future Event' },
    { id: 'event-delete', teamId: 'team-b', title: 'Other Team Same Id' },
  ],
  rsvps: [
    { id: 'rsvp-delete', eventId: 'event-delete', teamId: 'team-a', email: 'one@team-a.test' },
    { id: 'rsvp-keep-event', eventId: 'event-keep', teamId: 'team-a', email: 'two@team-a.test' },
    { id: 'rsvp-keep-team', eventId: 'event-delete', teamId: 'team-b', email: 'one@team-b.test' },
  ],
  scSessions: [
    { id: 'sc-delete', teamId: 'team-a', sport: 'Lift' },
    { id: 'sc-keep', teamId: 'team-a', sport: 'Recovery' },
    { id: 'sc-delete', teamId: 'team-b', sport: 'Other Lift' },
  ],
  scRsvps: [
    { id: 'sc-rsvp-delete', sessionId: 'sc-delete', teamId: 'team-a', email: 'one@team-a.test' },
    { id: 'sc-rsvp-keep-session', sessionId: 'sc-keep', teamId: 'team-a', email: 'two@team-a.test' },
    { id: 'sc-rsvp-keep-team', sessionId: 'sc-delete', teamId: 'team-b', email: 'one@team-b.test' },
  ],
  scLogs: [
    { id: 'sc-log-delete', sessionId: 'sc-delete', teamId: 'team-a', email: 'one@team-a.test' },
    { id: 'sc-log-keep-session', sessionId: 'sc-keep', teamId: 'team-a', email: 'two@team-a.test' },
    { id: 'sc-log-keep-team', sessionId: 'sc-delete', teamId: 'team-b', email: 'one@team-b.test' },
  ],
  players: [{ email: 'one@team-a.test', teamId: 'team-a' }],
  scores: [{ id: 'score-1', teamId: 'team-a' }],
  shotLogs: [{ id: 'shot-1', teamId: 'team-a' }],
  drills: [{ id: 'drill-1' }],
  teamBranding: { teamId: 'team-a', primary: '#c8ff00' },
  aqCoach: { email: 'aq@shotlab.test' },
});

test('coach can delete one event; deleted event disappears from coach/player lists and matching RSVPs only', () => {
  const data = fixtures();
  const result = deleteTeamEvent({ events: data.events, rsvps: data.rsvps, eventId: 'event-delete', teamId: 'team-a', user: coach });
  assert.equal(result.ok, true);
  assert.deepEqual(result.events.filter(e => e.teamId === 'team-a').map(e => e.id), ['event-keep']);
  assert.deepEqual(result.rsvps.filter(r => r.teamId === 'team-a').map(r => r.id), ['rsvp-keep-event']);
  assert.ok(result.events.some(e => e.id === 'event-delete' && e.teamId === 'team-b'));
  assert.ok(result.rsvps.some(r => r.eventId === 'event-delete' && r.teamId === 'team-b'));
  assert.deepEqual(data.players, [{ email: 'one@team-a.test', teamId: 'team-a' }]);
  assert.deepEqual(data.scores, [{ id: 'score-1', teamId: 'team-a' }]);
  assert.deepEqual(data.shotLogs, [{ id: 'shot-1', teamId: 'team-a' }]);
  assert.deepEqual(data.scSessions.map(s => s.id), ['sc-delete', 'sc-keep', 'sc-delete']);
  assert.deepEqual(data.drills, [{ id: 'drill-1' }]);
  assert.deepEqual(data.teamBranding, { teamId: 'team-a', primary: '#c8ff00' });
  assert.deepEqual(data.aqCoach, { email: 'aq@shotlab.test' });
});

test('players cannot delete team events', () => {
  const data = fixtures();
  const result = deleteTeamEvent({ events: data.events, rsvps: data.rsvps, eventId: 'event-delete', teamId: 'team-a', user: player });
  assert.equal(result.ok, false);
  assert.equal(result.events.length, data.events.length);
  assert.equal(result.rsvps.length, data.rsvps.length);
});

test('coach can delete one S&C session; deleted session disappears from coach/player views and matching RSVPs/logs only', () => {
  const data = fixtures();
  const result = deleteTeamScSession({ scSessions: data.scSessions, scRsvps: data.scRsvps, scLogs: data.scLogs, sessionId: 'sc-delete', teamId: 'team-a', user: coach });
  assert.equal(result.ok, true);
  assert.deepEqual(result.scSessions.filter(s => s.teamId === 'team-a').map(s => s.id), ['sc-keep']);
  assert.deepEqual(result.scRsvps.filter(r => r.teamId === 'team-a').map(r => r.id), ['sc-rsvp-keep-session']);
  assert.deepEqual(result.scLogs.filter(l => l.teamId === 'team-a').map(l => l.id), ['sc-log-keep-session']);
  assert.ok(result.scSessions.some(s => s.id === 'sc-delete' && s.teamId === 'team-b'));
  assert.ok(result.scRsvps.some(r => r.sessionId === 'sc-delete' && r.teamId === 'team-b'));
  assert.ok(result.scLogs.some(l => l.sessionId === 'sc-delete' && l.teamId === 'team-b'));
  assert.deepEqual(data.players, [{ email: 'one@team-a.test', teamId: 'team-a' }]);
  assert.deepEqual(data.scores, [{ id: 'score-1', teamId: 'team-a' }]);
  assert.deepEqual(data.shotLogs, [{ id: 'shot-1', teamId: 'team-a' }]);
  assert.deepEqual(data.events.map(e => e.id), ['event-delete', 'event-keep', 'event-delete']);
  assert.deepEqual(data.drills, [{ id: 'drill-1' }]);
  assert.deepEqual(data.teamBranding, { teamId: 'team-a', primary: '#c8ff00' });
  assert.deepEqual(data.aqCoach, { email: 'aq@shotlab.test' });
});

test('players cannot delete S&C sessions', () => {
  const data = fixtures();
  const result = deleteTeamScSession({ scSessions: data.scSessions, scRsvps: data.scRsvps, scLogs: data.scLogs, sessionId: 'sc-delete', teamId: 'team-a', user: player });
  assert.equal(result.ok, false);
  assert.equal(result.scSessions.length, data.scSessions.length);
  assert.equal(result.scRsvps.length, data.scRsvps.length);
  assert.equal(result.scLogs.length, data.scLogs.length);
});

test('App deletion controls are coach-only through Coach props and require confirmation copy', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /<Coach[\s\S]*removeEvent=\{removeEvent\}[\s\S]*removeScSession=\{removeScSession\}/);
  const playerRender = source.match(/<Player u=\{user\}[\s\S]*?\/>/)[0];
  assert.doesNotMatch(playerRender, /removeEvent=/);
  assert.doesNotMatch(playerRender, /removeScSession=/);
  assert.match(source, /Delete this event from the team schedule and remove linked RSVP records\? Player accounts and other team data will not be deleted\./);
  assert.match(source, /Delete this S&C session from the team schedule and remove linked RSVP\/log records\? Player accounts and other team data will not be deleted\./);
  assert.match(source, /DELETE S&amp;C SESSION/);
});
