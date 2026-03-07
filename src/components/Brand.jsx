import { brandTheme } from "../styles/theme";

function BrandLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="40" height="40" rx="12" fill="url(#brandGlow)" />
      <path d="M14 29L20 13h4l6 16h-4l-1.2-3.5h-5.6L18 29h-4z" fill="#08110A" />
      <defs>
        <linearGradient id="brandGlow" x1="5" y1="4" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-primary)" />
          <stop offset="1" stopColor="var(--brand-secondary)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Brand({ compact = false, className = "" }) {
  return (
    <div className={`brand-mark ${className}`} style={{ opacity: 0.98 }}>
      <BrandLogo size={compact ? 24 : 34} />
      <div style={{ lineHeight: 1 }}>
        <div className="brand-heading" style={{ fontSize: compact ? 16 : 24, color: "var(--brand-neutral-100)" }}>ShotLab</div>
        <div style={{ fontSize: compact ? 9 : 11, color: "var(--brand-neutral-300)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {compact ? "Refined Performance" : brandTheme.mission}
        </div>
      </div>
    </div>
  );
}
