import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('competition hub wires current and all-time event attendance rankings', () => {
  assert.match(source, /buildCurrentEventParticipationRows/);
  assert.match(source, /buildAllTimeEventParticipationRows/);
  assert.match(source, /title: isAllTime \? 'All-Time Events Attended' : 'Events Attended'/);
  assert.doesNotMatch(source, /Event leaders will appear after players check into team events\.<\/div><\/section>/);
});

test('competition hub wires current and all-time strength rankings', () => {
  assert.match(source, /buildCurrentStrengthParticipationRows/);
  assert.match(source, /buildAllTimeStrengthParticipationRows/);
  assert.match(source, /title: isAllTime \? 'All-Time Strength & Conditioning' : 'Strength & Conditioning'/);
  assert.doesNotMatch(source, /Strength leaders will appear after players complete assigned S&C work\.<\/div><\/section>/);
});

test('participation data supports explicit props with persisted compatibility fallback', () => {
  assert.match(source, /rsvps,/);
  assert.match(source, /scLogs,/);
  assert.match(source, /readPersistedRows\('sl:rsvps'\)/);
  assert.match(source, /readPersistedRows\('sl:sc-logs'\)/);
});
