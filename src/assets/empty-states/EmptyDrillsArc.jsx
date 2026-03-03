const STROKE = "rgba(255,255,255,0.35)";

export default function EmptyDrillsArc() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M18 62h44" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <path d="M20 62c8-20 18-34 28-34s20 14 28 34" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <path className="emptyState__accentDash" d="M20 62c8-20 18-34 28-34" stroke="#CCFF00" strokeOpacity="0.9" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="emptyState__ball" cx="41" cy="28" r="4" fill="#CCFF00" fillOpacity="0.9" />
      <path d="M41 24v8M37 28h8" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
