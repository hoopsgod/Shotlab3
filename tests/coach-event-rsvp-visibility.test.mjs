import test from 'node:test';
import assert from 'node:assert/strict';
import { getCoachEventRsvpRows, getCoachEventRsvpSummary, getCoachRsvpLabel } from '../src/lib/coachEventRsvpVisibility.js';

test('coachEventRsvpRows returns only RSVPs matching the event and team', () => {
  const rsvps = [
    { id: 'rsvp-1', eventId: 'event-1', teamId: 'team-1', playerId: 'p1@example.com', email: 'p1@example.com', name: 'Player One' },
    { id: 'rsvp-2', eventId: 'event-1', teamId: 'team-2', playerId: 'p2@example.com', email: 'p2@example.com', name: 'Wrong Team' },
    { id: 'rsvp-3', eventId: 'event-2', teamId: 'team-1', playerId: 'p3@example.com', email: 'p3@example.com', name: 'Wrong Event' },
  ];

  const rows = getCoachEventRsvpRows(rsvps, 'event-1', 'team-1');

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Player One');
});

test('coach event RSVP summary renders matching RSVP player names and count data', () => {
  const rosterNameByEmail = new Map([['fallback@example.com', 'Fallback Roster Name']]);
  const summary = getCoachEventRsvpSummary({
    event: { id: 'event-1' },
    teamId: 'team-1',
    knownPlayers: [{ email: 'p1@example.com' }, { email: 'fallback@example.com' }, { email: 'missing@example.com' }],
    rosterNameByEmail,
    rsvps: [
      { id: 'rsvp-1', eventId: 'event-1', teamId: 'team-1', playerId: 'p1@example.com', email: 'p1@example.com', name: 'Player One' },
      { id: 'rsvp-2', eventId: 'event-1', teamId: 'team-1', playerId: 'fallback@example.com', email: 'fallback@example.com' },
    ],
  });

  assert.deepEqual(summary.names, ['Player One', 'Fallback Roster Name']);
  assert.equal(summary.confirmedCount, 2);
  assert.equal(summary.missingCount, 1);
});

test('coach RSVP label falls back to email when no name or roster entry exists', () => {
  assert.equal(getCoachRsvpLabel({ email: 'unknown@example.com' }, new Map()), 'unknown@example.com');
});
