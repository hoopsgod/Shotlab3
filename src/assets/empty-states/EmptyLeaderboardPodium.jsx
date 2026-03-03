const STROKE = "rgba(255,255,255,0.35)";

export default function EmptyLeaderboardPodium() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="10" y="52" width="18" height="14" rx="3" stroke={STROKE} strokeWidth="2" />
      <rect x="31" y="44" width="18" height="22" rx="3" stroke={STROKE} strokeWidth="2" />
      <rect x="52" y="48" width="18" height="18" rx="3" stroke={STROKE} strokeWidth="2" />
      <path d="M10 52h60" stroke={STROKE} strokeWidth="2" />
      <circle cx="40" cy="32" r="5" stroke={STROKE} strokeWidth="2" />
      <path d="M35 32h10" stroke={STROKE} strokeWidth="1.5" />
      <path className="emptyState__accentPulse" d="M37 28h6M40 25v6" stroke="#CCFF00" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
