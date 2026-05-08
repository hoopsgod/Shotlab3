import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppRows, buildRemoteRows, normalizeEventRowForApp, normalizeEventRowForDb } from '../src/lib/remotePersistence.js';

test('event write normalization maps camelCase app keys to snake_case DB keys', () => {
  const row = normalizeEventRowForDb({
    id: 'event-1',
    title: 'Practice',
    date: '2026-05-08',
    time: '6:00 PM',
    location: 'Main Gym',
    desc: 'Shooting reps',
    type: 'workout',
    teamId: 'team-1',
    ownerCoachId: 'Coach@Team.com',
  });

  assert.equal(row.team_id, 'team-1');
  assert.equal(row.owner_coach_id, 'coach@team.com');
  assert.ok(!('teamId' in row));
  assert.ok(!('ownerCoachId' in row));
});

test('event read normalization maps snake_case DB keys to camelCase app keys', () => {
  const row = normalizeEventRowForApp({
    id: 'event-1',
    title: 'Practice',
    date: '2026-05-08',
    time: '6:00 PM',
    location: 'Main Gym',
    desc: 'Shooting reps',
    type: 'workout',
    team_id: 'team-1',
    owner_coach_id: 'coach@team.com',
  });

  assert.equal(row.teamId, 'team-1');
  assert.equal(row.ownerCoachId, 'coach@team.com');
  assert.ok(!('team_id' in row));
  assert.ok(!('owner_coach_id' in row));
});

test('local compatibility: camelCase local event rows still build app rows', () => {
  const rows = buildAppRows('sl:events', [{ id: 42, title: 'Lift', teamId: 'team-2', ownerCoachId: 'coach@team.com' }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, '42');
  assert.equal(rows[0].teamId, 'team-2');
});

test('RSVP compatibility: event.id and rsvp.eventId align after normalization', () => {
  const [event] = buildAppRows('sl:events', [{ id: 99, title: 'Film', team_id: 'team-3', owner_coach_id: 'coach@team.com' }]);
  const [rsvp] = buildAppRows('sl:rsvps', [{ id: 'r1', event_id: 99, team_id: 'team-3', email: 'p@x.com', player_id: 'p@x.com' }]);

  assert.equal(event.id, rsvp.eventId);
});

test('buildRemoteRows normalizes event rows for remote writes', () => {
  const [row] = buildRemoteRows('sl:events', [{ id: 'event-remote', teamId: 'team-4', ownerCoachId: 'coach@team.com' }]);
  assert.equal(row.team_id, 'team-4');
  assert.equal(row.owner_coach_id, 'coach@team.com');
});
