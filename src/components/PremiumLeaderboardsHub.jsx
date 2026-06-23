import React, { useEffect, useMemo, useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';
import { buildAtHomeLeaderboardRows } from '../lib/homeLeaderboardRows.js';
import { getAllProgramScoreRows, getProgramLeaderboardRows } from '../lib/programDrillScoring.js';
import { isShotLabDebugMode } from '../lib/releaseDiagnostics.js';

const CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots' },
  { key: 'event_participation', label: 'Events Attended' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning' },
  { key: 'drill_shots', label: 'Program Drills' },
];

const FALLBACK_FONT = '"Barlow Condensed", "Bebas Neue", var(--font-body, Inter), sans-serif';

export default function PremiumLeaderboardsHub({ viewerRole, leaderboardRows = [], leaderboardStatus = 'idle', userEmail = '', programScores = [], programDrills = [], players = [], teamId = '', homeScores = [], shotLogs = [], testId = 'premium-leaderboards-hub' }) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const BODY_COPY = 'Track team effort across shots, events, strength work, and coach-assigned drills.';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const [activeProgramDrillId, setActiveProgramDrillId] = useState('');
  const normalizedProgramScores = useMemo(() => getAllProgramScoreRows(programScores).filter((score) => !teamId || score.teamId === teamId), [programScores, teamId]);
  const selectedProgramDrill = useMemo(() => (programDrills || []).find((drill) => String(drill?.id) === String(activeProgramDrillId)) || (programDrills || [])[0] || null, [programDrills, activeProgramDrillId]);
  const programDrillLeaderboardRows = useMemo(() => selectedProgramDrill ? getProgramLeaderboardRows(normalizedProgramScores, selectedProgramDrill, players, 10) : [], [normalizedProgramScores, selectedProgramDrill, players]);
  useEffect(() => {
    if (!selectedProgramDrill && programDrills?.[0]?.id) setActiveProgramDrillId(programDrills[0].id);
  }, [selectedProgramDrill, programDrills]);
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
        availablePlayerIdentities: (Array.isArray(players) ? players : []).map((player) => ({ name: player?.name || '', email: player?.email || player?.player_email || '', playerId: player?.playerId || player?.player_id || player?.id || player?.userId || player?.user_id || '' })),
      });
    }
  }, [activeLeaderboardCategory, normalizedProgramScores, selectedProgramDrill, programDrillLeaderboardRows, teamId, userEmail]);
  const fallbackHomeLeaderboardRows = useMemo(() => buildAtHomeLeaderboardRows({ scores: homeScores, shotLogs, programDrills, players, limit: 10 }), [homeScores, shotLogs, programDrills, players]);
  const atHomeLeaderboardRows = Array.isArray(leaderboardRows) && leaderboardRows.length > 0 ? leaderboardRows : fallbackHomeLeaderboardRows;
  const atHomeLeaderboardStatus = leaderboardStatus === 'success' || fallbackHomeLeaderboardRows.length > 0 ? 'success' : leaderboardStatus;
  const hasRows = Array.isArray(atHomeLeaderboardRows) && atHomeLeaderboardRows.length > 0;
  const rankLabel = viewerRole === 'coach' ? 'Team Rank' : 'Your Rank';

  return <div data-testid={testId}>
    <section style={{ padding: '14px', borderRadius: 16, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(165deg, rgba(19,24,31,0.96) 0%, rgba(13,16,22,0.96) 68%, rgba(200,255,0,0.07) 100%)', boxShadow: '0 10px 26px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.04)', marginBottom: 10 }}>
      <div style={{ fontFamily: FALLBACK_FONT, color: VOLT, fontSize: 10, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase' }}>COMPETITION HUB</div>
      <div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontSize: 24, letterSpacing: '0.06em', marginTop: 2, lineHeight: 1, textTransform: 'uppercase', fontWeight: 700 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>{BODY_COPY}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
        {[['Active', 'At-Home Shots'], ['Tracked', '4 categories'], [rankLabel, hasRows ? 'Live' : '—']].map(([k, v]) => <div key={k} style={{ padding: '8px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 9, color: SUB, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</div><div style={{ fontFamily: FALLBACK_FONT, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: LIGHT, marginTop: 3 }}>{v}</div></div>)}
      </div>
    </section>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
      {CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 40, padding: '9px 10px', borderRadius: 12, border: active ? '1px solid rgba(200,255,0,0.42)' : '1px solid rgba(255,255,255,0.12)', background: active ? 'linear-gradient(180deg, rgba(200,255,0,0.15), rgba(200,255,0,0.08))' : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: active ? '0 8px 18px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(200,255,0,0.08)' : 'inset 0 0 0 1px rgba(255,255,255,0.02)', fontFamily: FALLBACK_FONT, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, color: active ? '#0E1215' : LIGHT, textAlign: 'center', cursor: 'pointer', transition: 'all 120ms cubic-bezier(0.2,0,0,1)' }}>{item.label}</button>;
      })}
    </section>
    {activeLeaderboardCategory === 'home_shots' ? <>
      <CompactLeaderboardPreviewCard title="At-Home Shots" areaTitle="At-Home Shots" categoryLabel="Active" mode={viewerRole} userEmail={userEmail} status={atHomeLeaderboardStatus} rows={atHomeLeaderboardRows} emptyMessage={viewerRole === 'coach' ? 'No team leaderboard data yet. Players will appear here after they log shots.' : 'No leaderboard data yet. Log shots to enter the rankings.'} maxRows={10} />
      {!hasRows && <section style={{ marginTop: 10, padding: '14px', borderRadius: 14, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(160deg, rgba(200,255,0,0.08), rgba(255,255,255,0.02))' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 15 }}>No rankings yet</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Log shots to activate the Home Shots leaderboard.</div></section>}
    </> : activeLeaderboardCategory === 'event_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Events Attended</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Event leaders will appear after players check into team events.</div></section> : activeLeaderboardCategory === 'strength_conditioning_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Strength & Conditioning</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Strength leaders will appear after players complete assigned S&C work.</div></section> : <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Program Drills</div>{programDrills.length > 0 && <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>{programDrills.map((drill) => { const active = String(selectedProgramDrill?.id) === String(drill.id); return <button key={drill.id} type="button" onClick={() => setActiveProgramDrillId(drill.id)} style={{ flex: '0 0 auto', borderRadius: 999, border: active ? '1px solid rgba(200,255,0,0.5)' : '1px solid rgba(255,255,255,0.14)', background: active ? 'rgba(200,255,0,0.14)' : 'rgba(255,255,255,0.03)', color: active ? LIGHT : SUB, padding: '7px 10px', fontFamily: FALLBACK_FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>{drill.name}</button>; })}</div>}<CompactLeaderboardPreviewCard title={selectedProgramDrill?.name || 'Program Drills'} areaTitle="Program Drills" categoryLabel="Program" mode={viewerRole} userEmail={userEmail} status="success" rows={programDrillLeaderboardRows} emptyMessage="Program drill leaders will appear after players log coach-assigned drills." maxRows={10} /></section>}
  </div>;
}
