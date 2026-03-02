import React from "react";

function WhistleIcon({ size = 12, color = "#000000", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="8" cy="10" r="4" stroke={color} strokeWidth="2" />
      <path d="M12 10h4a4 4 0 1 1 0 8h-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="9.5" r="1.2" fill={color} />
    </svg>
  );
}

function ChevronRightIcon({ size = 12, color = "#A0A0A0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EmptyState({
  icon: Icon,
  iconColor = "#555555",
  headline,
  supportingText,
  ctaLabel,
  ctaAction,
  secondaryLabel,
  secondaryAction,
  isCoach = false,
  showGlow = false,
}) {
  const finalIconColor = isCoach ? "rgba(200, 255, 0, 0.6)" : iconColor;

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        @keyframes esFadeScaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes esFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        style={{
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          gap: "16px",
        }}
      >
        {(showGlow || isCoach) && (
          <div
            style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(200, 255, 0, 0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        )}

        <div style={{ animation: "esFadeScaleIn 300ms ease-out both" }}>
          {Icon ? <Icon size={48} color={finalIconColor} /> : null}
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#FFFFFF",
            textAlign: "center",
            fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
            animation: "esFadeIn 300ms ease-out 100ms both",
          }}
        >
          {headline}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#A0A0A0",
            textAlign: "center",
            maxWidth: "260px",
            lineHeight: 1.5,
            animation: "esFadeIn 300ms ease-out 200ms both",
          }}
        >
          {supportingText}
        </div>

        <button
          onClick={ctaAction}
          style={{
            background: "#C8FF00",
            color: "#000000",
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            height: "52px",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "320px",
            boxShadow: "0 4px 24px rgba(200, 255, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
            animation: "esFadeIn 300ms ease-out 300ms both",
          }}
        >
          {isCoach && <WhistleIcon size={12} color="#000000" style={{ opacity: 0.6 }} />}
          {ctaLabel}
        </button>

        {secondaryLabel && (
          <button
            onClick={secondaryAction}
            style={{
              fontSize: "12px",
              color: "#A0A0A0",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {secondaryLabel}
            <ChevronRightIcon size={12} color="#A0A0A0" />
          </button>
        )}
      </div>
    </div>
  );
}
