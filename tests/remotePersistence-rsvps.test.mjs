import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppRows,
  buildRemoteRows,
  normalizeRsvpRowForApp,
  normalizeRsvpRowForDb,
} from '../src/lib/remotePersistence.js';

test('RSVP write normalization converts camelCase app row to snake_case DB row', () => {
  const appRow = {
    id: 'rsvp-1',
    eventId: 'event-1',
    teamId: 'team-1',
    playerId: 'Player@Email.com',
    email: 'Player@Email.com',
    name: 'Player One',
    ts: 12345,
  };

  assert.deepEqual(normalizeRsvpRowForDb(appRow), {
    id: 'rsvp-1',
    event_id: 'event-1',
    team_id: 'team-1',
    player_id: 'Player@Email.com',
    email: 'player@email.com',
    name: 'Player One',
    ts: 12345,
  });
});

test('RSVP read normalization converts snake_case DB row to camelCase app row', () => {
  const dbRow = {
    id: 'rsvp-2',
    event_id: 'event-2',
    team_id: 'team-2',
    player_id: 'p2@example.com',
    email: 'P2@Example.com',
    name: 'Player Two',
    ts: 67890,
  };

  assert.deepEqual(normalizeRsvpRowForApp(dbRow), {
    id: 'rsvp-2',
    eventId: 'event-2',
    teamId: 'team-2',
    playerId: 'p2@example.com',
    email: 'p2@example.com',
    name: 'Player Two',
    ts: 67890,
  });
});

test('Mixed compatibility keeps existing local camelCase RSVP rows working', () => {
  const localRows = [{
    id: 'rsvp-3',
    eventId: 'event-3',
    teamId: 'team-3',
    playerId: 'p3@example.com',
    email: 'P3@Example.com',
    name: 'Player Three',
    ts: 456,
  }];

  assert.deepEqual(buildAppRows('sl:rsvps', localRows), [{
    id: 'rsvp-3',
    eventId: 'event-3',
    teamId: 'team-3',
    playerId: 'p3@example.com',
    email: 'p3@example.com',
    name: 'Player Three',
    ts: 456,
  }]);
});

test('Coach/team scoped RSVP filters work with rows loaded from remote snake_case source', () => {
  const remoteRows = [
    { id: 'a', event_id: 'event-1', team_id: 'team-a', player_id: 'a@x.com', email: 'A@X.COM', name: 'A', ts: 1 },
    { id: 'b', event_id: 'event-1', team_id: 'team-b', player_id: 'b@x.com', email: 'B@X.COM', name: 'B', ts: 2 },
  ];

  const appRows = buildAppRows('sl:rsvps', remoteRows);
  const coachTeamRows = appRows.filter((r) => r.teamId === 'team-a');
  assert.equal(coachTeamRows.length, 1);
  assert.equal(coachTeamRows[0].email, 'a@x.com');
});

test('Player event RSVP state works with rows loaded from remote snake_case source', () => {
  const remoteRows = [
    { id: 'c', event_id: 'event-z', team_id: 'team-z', player_id: 'p@x.com', email: 'P@X.COM', name: 'P', ts: 1 },
  ];

  const appRows = buildAppRows('sl:rsvps', remoteRows);
  const isGoing = appRows.some((r) => r.eventId === 'event-z' && r.email === 'p@x.com');
  assert.equal(isGoing, true);

  const dbRows = buildRemoteRows('sl:rsvps', appRows);
  assert.equal(dbRows[0].event_id, 'event-z');
});
