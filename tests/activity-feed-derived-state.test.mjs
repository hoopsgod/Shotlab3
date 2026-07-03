import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveActivityFeedItems, RECENT_ACTIVITY_LIMIT } from '../src/lib/activityFeed.js';

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

test('activity feed excludes non-roster program activity while keeping newly registered roster activity', () => {
  const roster = [
    { email: 'newplayer@team.com', name: 'New Player', teamId: 'team-a', role: 'player', playerId: 'new-player-id', joinedAt: '2026-05-10' },
    { email: 'archived@team.com', name: 'Archived Player', teamId: 'team-a', role: 'player', rosterStatus: 'archived' },
  ];
  const activeKeys = new Set(['newplayer@team.com', 'new-player-id']);
  const activeEmails = new Set(['newplayer@team.com']);
  const items = deriveActivityFeedItems({
    view: 'coach',
    user: { email: 'coach@team.com' },
    today: '2026-05-10',
    players: roster,
    scores: [
      { email: 'lori@team.com', name: 'Lori', src: 'program', date: '2026-05-10', score: 20 },
      { email: 'grayson@team.com', name: 'Grayson', src: 'program', date: '2026-05-10', score: 18 },
      { email: 'newplayer@team.com', playerId: 'new-player-id', name: 'New Player', src: 'program', date: '2026-05-10', score: 25 },
      { email: 'archived@team.com', name: 'Archived Player', src: 'program', date: '2026-05-10', score: 30 },
    ],
    shotLogs: [
      { email: 'newplayer@team.com', name: 'New Player', made: 40, date: '2026-05-10', ts: 200 },
      { email: 'lori@team.com', name: 'Lori', made: 99, date: '2026-05-10', ts: 210 },
    ],
    activeTeamPlayerEmails: activeEmails,
    activeTeamPlayerKeys: activeKeys,
  });
  const feedText = items.map((item) => item.text).join(' | ');
  assert.match(feedText, /New Player/);
  assert.doesNotMatch(feedText, /Lori/);
  assert.doesNotMatch(feedText, /Grayson/);
  assert.doesNotMatch(feedText, /Archived Player/);
});
