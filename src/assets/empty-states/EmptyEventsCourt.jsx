const STROKE = "rgba(255,255,255,0.35)";

export default function EmptyEventsCourt() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="9" y="15" width="62" height="50" rx="8" stroke={STROKE} strokeWidth="2" />
      <path d="M40 15v50" stroke={STROKE} strokeWidth="2" />
      <circle cx="40" cy="40" r="7" stroke={STROKE} strokeWidth="2" />
      <path d="M9 30h10v20H9" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M71 30H61v20h10" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
      <circle className="emptyState__accentOrbit" cx="40" cy="40" r="2.5" fill="#CCFF00" fillOpacity="0.9" />
    </svg>
  );
}
