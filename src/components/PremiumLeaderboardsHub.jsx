import React, { useEffect, useMemo, useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';
import { ProgressiveDisclosure } from './VisualHierarchy.jsx';
import { buildAtHomeLeaderboardRows } from '../lib/homeLeaderboardRows.js';
import { getAllProgramScoreRows } from '../lib/programDrillScoring.js';
import { filterActiveTeamLeaderboardRows, getActiveTeamPlayerIdentity } from '../lib/playerDataManagement.js';
import {
  LEADERBOARD_TIME_SCOPES,
  buildAllTimeHomeLeaderboardRows,
  buildAllTimeProgramLeaderboardRows,
  buildCurrentOffseasonHomeLeaderboardRows,
  buildCurrentOffseasonProgramLeaderboardRows,
  getAllTimeProgramDrills,
  getSeasonLeaderboardCoverage,
} from '../lib/seasonLeaderboardAnalytics.js';
import {
  buildAllTimeEventParticipationRows,
  buildAllTimeStrengthParticipationRows,
  buildCurrentEventParticipationRows,
  buildCurrentStrengthParticipationRows,
} from '../lib/participationLeaderboardRows.js';

const PRIMARY_CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots' },
  { key: 'drill_shots', label: 'Program Drills' },
];
const PARTICIPATION_CATEGORY_ITEMS = [
  { key: 'event_participation', label: 'Events Attended' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning' },
];
const CATEGORY_ITEMS = [...PRIMARY_CATEGORY_ITEMS, ...PARTICIPATION_CATEGORY_ITEMS];
const TIME_SCOPE_ITEMS = [
  { key: LEADERBOARD_TIME_SCOPES.CURRENT, label: 'Current / Offseason' },
  { key: LEADERBOARD_TIME_SCOPES.ALL_TIME, label: 'All-Time' },
];
const FALLBACK_FONT = '"Barlow Condensed", "Bebas Neue", var(--font-body, Inter), sans-serif';

const tabStyle = (active) => ({
  minHeight: 44,
  padding: '9px 12px',
  border: 0,
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  background: 'transparent',
  color: active ? 'var(--text-1)' : 'var(--text-3)',
  fontFamily: FALLBACK_FONT,
  fontSize: 13,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontWeight: 800,
  cursor: 'pointer',
});

const readPersistedRows = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function PremiumLeaderboardsHub({
  viewerRole,
  leaderboardRows = [],
  leaderboardStatus = 'idle',
  userEmail = '',
  currentUser = {},
  programScores = [],
  programDrills = [],
  players = [],
  teamId = '',
  homeScores = [],
  shotLogs = [],
  seasonArchives = [],
  rsvps,
  scLogs,
  testId = 'premium-leaderboards-hub',
}) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const [activeTimeScope, setActiveTimeScope] = useState(LEADERBOARD_TIME_SCOPES.CURRENT);
  const [activeProgramDrillId, setActiveProgramDrillId] = useState('');
  const [persistedParticipation, setPersistedParticipation] = useState(() => ({
    rsvps: readPersistedRows('sl:rsvps'),
    scLogs: readPersistedRows('sl:sc-logs'),
  }));

  useEffect(() => {
    const refresh = () => setPersistedParticipation({
      rsvps: readPersistedRows('sl:rsvps'),
      scLogs: readPersistedRows('sl:sc-logs'),
    });
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const participationRsvps = Array.isArray(rsvps) ? rsvps : persistedParticipation.rsvps;
  const participationScLogs = Array.isArray(scLogs) ? scLogs : persistedParticipation.scLogs;
  const teamArchives = useMemo(
    () => (Array.isArray(seasonArchives) ? seasonArchives : []).filter((archive) => !teamId || String(archive?.teamId || archive?.team_id || '') === String(teamId)),
    [seasonArchives, teamId],
  );
  const coverage = useMemo(() => getSeasonLeaderboardCoverage({ seasonArchives: teamArchives, teamId }), [teamArchives, teamId]);
  const hasFrozenHistory = coverage.archiveCount > 0;
  const isAllTime = activeTimeScope === LEADERBOARD_TIME_SCOPES.ALL_TIME;
  const scopeLabel = isAllTime ? 'All-Time' : 'Current / Offseason';

  const normalizedProgramScores = useMemo(
    () => getAllProgramScoreRows(programScores).filter((score) => !teamId || score.teamId === teamId),
    [programScores, teamId],
  );
  const availableProgramDrills = useMemo(
    () => isAllTime
      ? getAllTimeProgramDrills({ seasonArchives: teamArchives, teamId, programDrills })
      : (Array.isArray(programDrills) ? programDrills : []),
    [isAllTime, teamArchives, teamId, programDrills],
  );
  const selectedProgramDrill = useMemo(
    () => availableProgramDrills.find((drill) => String(drill?.id) === String(activeProgramDrillId)) || availableProgramDrills[0] || null,
    [availableProgramDrills, activeProgramDrillId],
  );
  useEffect(() => {
    if (selectedProgramDrill && String(selectedProgramDrill.id) !== String(activeProgramDrillId)) setActiveProgramDrillId(selectedProgramDrill.id);
  }, [selectedProgramDrill, activeProgramDrillId]);

  const activeRosterIdentity = useMemo(() => getActiveTeamPlayerIdentity(players, teamId), [players, teamId]);
  const filterActive = (rows) => filterActiveTeamLeaderboardRows(rows, activeRosterIdentity.keySet, activeRosterIdentity.emailSet, activeRosterIdentity.nameSet);

  const currentDerivedHomeRows = useMemo(() => buildCurrentOffseasonHomeLeaderboardRows({ seasonArchives: teamArchives, teamId, homeScores, shotLogs, programDrills, players, limit: 10 }), [teamArchives, teamId, homeScores, shotLogs, programDrills, players]);
  const fallbackHomeRows = useMemo(() => buildAtHomeLeaderboardRows({ scores: homeScores, shotLogs, programDrills, players, limit: 10 }), [homeScores, shotLogs, programDrills, players]);
  const currentHomeSourceRows = hasFrozenHistory ? currentDerivedHomeRows : (leaderboardRows.length ? leaderboardRows : (currentDerivedHomeRows.length ? currentDerivedHomeRows : fallbackHomeRows));
  const currentHomeRows = useMemo(() => filterActive(currentHomeSourceRows), [currentHomeSourceRows, activeRosterIdentity]);
  const allTimeHomeRows = useMemo(() => buildAllTimeHomeLeaderboardRows({ seasonArchives: teamArchives, teamId, homeScores, shotLogs, programDrills, players, limit: 10 }), [teamArchives, teamId, homeScores, shotLogs, programDrills, players]);
  const atHomeRows = isAllTime ? allTimeHomeRows : currentHomeRows;

  const rawCurrentProgramRows = useMemo(() => selectedProgramDrill ? buildCurrentOffseasonProgramLeaderboardRows({ seasonArchives: teamArchives, teamId, programScores: normalizedProgramScores, drill: selectedProgramDrill, players, limit: 10 }) : [], [selectedProgramDrill, teamArchives, teamId, normalizedProgramScores, players]);
  const currentProgramRows = useMemo(() => filterActive(rawCurrentProgramRows), [rawCurrentProgramRows, activeRosterIdentity]);
  const allTimeProgramRows = useMemo(() => selectedProgramDrill ? buildAllTimeProgramLeaderboardRows({ seasonArchives: teamArchives, teamId, programScores: normalizedProgramScores, drill: selectedProgramDrill, players, limit: 10 }) : [], [selectedProgramDrill, teamArchives, teamId, normalizedProgramScores, players]);
  const programRows = isAllTime ? allTimeProgramRows : currentProgramRows;

  const currentEventRows = useMemo(() => buildCurrentEventParticipationRows({ rsvps: participationRsvps, players, teamId, seasonArchives: teamArchives, limit: 10 }), [participationRsvps, players, teamId, teamArchives]);
  const allTimeEventRows = useMemo(() => buildAllTimeEventParticipationRows({ rsvps: participationRsvps, players, teamId, seasonArchives: teamArchives, limit: 10 }), [participationRsvps, players, teamId, teamArchives]);
  const eventRows = isAllTime ? allTimeEventRows : currentEventRows;

  const currentStrengthRows = useMemo(() => buildCurrentStrengthParticipationRows({ scLogs: participationScLogs, players, teamId, seasonArchives: teamArchives, limit: 10 }), [participationScLogs, players, teamId, teamArchives]);
  const allTimeStrengthRows = useMemo(() => buildAllTimeStrengthParticipationRows({ scLogs: participationScLogs, players, teamId, seasonArchives: teamArchives, limit: 10 }), [participationScLogs, players, teamId, teamArchives]);
  const strengthRows = isAllTime ? allTimeStrengthRows : currentStrengthRows;

  const categoryRows = activeLeaderboardCategory === 'home_shots' ? atHomeRows
    : activeLeaderboardCategory === 'drill_shots' ? programRows
      : activeLeaderboardCategory === 'event_participation' ? eventRows
        : strengthRows;
  const activeCategoryLabel = CATEGORY_ITEMS.find((item) => item.key === activeLeaderboardCategory)?.label || 'At-Home Shots';
  const allTimeEmptyMessage = hasFrozenHistory ? 'No qualifying archived or current results are available yet.' : 'Archive a completed season to begin building all-time rankings.';

  const renderCard = ({ title, areaTitle, rows, emptyMessage, status = 'success' }) => (
    <CompactLeaderboardPreviewCard
      title={title}
      areaTitle={areaTitle}
      categoryLabel={scopeLabel}
      mode={viewerRole}
      userEmail={userEmail}
      status={rows.length ? 'success' : status}
      rows={rows}
      emptyMessage={emptyMessage}
      maxRows={10}
    />
  );

  return <div data-testid={testId}>
    <header style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      <div style={{ fontFamily: FALLBACK_FONT, color: VOLT, fontSize: 10, letterSpacing: '0.13em', fontWeight: 800, textTransform: 'uppercase' }}>COMPETITION HUB</div>
      <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontSize: 28, letterSpacing: '0.04em', marginTop: 3, lineHeight: 1, textTransform: 'uppercase', fontWeight: 800 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Compare the team’s most important training results.</div>
      <div data-testid="leaderboard-status-line" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9, fontFamily: FALLBACK_FONT, color: SUB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
        <span>{scopeLabel}</span><span>·</span><span>{activeCategoryLabel}</span><span>·</span><span>{categoryRows.length} ranked</span>
      </div>
    </header>

    <section aria-label="Leaderboard time scope" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 3 }}>
      {TIME_SCOPE_ITEMS.map((item) => <button data-testid={`leaderboard-time-scope-${item.key}`} type="button" aria-pressed={activeTimeScope === item.key} key={item.key} onClick={() => setActiveTimeScope(item.key)} style={tabStyle(activeTimeScope === item.key)}>{item.label}</button>)}
    </section>

    <section aria-label="Primary leaderboard categories" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      {PRIMARY_CATEGORY_ITEMS.map((item) => <button type="button" aria-selected={activeLeaderboardCategory === item.key} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={tabStyle(activeLeaderboardCategory === item.key)}>{item.label}</button>)}
    </section>

    {isAllTime ? <ProgressiveDisclosure title="All-Time coverage" summary={hasFrozenHistory ? `${coverage.archiveCount} season${coverage.archiveCount === 1 ? '' : 's'} frozen without double-counting` : 'No frozen seasons yet'} testId="all-time-coverage-note">
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.5 }}>{hasFrozenHistory ? 'Frozen history is combined with live activity after archived date ranges. Archived seasons are never counted twice.' : 'All-Time currently reflects unarchived live activity only.'}</div>
    </ProgressiveDisclosure> : null}

    {activeLeaderboardCategory === 'home_shots' && renderCard({ title: isAllTime ? 'All-Time At-Home Shots' : 'At-Home Shots', areaTitle: 'At-Home Shots', rows: atHomeRows, status: !isAllTime && !hasFrozenHistory ? leaderboardStatus : 'idle', emptyMessage: isAllTime ? allTimeEmptyMessage : 'No rankings yet. Log shots to activate the Home Shots leaderboard.' })}

    {activeLeaderboardCategory === 'drill_shots' && <section style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '9px 0 2px' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>Program Drills</div><div style={{ fontFamily: FALLBACK_FONT, color: SUB, fontSize: 10, textTransform: 'uppercase' }}>{availableProgramDrills.length} drills</div></div>
      {availableProgramDrills.length > 0 && <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0 7px', borderBottom: '1px solid var(--stroke-1)' }}>{availableProgramDrills.map((drill) => <button key={drill.id} type="button" onClick={() => setActiveProgramDrillId(drill.id)} style={{ flex: '0 0 auto', minHeight: 36, borderRadius: 999, border: String(selectedProgramDrill?.id) === String(drill.id) ? '1px solid var(--accent)' : '1px solid var(--stroke-1)', background: 'transparent', color: String(selectedProgramDrill?.id) === String(drill.id) ? LIGHT : SUB, padding: '6px 10px', fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>{drill.name}{drill.historical && isAllTime ? ' · Archived' : ''}</button>)}</div>}
      {renderCard({ title: selectedProgramDrill?.name || 'Program Drills', areaTitle: 'Program Drills', rows: programRows, emptyMessage: isAllTime ? allTimeEmptyMessage : 'Program drill leaders will appear after players log coach-assigned drills.' })}
    </section>}

    {activeLeaderboardCategory === 'event_participation' && renderCard({ title: isAllTime ? 'All-Time Events Attended' : 'Events Attended', areaTitle: 'Events Attended', rows: eventRows, emptyMessage: isAllTime ? allTimeEmptyMessage : 'Event leaders will appear after attendance is confirmed.' })}
    {activeLeaderboardCategory === 'strength_conditioning_participation' && renderCard({ title: isAllTime ? 'All-Time Strength & Conditioning' : 'Strength & Conditioning', areaTitle: 'Strength & Conditioning', rows: strengthRows, emptyMessage: isAllTime ? allTimeEmptyMessage : 'Strength leaders will appear after players log completed S&C sessions.' })}

    <ProgressiveDisclosure title="Participation categories" summary="Events attended and strength work" testId="leaderboard-participation-categories">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>{PARTICIPATION_CATEGORY_ITEMS.map((item) => <button type="button" aria-selected={activeLeaderboardCategory === item.key} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 44, borderRadius: 10, border: activeLeaderboardCategory === item.key ? '1px solid var(--accent)' : '1px solid var(--stroke-1)', background: 'transparent', color: activeLeaderboardCategory === item.key ? LIGHT : SUB, fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 800, padding: 8, cursor: 'pointer', textTransform: 'uppercase' }}>{item.label}</button>)}</div>
    </ProgressiveDisclosure>
  </div>;
}
