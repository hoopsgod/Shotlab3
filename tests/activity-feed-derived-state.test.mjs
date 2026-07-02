import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveActivityFeedItems, RECENT_ACTIVITY_LIMIT } from '../src/lib/activityFeed.js';
import { filterActiveTeamPlayerRows, getActiveTeamPlayerIdentity } from '../src/lib/playerDataManagement.js';

test('activity feed derives only from events/rsvps/shotLogs/players/scores and sorts newest-first with limit', () => {
  const items = deriveActivityFeedItems({
    view: 'coach',
    user: { email: 'coach@team.com' },
    today: '2026-05-10',
    events: [{ id: 'e1', title: 'Open Gym Run', date: '2026-05-10', ts: 50 }],
    rsvps: [{ eventId: 'e1', email: 'sarah@team.com', name: 'Sarah', ts: 100 }],
    shotLogs: [
      { email: 'jd@team.com', name: 'JD', made: 120, date: '2026-05-09', ts: 190 },
      { email: 'jd@team.com', name: 'JD', made: 130, date: '2026-05-09', ts: 200 },
    ],
    players: [{ email: 'marcus@team.com', name: 'Marcus', joinedAt: '2026-05-08' }],
    scores: [{ email: 'jd@team.com', date: '2026-05-10' }, { email: 'sarah@team.com', date: '2026-05-10' }, { email: 'marcus@team.com', date: '2026-05-10' }],
  });
  assert.ok(items.length <= RECENT_ACTIVITY_LIMIT);
  const jdShotRows = items.filter((item) => item.text === 'JD logged 250 makes at home');
  assert.equal(jdShotRows.length, 1);
  assert.ok(items.some((item) => item.text.includes('Sarah confirmed attendance for OPEN GYM RUN')));
  assert.ok(items.some((item) => item.text.includes('Marcus joined the training group')));
  assert.ok(items.some((item) => item.text.includes('Coach scheduled OPEN GYM RUN')));
  assert.ok(items.some((item) => item.text.includes('3 players logged work today')));
  for (let i = 1; i < items.length; i += 1) assert.ok(items[i - 1].ts >= items[i].ts);
});


test('activity feed excludes Lori and Grayson when they are not active roster members', () => {
  const roster = [{ email: 'active@team.com', name: 'Active Player', teamId: 'team-a', playerId: 'active-id' }];
  const identity = getActiveTeamPlayerIdentity(roster, 'team-a');
  const shotLogs = [
    { email: 'active@team.com', playerId: 'active-id', name: 'Active Player', made: 12, date: '2026-05-10', ts: 300 },
    { email: 'lori@team.com', name: 'Lori', made: 99, date: '2026-05-10', ts: 400 },
    { email: 'grayson@team.com', name: 'Grayson', made: 88, date: '2026-05-10', ts: 500 },
  ];
  const scores = [
    { email: 'active@team.com', playerId: 'active-id', date: '2026-05-10' },
    { email: 'lori@team.com', date: '2026-05-10' },
    { email: 'grayson@team.com', date: '2026-05-10' },
  ];
  const items = deriveActivityFeedItems({
    view: 'coach',
    user: { email: 'coach@team.com' },
    today: '2026-05-10',
    players: roster,
    shotLogs: filterActiveTeamPlayerRows(shotLogs, identity.emailSet, identity.keySet),
    scores: filterActiveTeamPlayerRows(scores, identity.emailSet, identity.keySet),
  });
  const text = items.map((item) => item.text).join('\n');
  assert.match(text, /Active Player logged 12 makes at home/);
  assert.doesNotMatch(text, /Lori/);
  assert.doesNotMatch(text, /Grayson/);
});
