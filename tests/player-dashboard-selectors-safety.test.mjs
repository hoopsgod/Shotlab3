import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePlayerActivity,
  normalizeWorkoutAndLogs,
  normalizeEventsAndRsvps,
  deriveCompletionRatio,
  deriveMomentumLabel,
  deriveNextFocusLabel,
  derivePlayerNotificationBriefing,
  deriveFirstWeekActivationMilestones,
  deriveTrainingIdentityLabels,
} from '../src/lib/playerDashboardSelectors.js';

test('player dashboard selectors safely handle empty/new player state', () => {
  const activity = normalizePlayerActivity({ userEmail: 'new@player.com', teamId: 't1' });
  assert.deepEqual(activity, { shotLogs: [], scLogs: [], scores: [] });

  const logs = normalizeWorkoutAndLogs({ shotLogs: [{ made: undefined }], scLogs: null });
  assert.equal(logs.shotLogs[0].made, 0);
  assert.deepEqual(logs.scLogs, []);

  const events = normalizeEventsAndRsvps({ events: null, rsvps: null, userEmail: 'new@player.com', today: '2026-05-11' });
  assert.deepEqual(events.upcomingEvents, []);
  assert.deepEqual(events.attendanceRows, []);

  assert.equal(deriveCompletionRatio({ todayMakes: 0, dailyGoal: 0 }), 0);
  assert.equal(deriveMomentumLabel({ weeklyMakes: 0, weeklyGoal: 300 }), 'Foundation build');
  assert.equal(deriveNextFocusLabel({ todaysMakes: 0, dailyGoal: 75 }), 'Daily shot volume + attendance');

  const briefing = derivePlayerNotificationBriefing({ nextEvent: null, weekMissingCount: 0, scSessions: [], streak: 0 });
  assert.equal(briefing.length, 1);
  assert.equal(briefing[0].title, 'Streak continuity');

  const milestones = deriveFirstWeekActivationMilestones({});
  assert.equal(milestones.length, 3);
  assert.equal(milestones.filter((m) => m.done).length, 0);

  const identity = deriveTrainingIdentityLabels({ eventsAttended: 0, weeklyMakes: 0, weeklyGoal: 300, weeklyPct: 0, streak: 0 });
  assert.equal(identity.trainingIdentity, 'Foundation phase');
  assert.equal(identity.commitmentLevel, 'Foundation build');
});
