import React, { useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';

const CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots' },
  { key: 'event_participation', label: 'Events Attended' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning' },
  { key: 'drill_shots', label: 'Coach Custom Drills' },
];

const FALLBACK_FONT = '"Barlow Condensed", "Bebas Neue", var(--font-body, Inter), sans-serif';

export default function PremiumLeaderboardsHub({ viewerRole, leaderboardRows = [], leaderboardStatus = 'idle', userEmail = '', testId = 'premium-leaderboards-hub' }) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const BODY_COPY = 'Track team effort across shots, events, strength work, and coach-assigned drills.';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const hasRows = Array.isArray(leaderboardRows) && leaderboardRows.length > 0;
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
      <CompactLeaderboardPreviewCard title="At-Home Shots" areaTitle="At-Home Shots" categoryLabel="Active" mode={viewerRole} userEmail={userEmail} status={leaderboardStatus} rows={leaderboardRows} emptyMessage={viewerRole === 'coach' ? 'No team leaderboard data yet. Players will appear here after they log shots.' : 'No leaderboard data yet. Log shots to enter the rankings.'} maxRows={10} />
      {!hasRows && <section style={{ marginTop: 10, padding: '14px', borderRadius: 14, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(160deg, rgba(200,255,0,0.08), rgba(255,255,255,0.02))' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 15 }}>No rankings yet</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Log shots to activate the Home Shots leaderboard.</div></section>}
    </> : activeLeaderboardCategory === 'event_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Events Attended</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Event leaders will appear after players check into team events.</div></section> : activeLeaderboardCategory === 'strength_conditioning_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Strength & Conditioning</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Strength leaders will appear after players complete assigned S&C work.</div></section> : <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: FALLBACK_FONT, color: LIGHT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14 }}>Coach Drills</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Drill leaders will appear after players log coach-assigned drills.</div></section>}
  </div>;
}
