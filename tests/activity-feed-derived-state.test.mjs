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
