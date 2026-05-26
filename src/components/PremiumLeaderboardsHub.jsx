import React, { useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';

const CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots' },
  { key: 'event_participation', label: 'Events Attended' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning' },
  { key: 'drill_shots', label: 'Coach Custom Drills' },
];

export default function PremiumLeaderboardsHub({ viewerRole, leaderboardRows = [], leaderboardStatus = 'idle', userEmail = '', testId = 'premium-leaderboards-hub' }) {
  const VOLT = '#C8FF00';
  const LIGHT = '#F5F7FA';
  const SUB = '#9AA4B2';
  const BODY_COPY = 'Track team effort across shots, events, strength work, and coach-assigned drills.';
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const hasRows = Array.isArray(leaderboardRows) && leaderboardRows.length > 0;

  return <div data-testid={testId}>
    <section style={{ padding: '18px', borderRadius: 18, border: '1px solid rgba(200,255,0,0.38)', background: 'linear-gradient(156deg, rgba(200,255,0,0.2), rgba(255,255,255,0.03) 36%, rgba(8,10,14,0.92))', boxShadow: '0 18px 42px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(200,255,0,0.12)', marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: VOLT, fontSize: 10, letterSpacing: '0.12em', fontWeight: 900 }}>COMPETITION HUB</div>
      <div style={{ fontFamily: 'var(--font-display, Orbitron)', color: LIGHT, fontSize: 28, letterSpacing: '0.06em', marginTop: 5 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{BODY_COPY}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
        {[['Active', 'At-Home Shots'], ['Tracked', '4 categories'], ['Team Rank', hasRows ? 'Live' : '—']].map(([k, v]) => <div key={k} style={{ padding: '8px 9px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.22)' }}><div style={{ fontFamily: 'var(--font-body, Inter)', fontSize: 9, color: SUB, letterSpacing: '0.08em' }}>{k.toUpperCase()}</div><div style={{ fontFamily: 'var(--font-display, Orbitron)', fontSize: 14, color: LIGHT, marginTop: 3 }}>{v}</div></div>)}
      </div>
    </section>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
      {CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 42, padding: '9px 10px', borderRadius: 999, border: active ? '1px solid rgba(200,255,0,0.52)' : '1px solid rgba(255,255,255,0.16)', background: active ? 'rgba(200,255,0,0.12)' : 'rgba(255,255,255,0.03)', boxShadow: active ? '0 0 18px rgba(200,255,0,0.2)' : 'none', fontFamily: 'var(--font-body, Inter)', fontSize: 11, fontWeight: 800, color: active ? VOLT : LIGHT, textAlign: 'center', cursor: 'pointer' }}>{item.label}</button>;
      })}
    </section>
    {activeLeaderboardCategory === 'home_shots' ? <>
      <CompactLeaderboardPreviewCard title="At-Home Shots" areaTitle="At-Home Shots" categoryLabel="Active" mode={viewerRole} userEmail={userEmail} status={leaderboardStatus} rows={leaderboardRows} emptyMessage={viewerRole === 'coach' ? 'No team leaderboard data yet. Players will appear here after they log shots.' : 'No leaderboard data yet. Log shots to enter the rankings.'} maxRows={10} />
      {!hasRows && <section style={{ marginTop: 10, padding: '14px', borderRadius: 14, border: '1px solid rgba(200,255,0,0.24)', background: 'linear-gradient(160deg, rgba(200,255,0,0.08), rgba(255,255,255,0.02))' }}><div style={{ fontFamily: 'var(--font-display, Orbitron)', color: LIGHT, fontSize: 16 }}>No rankings yet</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Log shots to activate the Home Shots leaderboard.</div></section>}
    </> : activeLeaderboardCategory === 'event_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display, Orbitron)', color: LIGHT, fontSize: 15 }}>Events Attended</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Event leaders will appear after players check into team events.</div></section> : activeLeaderboardCategory === 'strength_conditioning_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display, Orbitron)', color: LIGHT, fontSize: 15 }}>Strength & Conditioning</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Strength leaders will appear after players complete assigned S&C work.</div></section> : <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display, Orbitron)', color: LIGHT, fontSize: 15 }}>Coach Drills</div><div style={{ fontFamily: 'var(--font-body, Inter)', color: SUB, fontSize: 12, marginTop: 4 }}>Drill leaders will appear after players log coach-assigned drills.</div></section>}
  </div>;
}
