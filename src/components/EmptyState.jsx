import EmptyDrillsArc from "../assets/empty-states/EmptyDrillsArc";
import EmptyEventsCourt from "../assets/empty-states/EmptyEventsCourt";
import EmptyLeaderboardPodium from "../assets/empty-states/EmptyLeaderboardPodium";
import EmptyLiftingRack from "../assets/empty-states/EmptyLiftingRack";
import Card from "./Card";
import Button from "./ui/Button";

const lineIcon = (path) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const ART_BY_VARIANT = {
  events: EmptyEventsCourt,
  drills: EmptyDrillsArc,
  leaderboard: EmptyLeaderboardPodium,
  lifting: EmptyLiftingRack,
  duels: () => lineIcon(<><path d="M13 2 4 14h7l-1 8 10-14h-7z" /><path d="M9 8h4" /></>),
  activity: () => lineIcon(<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10" /><path d="M7 13h7" /></>),
  players: () => lineIcon(<><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0" /><path d="M17 8h4" /><path d="M19 6v4" /></>),
};

export default function EmptyState({
  variant,
  icon,
  title,
  description,
  subtitle,
  ctaLabel,
  cta,
  onCtaClick,
  onTap,
  ctaVariant = "primary",
  secondaryCta,
  onSecondaryTap,
  secondaryCtaVariant = "tertiary",
  align = "center",
}) {
  const Art = variant ? ART_BY_VARIANT[variant] : null;
  const resolvedDescription = description ?? subtitle;
  const resolvedCtaLabel = ctaLabel ?? cta;
  const handlePrimary = onCtaClick ?? onTap;

  return (
    <Card
      variant="empty"
      className="emptyState card card--empty"
      style={{
        textAlign: align === "left" ? "left" : "center",
        padding: "20px 16px",
        background: "linear-gradient(180deg, rgba(16,23,34,0.7), rgba(11,18,32,0.55))",
        border: "1px solid rgba(159,178,204,0.24)",
        boxShadow: "none",
      }}
    >
      <div
        className="emptyState__art"
        style={{
          color: "rgba(201,210,223,0.56)",
          width: 72,
          height: 72,
          margin: align === "left" ? "0 0 10px" : "0 auto 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Art ? <Art /> : icon}
      </div>
      <p className="emptyState__title" style={{ color: "#E5E7EB", fontSize: 18, fontWeight: 600, lineHeight: 1.2, marginBottom: 8 }}>
        {title}
      </p>
      {resolvedDescription && (
        <p className="emptyState__subtitle u-secondary-text" style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 500, opacity: 0.82, maxWidth: 360, marginInline: align === "left" ? 0 : "auto" }}>
          {resolvedDescription}
        </p>
      )}
      {(resolvedCtaLabel || secondaryCta) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: align === "left" ? "flex-start" : "center",
            gap: 10,
            marginTop: 14,
          }}
        >
          {resolvedCtaLabel && handlePrimary && (
            <Button onClick={handlePrimary} variant={ctaVariant} className={ctaVariant === "tertiary" ? "" : "btn-v"}>
              {resolvedCtaLabel}
            </Button>
          )}
          {secondaryCta && (
            <Button onClick={onSecondaryTap || (() => {})} variant={secondaryCtaVariant}>
              {secondaryCta}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
