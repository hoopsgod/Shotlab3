import React, { useEffect, useMemo, useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';
import { buildAtHomeLeaderboardRows } from '../lib/homeLeaderboardRows.js';
import { getAllProgramScoreRows, getProgramLeaderboardRows } from '../lib/programDrillScoring.js';
import { isShotLabDebugMode } from '../lib/releaseDiagnostics.js';
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

const CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots' },
  { key: 'event_participation', label: 'Events Attended' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning' },
  { key: 'drill_shots', label: 'Program Drills' },
];

const TIME_SCOPE_ITEMS = [
  { key: LEADERBOARD_TIME_SCOPES.CURRENT, label: 'Current / Offseason', shortLabel: 'Current' },
  { key: LEADERBOARD_TIME_SCOPES.ALL_TIME, label: 'All-Time', shortLabel: 'All-Time' },
];

const FALLBACK_FONT = '"Barlow Condensed", "Bebas Neue", var(--font-body, Inter), sans-serif';
const CURRENT_PLAYER_EMPTY = 'No leaderboard data yet. Log shots to enter the rankings.';
const CURRENT_TEAM_EMPTY = 'No team leaderboard data yet. Players will appear here after they log shots.';

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
  testId = 'premium-leaderboards-hub',
}) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const BODY_COPY = 'Track team effort across shots, events, strength work, and coach-assigned drills.';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const [activeTimeScope, setActiveTimeScope] = useState(LEADERBOARD_TIME_SCOPES.CURRENT);
  const [activeProgramDrillId, setActiveProgramDrillId] = useState('');

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

  const rankLabel = viewerRole === 'coach' ? 'Team Rank' : 'Your Rank';
  const archiveCoverageLabel = hasFrozenHistory ? `${coverage.archiveCount} season${coverage.archiveCount === 1 ? '' : 's'}` : 'No archives';
  const allTimeEmptyMessage = hasFrozenHistory
    ? 'No qualifying archived or current training results are available yet.'
    : 'Archive a completed season to begin building all-time rankings.';
  const homeEmptyMessage = isAllTime ? allTimeEmptyMessage : (viewerRole === 'coach' ? CURRENT_TEAM_EMPTY : CURRENT_PLAYER_EMPTY);

  return <div data-testid={testId}>
    <section style={{ padding: '14px', borderRadius: 16, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(165deg, rgba(19,24,31,0.96) 0%, rgba(13,16,22,0.96) 68%, rgba(200,255,0,0.07) 100%)', boxShadow: '0 10px 26px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.04)', marginBottom: 10 }}>
      <div style={{ fontFamily: FALLBACK_FONT, color: VOLT, fontSize: 10, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase' }}>COMPETITION HUB</div>
      <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontSize: 24, letterSpacing: '0.06em', marginTop: 2, lineHeight: 1, textTransform: 'uppercase', fontWeight: 700 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>{BODY_COPY}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
        {[['Scope', scopeLabel], ['Frozen', archiveCoverageLabel], [rankLabel, hasRows ? 'Live' : '—']].map(([k, v]) => <div key={k} style={{ padding: '8px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 9, color: SUB, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</div><div style={{ fontFamily: FALLBACK_FONT, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: LIGHT, marginTop: 3 }}>{v}</div></div>)}
      </div>
    </section>

    <section aria-label="Leaderboard time scope" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
      {TIME_SCOPE_ITEMS.map((item) => {
        const active = activeTimeScope === item.key;
        return <button data-testid={`leaderboard-time-scope-${item.key}`} type="button" aria-pressed={active} key={item.key} onClick={() => setActiveTimeScope(item.key)} style={{ minHeight: 44, padding: '9px 10px', borderRadius: 12, border: active ? '1px solid rgba(200,255,0,0.52)' : '1px solid rgba(255,255,255,0.12)', background: active ? 'rgba(200,255,0,0.14)' : 'rgba(255,255,255,0.025)', color: active ? VOLT : LIGHT, fontFamily: FALLBACK_FONT, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{item.label}</button>;
      })}
    </section>
    {isAllTime && <section data-testid="all-time-coverage-note" style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(200,255,0,0.18)', background: 'rgba(200,255,0,0.05)' }}><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 11, lineHeight: 1.45 }}>{hasFrozenHistory ? `Frozen history from ${archiveCoverageLabel} is combined with live activity after archived date ranges. Archived seasons are never counted twice.` : 'No frozen seasons yet. All-Time currently reflects unarchived live activity only.'}</div></section>}

    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
      {CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 40, padding: '9px 10px', borderRadius: 12, border: active ? '1px solid rgba(200,255,0,0.42)' : '1px solid rgba(255,255,255,0.12)', background: active ? 'linear-gradient(180deg, rgba(200,255,0,0.15), rgba(200,255,0,0.08))' : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: active ? '0 8px 18px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(200,255,0,0.08)' : 'inset 0 0 0 1px rgba(255,255,255,0.02)', fontFamily: FALLBACK_FONT, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, color: active ? '#0E1215' : LIGHT, textAlign: 'center', cursor: 'pointer', transition: 'all 120ms cubic-bezier(0.2,0,0,1)' }}>{item.label}</button>;
      })}
    </section>

    {activeLeaderboardCategory === 'home_shots' ? <>
      <CompactLeaderboardPreviewCard title={isAllTime ? 'All-Time At-Home Shots' : 'At-Home Shots'} areaTitle="At-Home Shots" categoryLabel={scopeLabel} mode={viewerRole} userEmail={userEmail} status={atHomeLeaderboardStatus} rows={atHomeLeaderboardRows} emptyMessage={homeEmptyMessage} maxRows={10} />
      {!hasRows && <section style={{ marginTop: 10, padding: '14px', borderRadius: 14, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(160deg, rgba(200,255,0,0.08), rgba(255,255,255,0.02))' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 15 }}>No rankings yet</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>{isAllTime ? allTimeEmptyMessage : 'Log shots to activate the Home Shots leaderboard.'}</div></section>}
    </> : activeLeaderboardCategory === 'event_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Events Attended</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Event leaders will appear after players check into team events.</div></section> : activeLeaderboardCategory === 'strength_conditioning_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Strength & Conditioning</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Strength leaders will appear after players complete assigned S&C work.</div></section> : <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Program Drills</div>{availableProgramDrills.length > 0 && <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>{availableProgramDrills.map((drill) => { const active = String(selectedProgramDrill?.id) === String(drill.id); return <button key={drill.id} type="button" onClick={() => setActiveProgramDrillId(drill.id)} style={{ flex: '0 0 auto', borderRadius: 999, border: active ? '1px solid rgba(200,255,0,0.5)' : '1px solid rgba(255,255,255,0.14)', background: active ? 'rgba(200,255,0,0.14)' : 'rgba(255,255,255,0.03)', color: active ? LIGHT : SUB, padding: '7px 10px', fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>{drill.name}{drill.historical && isAllTime ? ' · Archived' : ''}</button>; })}</div>}<CompactLeaderboardPreviewCard title={selectedProgramDrill?.name || 'Program Drills'} areaTitle="Program Drills" categoryLabel={scopeLabel} mode={viewerRole} userEmail={userEmail} status="success" rows={programDrillLeaderboardRows} emptyMessage={isAllTime ? allTimeEmptyMessage : 'Program drill leaders will appear after players log coach-assigned drills.'} maxRows={10} /></section>}
  </div>;
}
