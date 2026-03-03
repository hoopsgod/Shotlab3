const STROKE = "rgba(255,255,255,0.35)";

export default function EmptyLiftingRack() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M18 20v44M62 20v44" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 30h44M18 64h44" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="38" width="32" height="4" rx="2" stroke={STROKE} strokeWidth="2" />
      <circle cx="20" cy="40" r="4" stroke={STROKE} strokeWidth="2" />
      <circle cx="60" cy="40" r="4" stroke="#CCFF00" strokeOpacity="0.9" strokeWidth="2.5" className="emptyState__accentPulse" />
    </svg>
  );
}
