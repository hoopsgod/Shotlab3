import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCoachRoster,normalizeCoachEvents,normalizeCoachRsvps,normalizeCoachScores,
  calcCoachAttendanceReadiness,getUnresolvedRsvpCount,getNext7DayEventSummary,
  deriveCoachAlerts,deriveCultureReadinessLabels,
} from '../src/lib/coachDashboardSelectors.js';

test('coach selector safety: empty/new coach data does not crash',()=>{
  assert.deepEqual(normalizeCoachRoster(null),[]);
  assert.deepEqual(normalizeCoachEvents(undefined),[]);
  assert.deepEqual(normalizeCoachRsvps({}),[]);
  assert.deepEqual(normalizeCoachScores('x'),[]);
  const readiness=calcCoachAttendanceReadiness({roster:[],events:[],rsvps:[],scores:[],today:'2026-05-11'});
  assert.equal(readiness.attendancePct,0);
  assert.equal(readiness.rsvpPct,0);
  assert.equal(readiness.session,null);
  assert.equal(getUnresolvedRsvpCount([],[],[]),0);
  const summary=getNext7DayEventSummary({events:[],rsvps:[],roster:[],today:'2026-05-11'});
  assert.equal(summary.unresolvedCount,0);
  assert.equal(summary.events.length,0);
});

test('coach selector outputs derived labels and alerts safely',()=>{
  const labels=deriveCultureReadinessLabels({attendancePct:80,rsvpPct:76,sessionTitle:'Open Gym',unresolvedNext7Count:2,participationMomentum:10});
  assert.equal(labels.teamCommitmentLabel,'High standard');
  assert.equal(labels.cultureMomentum,'Rising');
  const alerts=deriveCoachAlerts({unresolvedNext7Count:2,inactivePlayersCount:1,rosterSize:5,rsvpPct:50,sessionTitle:'Open Gym',scheduleGap:true});
  assert.ok(alerts.length>=3);
});
