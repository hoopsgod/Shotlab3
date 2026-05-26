import React, { useState } from 'react';
import CompactLeaderboardPreviewCard from './CompactLeaderboardPreviewCard';

const CATEGORY_ITEMS = [
  { key: 'home_shots', label: 'At-Home Shots', testId: 'leaderboards-category-home-shots' },
  { key: 'event_participation', label: 'Events Attended', testId: 'leaderboards-category-events' },
  { key: 'strength_conditioning_participation', label: 'Strength & Conditioning', testId: 'leaderboards-category-strength' },
  { key: 'drill_shots', label: 'Coach Custom Drills', testId: 'leaderboards-category-drills' },
];

export default function LeaderboardsHub({ viewerRole, leaderboardRows = [], leaderboardStatus = 'idle', userEmail = '' }) {
  const [activeLeaderboardCategory, setActiveLeaderboardCategory] = useState('home_shots');
  const hasRows = Array.isArray(leaderboardRows) && leaderboardRows.length > 0;

  return <div data-testid="leaderboards-hub">
    <section style={{ padding: '14px', borderRadius: 16, border: '1px solid color-mix(in srgb,var(--accent) 36%, var(--stroke-1))', background: 'linear-gradient(150deg, color-mix(in srgb,var(--accent) 16%, #0d1016), #111623 56%, #0b0f17)', boxShadow: '0 14px 30px rgba(0,0,0,0.30)', marginBottom: 10 }}>
      <div style={{ fontFamily: 'var(--font-body)', color: 'var(--accent)', fontSize: 10, letterSpacing: '0.11em', fontWeight: 900 }}>COMPETITION HUB</div>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 21, letterSpacing: '0.08em', marginTop: 5 }}>LEADERBOARDS</div>
      <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontSize: 12, lineHeight: 1.45, marginTop: 6 }}>Track team effort across shots, events, strength work, and coach-assigned drills.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
        {[['Active', 'At-Home Shots'], ['Tracked', '4 categories'], [viewerRole === 'coach' ? 'Team Rank' : 'Your Rank', hasRows ? 'Live' : '—']].map(([k, v]) => <div key={k} style={{ padding: '8px 9px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.22)' }}><div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em' }}>{k.toUpperCase()}</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-1)', marginTop: 3 }}>{v}</div></div>)}
      </div>
    </section>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
      {CATEGORY_ITEMS.map((item) => {
        const active = activeLeaderboardCategory === item.key;
        return <button type="button" data-testid={item.testId} aria-selected={active} key={item.label} onClick={() => setActiveLeaderboardCategory(item.key)} style={{ minHeight: 42, padding: '9px 10px', borderRadius: 999, border: active ? '1px solid color-mix(in srgb,var(--accent) 68%, transparent)' : '1px solid rgba(255,255,255,0.16)', background: active ? 'color-mix(in srgb,var(--accent) 14%, transparent)' : 'rgba(255,255,255,0.03)', boxShadow: active ? '0 0 18px color-mix(in srgb,var(--accent) 35%, transparent)' : 'none', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: active ? 'var(--accent)' : 'var(--text-1)', textAlign: 'center', cursor: 'pointer' }}>{item.label}</button>;
      })}
    </section>
    {activeLeaderboardCategory === 'home_shots' ? <>
      <CompactLeaderboardPreviewCard title="At-Home Shots" areaTitle="At-Home Shots" categoryLabel="Active" mode={viewerRole} userEmail={userEmail} status={leaderboardStatus} rows={leaderboardRows} emptyMessage={viewerRole === 'coach' ? 'No team leaderboard data yet. Players will appear here after they log shots.' : 'No leaderboard data yet. Log shots to enter the rankings.'} maxRows={10} />
      {!hasRows && <section style={{ marginTop: 10, padding: '14px', borderRadius: 14, border: '1px solid color-mix(in srgb,var(--accent) 30%, transparent)', background: 'linear-gradient(160deg, color-mix(in srgb,var(--accent) 8%, transparent), rgba(255,255,255,0.02))' }}><div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 16 }}>No rankings yet</div><div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Log shots to activate the Home Shots leaderboard.</div></section>}
    </> : activeLeaderboardCategory === 'event_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 15 }}>Events Attended</div><div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Event leaders will appear after players check into team events.</div></section> : activeLeaderboardCategory === 'strength_conditioning_participation' ? <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 15 }}>Strength & Conditioning</div><div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Strength leaders will appear after players complete assigned S&C work.</div></section> : <section style={{ marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.02)' }}><div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)', fontSize: 15 }}>Coach Custom Drills</div><div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Drill leaders will appear after players log coach-assigned drills.</div></section>}
  </div>;
}
