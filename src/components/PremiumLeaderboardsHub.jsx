import React, { useEffect, useMemo, useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';
import { ProgressiveDisclosure } from './VisualHierarchy.jsx';
import { buildAtHomeLeaderboardRows } from '../lib/homeLeaderboardRows.js';
import { getAllProgramScoreRows } from '../lib/programDrillScoring.js';
import { isShotLabDebugMode } from '../lib/releaseDiagnostics.js';
import { filterActiveTeamLeaderboardRows, getActiveTeamPlayerIdentity } from '../lib/playerDataManagement.js';
import {
  LEADERBOARD_TIME_SCOPES,
  buildAllTimeEventParticipationLeaderboardRows,
  buildAllTimeHomeLeaderboardRows,
  buildAllTimeProgramLeaderboardRows,
  buildAllTimeStrengthParticipationLeaderboardRows,
  buildCurrentEventParticipationLeaderboardRows,
  buildCurrentOffseasonHomeLeaderboardRows,
  buildCurrentOffseasonProgramLeaderboardRows,
  buildCurrentStrengthParticipationLeaderboardRows,
  getAllTimeProgramDrills,
  getSeasonLeaderboardCoverage,
} from '../lib/seasonLeaderboardAnalytics.js';
import { loadParticipationLeaderboards } from '../lib/participationLeaderboardService.js';

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
const CURRENT_PLAYER_EMPTY = 'No leaderboard data yet. Log shots to enter the rankings.';
const CURRENT_TEAM_EMPTY = 'No team leaderboard data yet. Players will appear here after they log shots.';

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
  events = [],
  rsvps = [],
  scSessions = [],
  scLogs = [],
  seasonArchives = [],
  testId = 'premium-leaderboards-hub',
}) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const [activeTimeScope, setActiveTimeScope] = useState(LEADERBOARD_TIME_SCOPES.CURRENT);
  const [activeProgramDrillId, setActiveProgramDrillId] = useState('');
  const [remoteParticipationLeaderboards, setRemoteParticipationLeaderboards] = useState(null);
  const [participationLoadMode, setParticipationLoadMode] = useState('loading');

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

  const activeRosterIdentity = useMemo(() => getActiveTeamPlayerIdentity(players, teamId), [players, teamId]);
  const activeRosterKeySet = activeRosterIdentity.keySet;
  const activeRosterEmailSet = activeRosterIdentity.emailSet;
  const activeRosterNameSet = activeRosterIdentity.nameSet;

  const currentDerivedHomeRows = useMemo(
    () => buildCurrentOffseasonHomeLeaderboardRows({
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
  const rawFallbackHomeLeaderboardRows = useMemo(
    () => buildAtHomeLeaderboardRows({ scores: homeScores, shotLogs, programDrills, players, limit: 10 }),
    [homeScores, shotLogs, programDrills, players],
  );
  const currentHomeSourceRows = useMemo(() => {
    if (hasFrozenHistory) return currentDerivedHomeRows;
    if (Array.isArray(leaderboardRows) && leaderboardRows.length > 0) return leaderboardRows;
    return currentDerivedHomeRows.length > 0 ? currentDerivedHomeRows : rawFallbackHomeLeaderboardRows;
  }, [hasFrozenHistory, currentDerivedHomeRows, leaderboardRows, rawFallbackHomeLeaderboardRows]);
  const currentHomeLeaderboardRows = useMemo(
    () => filterActiveTeamLeaderboardRows(currentHomeSourceRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet),
    [currentHomeSourceRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet],
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
  const atHomeLeaderboardRows = isAllTime ? allTimeHomeLeaderboardRows : currentHomeLeaderboardRows;
  const atHomeLeaderboardStatus = atHomeLeaderboardRows.length > 0
    ? 'success'
    : (!isAllTime && !hasFrozenHistory ? leaderboardStatus : 'idle');
  const hasRows = atHomeLeaderboardRows.length > 0;

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
    () => filterActiveTeamLeaderboardRows(rawCurrentProgramRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet),
    [rawCurrentProgramRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet],
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
  const programDrillLeaderboardRows = isAllTime ? allTimeProgramRows : currentProgramRows;

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
    setRemoteParticipationLeaderboards(null);
    if (!teamId) {
      setParticipationLoadMode('missing_context');
      return () => { cancelled = true; };
    }
    setParticipationLoadMode('loading');
    void loadParticipationLeaderboards({ teamId, userEmail }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setParticipationLoadMode('error');
        return;
      }
      setRemoteParticipationLeaderboards(result.leaderboards);
      setParticipationLoadMode(result.mode || 'signed_api');
    });
    return () => { cancelled = true; };
  }, [teamId, userEmail]);

  const allowLocalParticipation = viewerRole === 'coach' || participationLoadMode === 'demo_local';
  const participationScopeKey = isAllTime ? 'all_time' : 'current';
  const eventParticipationRows = remoteParticipationLeaderboards?.event_participation?.[participationScopeKey]
    ?? (allowLocalParticipation ? (isAllTime ? localAllTimeEventRows : localCurrentEventRows) : []);
  const strengthParticipationRows = remoteParticipationLeaderboards?.strength_conditioning_participation?.[participationScopeKey]
    ?? (allowLocalParticipation ? (isAllTime ? localAllTimeStrengthRows : localCurrentStrengthRows) : []);
  const participationUnavailable = viewerRole === 'player'
    && !remoteParticipationLeaderboards
    && participationLoadMode !== 'demo_local';

  useEffect(() => {
    if (!isShotLabDebugMode()) return;
    rawCurrentProgramRows.forEach((row) => {
      const kept = currentProgramRows.some((allowed) => String(allowed?.email || allowed?.player_email || allowed?.playerId || allowed?.player_id || allowed?.id || '') === String(row?.email || row?.player_email || row?.playerId || row?.player_id || row?.id || ''));
      if (!kept) console.warn('[leaderboard] filtered non-roster program row', { normalizedRowEmail: String(row?.email || row?.player_email || '').trim().toLowerCase(), rowIdentity: { playerId: row?.playerId, player_id: row?.player_id, userId: row?.userId, user_id: row?.user_id, profileId: row?.profileId, profile_id: row?.profile_id, id: row?.id }, teamId, activeRosterCount: activeRosterIdentity.players.length, rosterMatchFound: false, reason: 'excluded_not_active_roster_member' });
    });
  }, [rawCurrentProgramRows, currentProgramRows, activeRosterIdentity.players.length, teamId]);

  useEffect(() => {
    if (!isShotLabDebugMode() || activeLeaderboardCategory !== 'drill_shots') return;
    if (normalizedProgramScores.length > 0 && selectedProgramDrill && programDrillLeaderboardRows.length === 0) {
      console.warn('[program-scores] Program Drill leaderboard has no rows', {
        programScoresCount: normalizedProgramScores.length,
        normalizedProgramDrillIds: normalizedProgramScores.map((score) => score.drillId).filter(Boolean),
        selectedLeaderboardDrillId: selectedProgramDrill.id,
        selectedLeaderboardDrillName: selectedProgramDrill.name,
        teamId,
        playerEmail: userEmail,
        activeTimeScope,
        availablePlayerIdentities: (Array.isArray(players) ? players : []).map((player) => ({ name: player?.name || '', email: player?.email || player?.player_email || '', playerId: player?.playerId || player?.player_id || player?.id || player?.userId || player?.user_id || '' })),
      });
    }
  }, [activeLeaderboardCategory, normalizedProgramScores, selectedProgramDrill, programDrillLeaderboardRows, teamId, userEmail, activeTimeScope, players]);

  const playerIdentityKeys = useMemo(
    () => new Set([userEmail, currentUser?.email, currentUser?.playerId, currentUser?.player_id, currentUser?.userId, currentUser?.user_id, currentUser?.profileId, currentUser?.profile_id, currentUser?.id].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)),
    [userEmail, currentUser],
  );
  const matchesCurrentPlayer = (row = {}) => [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.userId, row?.user_id, row?.profileId, row?.profile_id, row?.id].map((value) => String(value || '').trim().toLowerCase()).some((key) => key && playerIdentityKeys.has(key));
  const playerScopedHomeRows = useMemo(() => [...(Array.isArray(homeScores) ? homeScores : []), ...(Array.isArray(shotLogs) ? shotLogs : [])].filter(matchesCurrentPlayer), [homeScores, shotLogs, playerIdentityKeys]);
  const playerScopedProgramRows = useMemo(() => normalizedProgramScores.filter(matchesCurrentPlayer), [normalizedProgramScores, playerIdentityKeys]);

  useEffect(() => {
    if (viewerRole !== 'player' || !isShotLabDebugMode()) return;
    const activeRows = activeLeaderboardCategory === 'drill_shots' ? programDrillLeaderboardRows : atHomeLeaderboardRows;
    const rawHomeScoreCount = (Array.isArray(homeScores) ? homeScores : []).length + (Array.isArray(shotLogs) ? shotLogs : []).length;
    const rawProgramScoreCount = normalizedProgramScores.length;
    const playerScopedHomeRowCount = playerScopedHomeRows.length;
    const playerScopedProgramRowCount = playerScopedProgramRows.length;
    const rawRelevantCount = activeLeaderboardCategory === 'drill_shots' ? rawProgramScoreCount : rawHomeScoreCount;
    if (rawRelevantCount > 0 && activeRows.length === 0) {
      console.warn('[player-leaderboard] Player leaderboard rows empty despite raw scores', {
        currentUserEmail: userEmail || currentUser?.email || '',
        normalizedCurrentUserEmail: String(userEmail || currentUser?.email || '').trim().toLowerCase(),
        currentUserIdentity: { playerId: currentUser?.playerId || currentUser?.player_id || '', profileId: currentUser?.profileId || currentUser?.profile_id || '', userId: currentUser?.userId || currentUser?.user_id || '', id: currentUser?.id || '' },
        rawHomeScoreCount,
        rawProgramScoreCount,
        playerScopedHomeRowCount,
        playerScopedProgramRowCount,
        generatedLeaderboardRowCount: activeRows.length,
        activeLeaderboardCategory,
        activeTimeScope,
        filteredOutReason: activeLeaderboardCategory === 'drill_shots' ? 'No Program Drill leaderboard rows matched the selected drill/current player identities.' : 'No At Home leaderboard rows matched current player/team identities.',
      });
    }
  }, [viewerRole, activeLeaderboardCategory, activeTimeScope, atHomeLeaderboardRows, programDrillLeaderboardRows, homeScores, shotLogs, normalizedProgramScores, playerScopedHomeRows, playerScopedProgramRows, userEmail, currentUser]);

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
  const homeEmptyMessage = isAllTime ? allTimeEmptyMessage : (viewerRole === 'coach' ? CURRENT_TEAM_EMPTY : CURRENT_PLAYER_EMPTY);

  return <div data-testid={testId}>
    <header style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      <div style={{ fontFamily: FALLBACK_FONT, color: VOLT, fontSize: 10, letterSpacing: '0.13em', fontWeight: 800, textTransform: 'uppercase' }}>COMPETITION HUB</div>
      <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontSize: 28, letterSpacing: '0.04em', marginTop: 3, lineHeight: 1, textTransform: 'uppercase', fontWeight: 800 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Compare the team’s most important training results.</div>
      <div data-testid="leaderboard-status-line" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9, fontFamily: FALLBACK_FONT, color: SUB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
        <span>{scopeLabel}</span><span aria-hidden="true">·</span><span>{activeCategoryLabel}</span><span aria-hidden="true">·</span><span>{activeRankedCount} ranked</span>
      </div>
    </header>

    <section aria-label="Leaderboard time scope" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 3 }}>
      {TIME_SCOPE_ITEMS.map((item) => {
        const active = activeTimeScope === item.key;
        return <button data-testid={`leaderboard-time-scope-${item.key}`} type="button" aria-pressed={active} key={item.key} onClick={() => setActiveTimeScope(item.key)} style={tabStyle(active)}>{item.label}</button>;
      })}
    </section>

    <section aria-label="Primary leaderboard categories" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', borderBottom: '1px solid var(--stroke-1)', marginBottom: 8 }}>
      {PRIMARY_CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={tabStyle(active)}>{item.label}</button>;
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

    {activeLeaderboardCategory === 'home_shots' ? (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time At-Home Shots' : 'At-Home Shots'}
        areaTitle="At-Home Shots"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={atHomeLeaderboardStatus}
        rows={atHomeLeaderboardRows}
        emptyMessage={`No rankings yet. ${isAllTime ? allTimeEmptyMessage : 'Log shots to activate the Home Shots leaderboard.'}`}
        maxRows={10}
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
          rows={programDrillLeaderboardRows}
          emptyMessage={isAllTime ? allTimeEmptyMessage : 'Program drill leaders will appear after players log coach-assigned drills.'}
          maxRows={10}
        />
      </section>
    ) : activeLeaderboardCategory === 'event_participation' ? (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time Events Attended' : 'Events Attended'}
        areaTitle="Team Participation"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={participationUnavailable ? 'error' : 'success'}
        rows={eventParticipationRows}
        emptyMessage={participationUnavailable ? 'Team participation rankings are temporarily unavailable. Your private RSVP records remain protected.' : (isAllTime ? allTimeEmptyMessage : 'Event rankings activate when players confirm attendance for team events.')}
        maxRows={10}
      />
    ) : (
      <CompactLeaderboardPreviewCard
        title={isAllTime ? 'All-Time S&C Completions' : 'S&C Completions'}
        areaTitle="Strength & Conditioning"
        categoryLabel={scopeLabel}
        mode={viewerRole}
        userEmail={userEmail}
        status={participationUnavailable ? 'error' : 'success'}
        rows={strengthParticipationRows}
        emptyMessage={participationUnavailable ? 'Team participation rankings are temporarily unavailable. Your private workout records remain protected.' : (isAllTime ? allTimeEmptyMessage : 'S&C rankings activate after players log completed strength work.')}
        maxRows={10}
      />
    )}

    <ProgressiveDisclosure
      title="Participation categories"
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
