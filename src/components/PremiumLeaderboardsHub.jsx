import React, { useEffect, useMemo, useRef, useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';
import { ProgressiveDisclosure } from './VisualHierarchy.jsx';
import { getAllProgramScoreRows } from '../lib/programDrillScoring.js';
import {
  LEADERBOARD_TIME_SCOPES,
  buildAllTimeEventParticipationLeaderboardRows,
  buildAllTimeHomeLeaderboardRows,
  buildAllTimeProgramLeaderboardRows,
  buildAllTimeStrengthParticipationLeaderboardRows,
  buildCurrentEventParticipationLeaderboardRows,
  buildCurrentOffseasonProgramLeaderboardRows,
  buildCurrentStrengthParticipationLeaderboardRows,
  getAllTimeProgramDrills,
  getSeasonLeaderboardCoverage,
} from '../lib/seasonLeaderboardAnalytics.js';
import { loadParticipationLeaderboards } from '../lib/participationLeaderboardService.js';
import { buildLeaderboardDecisionSurface, buildLeaderboardWeeklyActivity, resolveLeaderboardDataState, selectLeaderboardRows } from '../lib/leaderboardSelectors.js';

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
  { key: LEADERBOARD_TIME_SCOPES.CURRENT, label: 'Current / Offseason', shortLabel: 'Current' },
  { key: LEADERBOARD_TIME_SCOPES.ALL_TIME, label: 'All-Time', shortLabel: 'All-Time' },
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
  touchAction: 'manipulation',
  boxSizing: 'border-box',
});

export default function PremiumLeaderboardsHub({
  viewerRole,
  leaderboardRows = [],
  leaderboardStatus = 'idle',
  leaderboardError = '',
  leaderboardMode = 'unknown',
  onRetryHomeShots,
  onOpenPlayer,
  userEmail = '',
  currentUser = {},
  programScores = [],
  programDrills = [],
  players = [],
  teamId = '',
  homeScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scLogs = [],
  seasonArchives = [],
  testId = 'premium-leaderboards-hub',
  showHeader = true,
}) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const [activeTimeScope, setActiveTimeScope] = useState(LEADERBOARD_TIME_SCOPES.CURRENT);
  const [activeProgramDrillId, setActiveProgramDrillId] = useState('');
  const [remoteParticipationLeaderboards, setRemoteParticipationLeaderboards] = useState(null);
  const [participationLoadMode, setParticipationLoadMode] = useState('loading');
  const [participationStorageMode, setParticipationStorageMode] = useState('');
  const [participationError, setParticipationError] = useState('');
  const [participationRefreshVersion, setParticipationRefreshVersion] = useState(0);
  const participationTeamRef = useRef('');

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
    if (!selectedProgramDrill && availableProgramDrills[0]?.id) {
      setActiveProgramDrillId(availableProgramDrills[0].id);
      return;
    }
    if (selectedProgramDrill && String(selectedProgramDrill.id) !== String(activeProgramDrillId)) {
      setActiveProgramDrillId(selectedProgramDrill.id);
    }
  }, [selectedProgramDrill, availableProgramDrills, activeProgramDrillId]);

  // Current home-shot rankings are source-owned by the signed leaderboard
  // service. A missing or failed request must not be replaced with client-side
  // score aggregation; All-Time has its own archive-aware selector below.
  const currentHomeSourceRows = useMemo(
    () => (Array.isArray(leaderboardRows) ? leaderboardRows : []),
    [leaderboardRows],
  );
  const currentHomeLeaderboardRows = useMemo(
    () => selectLeaderboardRows({ rows: currentHomeSourceRows, players, teamId }),
    [currentHomeSourceRows, players, teamId],
  );
  const allTimeHomeLeaderboardRows = useMemo(
    () => buildAllTimeHomeLeaderboardRows({
      seasonArchives: teamArchives,
      teamId,
      homeScores,
      shotLogs,
      programDrills,
      players,
      limit: 10,
    }),
    [teamArchives, teamId, homeScores, shotLogs, programDrills, players],
  );
  const atHomeLeaderboardRows = useMemo(
    () => selectLeaderboardRows({ rows: isAllTime ? allTimeHomeLeaderboardRows : currentHomeLeaderboardRows, players, teamId, includeArchivedPlayers: isAllTime }),
    [isAllTime, allTimeHomeLeaderboardRows, currentHomeLeaderboardRows, players, teamId],
  );
  const atHomeLeaderboardStatus = isAllTime ? 'success' : leaderboardStatus;

  const rawCurrentProgramRows = useMemo(
    () => selectedProgramDrill
      ? buildCurrentOffseasonProgramLeaderboardRows({
        seasonArchives: teamArchives,
        teamId,
        programScores: normalizedProgramScores,
        drill: selectedProgramDrill,
        players,
        limit: 10,
      })
      : [],
    [selectedProgramDrill, teamArchives, teamId, normalizedProgramScores, players],
  );
  const currentProgramRows = useMemo(
    () => selectLeaderboardRows({ rows: rawCurrentProgramRows, players, teamId }),
    [rawCurrentProgramRows, players, teamId],
  );
  const allTimeProgramRows = useMemo(
    () => selectedProgramDrill
      ? buildAllTimeProgramLeaderboardRows({
        seasonArchives: teamArchives,
        teamId,
        programScores: normalizedProgramScores,
        drill: selectedProgramDrill,
        players,
        limit: 10,
      })
      : [],
    [selectedProgramDrill, teamArchives, teamId, normalizedProgramScores, players],
  );
  const programDrillLeaderboardRows = useMemo(
    () => selectLeaderboardRows({ rows: isAllTime ? allTimeProgramRows : currentProgramRows, players, teamId, includeArchivedPlayers: isAllTime }),
    [isAllTime, allTimeProgramRows, currentProgramRows, players, teamId],
  );

  const localCurrentEventRows = useMemo(
    () => buildCurrentEventParticipationLeaderboardRows({
      seasonArchives: teamArchives,
      teamId,
      events,
      rsvps,
      players,
      limit: 10,
    }),
    [teamArchives, teamId, events, rsvps, players],
  );
  const localAllTimeEventRows = useMemo(
    () => buildAllTimeEventParticipationLeaderboardRows({
      seasonArchives: teamArchives,
      teamId,
      events,
      rsvps,
      players,
      limit: 10,
    }),
    [teamArchives, teamId, events, rsvps, players],
  );
  const localCurrentStrengthRows = useMemo(
    () => buildCurrentStrengthParticipationLeaderboardRows({
      seasonArchives: teamArchives,
      teamId,
      scSessions,
      scLogs,
      players,
      limit: 10,
    }),
    [teamArchives, teamId, scSessions, scLogs, players],
  );
  const localAllTimeStrengthRows = useMemo(
    () => buildAllTimeStrengthParticipationLeaderboardRows({
      seasonArchives: teamArchives,
      teamId,
      scSessions,
      scLogs,
      players,
      limit: 10,
    }),
    [teamArchives, teamId, scSessions, scLogs, players],
  );

  useEffect(() => {
    let cancelled = false;
    const teamChanged = participationTeamRef.current !== String(teamId || '');
    participationTeamRef.current = String(teamId || '');
    if (teamChanged) {
      setRemoteParticipationLeaderboards(null);
      setParticipationStorageMode('');
    }
    if (!teamId) {
      setParticipationLoadMode('missing_context');
      setParticipationStorageMode('');
      setParticipationError('Choose a team before viewing participation rankings.');
      return () => { cancelled = true; };
    }
    setParticipationLoadMode((previous) => !teamChanged && ['success', 'error', 'permission', 'unavailable', 'demo_local'].includes(previous) ? 'refreshing' : 'loading');
    setParticipationError('');
    void loadParticipationLeaderboards({ teamId, userEmail }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setParticipationLoadMode(result.status || 'error');
        setParticipationError(result.error || 'Participation rankings could not load. Try again.');
        return;
      }
      setRemoteParticipationLeaderboards({ teamId: String(teamId), leaderboards: result.leaderboards });
      setParticipationStorageMode(result.mode || '');
      setParticipationLoadMode(result.mode === 'demo_local' ? 'demo_local' : 'success');
      setParticipationError('');
    });
    return () => { cancelled = true; };
  }, [teamId, userEmail, participationRefreshVersion]);

  const allowLocalParticipation = leaderboardMode === 'demo_local' || participationStorageMode === 'demo_local';
  const participationScopeKey = isAllTime ? 'all_time' : 'current';
  const remoteParticipationForTeam = remoteParticipationLeaderboards?.teamId === String(teamId)
    ? remoteParticipationLeaderboards.leaderboards
    : null;
  const eventParticipationRows = useMemo(() => selectLeaderboardRows({
    rows: remoteParticipationForTeam?.event_participation?.[participationScopeKey]
      ?? (allowLocalParticipation ? (isAllTime ? localAllTimeEventRows : localCurrentEventRows) : []),
    players,
    teamId,
    includeArchivedPlayers: isAllTime,
  }), [remoteParticipationForTeam, participationScopeKey, allowLocalParticipation, isAllTime, localAllTimeEventRows, localCurrentEventRows, players, teamId]);
  const strengthParticipationRows = useMemo(() => selectLeaderboardRows({
    rows: remoteParticipationForTeam?.strength_conditioning_participation?.[participationScopeKey]
      ?? (allowLocalParticipation ? (isAllTime ? localAllTimeStrengthRows : localCurrentStrengthRows) : []),
    players,
    teamId,
    includeArchivedPlayers: isAllTime,
  }), [remoteParticipationForTeam, participationScopeKey, allowLocalParticipation, isAllTime, localAllTimeStrengthRows, localCurrentStrengthRows, players, teamId]);
  const retryParticipationLeaderboards = () => setParticipationRefreshVersion((version) => version + 1);

  const archiveCoverageLabel = hasFrozenHistory ? `${coverage.archiveCount} season${coverage.archiveCount === 1 ? '' : 's'}` : 'No archives';
  const activeCategoryLabel = CATEGORY_ITEMS.find((item) => item.key === activeLeaderboardCategory)?.label || 'At-Home Shots';
  const activeRankedCount = activeLeaderboardCategory === 'home_shots'
    ? atHomeLeaderboardRows.length
    : activeLeaderboardCategory === 'drill_shots'
      ? programDrillLeaderboardRows.length
      : activeLeaderboardCategory === 'event_participation'
        ? eventParticipationRows.length
        : strengthParticipationRows.length;
  const allTimeEmptyMessage = hasFrozenHistory
    ? 'No qualifying archived or current training results are available yet.'
    : 'Archive a completed season to begin building all-time rankings.';
  const decisionRows = activeLeaderboardCategory === 'home_shots'
    ? atHomeLeaderboardRows
    : activeLeaderboardCategory === 'drill_shots'
      ? programDrillLeaderboardRows
      : activeLeaderboardCategory === 'event_participation'
      ? eventParticipationRows
      : strengthParticipationRows;
  const activeDataStatus = activeLeaderboardCategory === 'home_shots'
    ? atHomeLeaderboardStatus
    : activeLeaderboardCategory === 'drill_shots'
      ? 'success'
      : participationLoadMode;
  const activeDataError = activeLeaderboardCategory === 'home_shots'
    ? leaderboardError
    : activeLeaderboardCategory === 'drill_shots'
      ? ''
      : participationError;
  const activeDataState = resolveLeaderboardDataState({ status: activeDataStatus, rows: decisionRows, error: activeDataError, teamId });
  const weeklyActivity = useMemo(() => buildLeaderboardWeeklyActivity({
    category: activeLeaderboardCategory,
    teamId,
    viewerRole,
    currentUser,
    userEmail,
    shotLogs,
    programScores: normalizedProgramScores,
    events,
    rsvps,
    scLogs,
  }), [activeLeaderboardCategory, teamId, viewerRole, currentUser, userEmail, shotLogs, normalizedProgramScores, events, rsvps, scLogs]);
  const decisionSurface = useMemo(() => buildLeaderboardDecisionSurface({
    rows: decisionRows,
    players,
    teamId,
    viewerRole,
    currentUser,
    userEmail,
    shotLogs,
    weeklyActivity,
    includeArchivedPlayers: isAllTime,
  }), [decisionRows, players, teamId, viewerRole, currentUser, userEmail, shotLogs, weeklyActivity, isAllTime]);
  const metricItems = decisionSurface.metrics;
  const statusLine = <div data-testid="leaderboard-status-line" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9, fontFamily: FALLBACK_FONT, color: SUB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
    <span>{scopeLabel}</span><span aria-hidden="true">·</span><span>{activeCategoryLabel}</span><span aria-hidden="true">·</span><span>{activeRankedCount} ranked</span>{activeDataState.kind === 'refreshing' ? <><span aria-hidden="true">·</span><span>Refreshing</span></> : null}
  </div>;

  return <div data-testid={testId} data-viewer-role={viewerRole} aria-label="Leaderboards">
    {showHeader ? <header style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      <div style={{ fontFamily: FALLBACK_FONT, color: VOLT, fontSize: 10, letterSpacing: '0.13em', fontWeight: 800, textTransform: 'uppercase' }}>COMPETITION HUB</div>
      <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontSize: 28, letterSpacing: '0.04em', marginTop: 3, lineHeight: 1, textTransform: 'uppercase', fontWeight: 800 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>See the result that matters now and the next move to improve it.</div>
      {statusLine}
    </header> : null}
    {!showHeader ? statusLine : null}

    <section aria-label="Leaderboard decision metrics" data-testid="leaderboard-metric-surface" data-layout-role="supporting-evidence" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 1, margin: '10px 0 8px', overflow: 'hidden', border: '1px solid var(--stroke-1)', borderRadius: 12, background: 'linear-gradient(135deg,#121a20,#0b1014)' }}>
      {metricItems.map((metric) => <div key={metric.label} data-metric={metric.label.toLowerCase().replaceAll(' ','-')} style={{ minWidth: 0, padding: '12px 9px' }}><div data-metric-role="value" style={{ color: LIGHT, fontFamily: FALLBACK_FONT, fontSize: 24, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metric.value}</div><div data-metric-role="label" style={{ color: VOLT, fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 900, letterSpacing: '.06em', marginTop: 5, textTransform: 'uppercase', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}>{metric.label}</div><div data-metric-role="detail" style={{ color: SUB, fontSize: 12, lineHeight: 1.3, marginTop: 3, minHeight: 31 }}>{metric.detail}</div></div>)}
    </section>

    <section aria-label="Leaderboard time scope" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 3 }}>
      {TIME_SCOPE_ITEMS.map((item) => {
        const active = activeTimeScope === item.key;
        return <button data-testid={`leaderboard-time-scope-${item.key}`} data-coach-filter-chip={viewerRole === "coach" ? "true" : undefined} type="button" aria-pressed={active} key={item.key} onClick={() => setActiveTimeScope(item.key)} style={tabStyle(active)}>{item.label}</button>;
      })}
    </section>

    <section aria-label="Primary leaderboard categories" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      {PRIMARY_CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" data-coach-filter-chip={viewerRole === "coach" ? "true" : undefined} aria-selected={active} aria-pressed={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={tabStyle(active)}>{item.label}</button>;
      })}
    </section>

    {isAllTime ? <ProgressiveDisclosure
      title="All-Time coverage"
      summary={hasFrozenHistory ? `${archiveCoverageLabel} frozen without double-counting` : 'No frozen seasons yet'}
      testId="all-time-coverage-note"
    >
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.5 }}>
        {hasFrozenHistory ? `Frozen history from ${archiveCoverageLabel} is combined with live activity after archived date ranges. Archived seasons are never counted twice.` : 'No frozen seasons yet. All-Time currently reflects unarchived live activity only.'}
      </div>
    </ProgressiveDisclosure> : null}

    <div data-testid={viewerRole === 'coach' ? 'coach-leaderboard-operational-results' : undefined}>
    {activeLeaderboardCategory === 'home_shots' ? (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time At-Home Shots' : 'At-Home Shots'}
        areaTitle="At-Home Shots"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={atHomeLeaderboardStatus}
        error={leaderboardError}
        teamId={teamId}
        rows={atHomeLeaderboardRows}
        emptyMessage={`No rankings yet. ${isAllTime ? allTimeEmptyMessage : 'Log shots to activate the Home Shots leaderboard.'}`}
        maxRows={10}
        onRowClick={viewerRole === 'coach' ? onOpenPlayer : undefined}
        onRetry={onRetryHomeShots}
      />
    ) : activeLeaderboardCategory === 'drill_shots' ? (
      <section style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '9px 0 2px' }}>
          <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Program Drills</div>
          <div style={{ fontFamily: FALLBACK_FONT, color: SUB, fontSize: 10, textTransform: 'uppercase' }}>{availableProgramDrills.length} drills</div>
        </div>
        {availableProgramDrills.length > 0 ? <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0 7px', borderBottom: '1px solid var(--stroke-1)' }}>
          {availableProgramDrills.map((drill) => {
            const active = String(selectedProgramDrill?.id) === String(drill.id);
            return <button key={drill.id} type="button" onClick={() => setActiveProgramDrillId(drill.id)} style={{ flex: '0 0 auto', minHeight: 36, borderRadius: 999, border: active ? '1px solid var(--accent)' : '1px solid var(--stroke-1)', background: active ? 'color-mix(in srgb,var(--accent) 10%, transparent)' : 'transparent', color: active ? LIGHT : SUB, padding: '6px 10px', fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', cursor: 'pointer' }}>{drill.name}{drill.historical && isAllTime ? ' · Archived' : ''}</button>;
          })}
        </div> : null}
        <CompactLeaderboardPreviewCard
          title={selectedProgramDrill?.name || 'Program Drills'}
          areaTitle="Program Drills"
          categoryLabel={scopeLabel}
          mode={viewerRole}
          userEmail={userEmail}
          status="success"
          teamId={teamId}
          rows={programDrillLeaderboardRows}
          emptyMessage={isAllTime ? allTimeEmptyMessage : 'Program drill leaders will appear after players log coach-assigned drills.'}
          maxRows={10}
        onRowClick={viewerRole === 'coach' ? onOpenPlayer : undefined}
        />
      </section>
    ) : activeLeaderboardCategory === 'event_participation' ? (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time Events Attended' : 'Events Attended'}
        areaTitle="Team Participation"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={participationLoadMode}
        error={participationError}
        teamId={teamId}
        rows={eventParticipationRows}
        emptyMessage={isAllTime ? allTimeEmptyMessage : 'Event rankings activate when players confirm attendance for team events.'}
        maxRows={10}
        onRowClick={viewerRole === 'coach' ? onOpenPlayer : undefined}
        onRetry={retryParticipationLeaderboards}
      />
    ) : (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time S&C Completions' : 'S&C Completions'}
        areaTitle="Strength & Conditioning"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={participationLoadMode}
        error={participationError}
        teamId={teamId}
        rows={strengthParticipationRows}
        emptyMessage={isAllTime ? allTimeEmptyMessage : 'S&C rankings activate after players log completed strength work.'}
        maxRows={10}
        onRowClick={viewerRole === 'coach' ? onOpenPlayer : undefined}
        onRetry={retryParticipationLeaderboards}
      />
    )}
    </div>

    <ProgressiveDisclosure
      title="More rankings"
      summary="Events attended and strength work"
      testId="leaderboard-participation-categories"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        {PARTICIPATION_CATEGORY_ITEMS.map((item) => {
          const active = activeLeaderboardCategory === item.key;
          return <button type="button" aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 44, borderRadius: 10, border: active ? '1px solid var(--accent)' : '1px solid var(--stroke-1)', background: active ? 'color-mix(in srgb,var(--accent) 9%, transparent)' : 'transparent', color: active ? LIGHT : SUB, fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 800, padding: '8px', cursor: 'pointer', textTransform: 'uppercase' }}>{item.label}</button>;
        })}
      </div>
    </ProgressiveDisclosure>
  </div>;
}
