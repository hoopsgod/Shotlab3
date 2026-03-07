import EmptyDrillsArc from "../assets/empty-states/EmptyDrillsArc";
import EmptyEventsCourt from "../assets/empty-states/EmptyEventsCourt";
import EmptyLeaderboardPodium from "../assets/empty-states/EmptyLeaderboardPodium";
import EmptyLiftingRack from "../assets/empty-states/EmptyLiftingRack";
import Card from "./Card";
import Button from "./ui/Button";

const ART_BY_VARIANT = {
  events: EmptyEventsCourt,
  drills: EmptyDrillsArc,
  leaderboard: EmptyLeaderboardPodium,
  lifting: EmptyLiftingRack,
};

export default function EmptyState({
  variant,
  title,
  subtitle,
  onTap,
  cta,
  ctaVariant = "primary",
  secondaryCta,
  onSecondaryTap,
  secondaryCtaVariant = "tertiary",
  icon,
}) {
  const Art = variant ? ART_BY_VARIANT[variant] : null;

  return (
    <Card variant="empty" className="emptyState card card--empty" style={{ textAlign: "center", padding: "28px 20px 24px" }}>
      <div className="emptyState__art" style={{ color: "rgba(255,255,255,0.4)", width: 88, height: 88, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {Art ? <Art /> : icon}
      </div>
      <p className="emptyState__title" style={{ fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif", color: "#E5E7EB", fontSize: 18, fontWeight: 600, lineHeight: 1.2, marginBottom: 8 }}>
        {title}
      </p>
      {subtitle && (
        <p className="emptyState__subtitle u-secondary-text" style={{ fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif", fontSize: 14, lineHeight: 1.6, fontWeight: 500, opacity: 0.8, maxWidth: 300, marginInline: "auto" }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: cta || secondaryCta ? 16 : 0 }}>
        {cta && (
          <Button
            onClick={onTap || (() => {})}
            variant={ctaVariant}
            className={ctaVariant === "tertiary" ? "" : "btn-v"}
            style={{
              width: ctaVariant === "tertiary" ? "auto" : "calc(100% - 32px)",
              marginLeft: ctaVariant === "tertiary" ? "auto" : 16,
              marginRight: ctaVariant === "tertiary" ? "auto" : 16,
            }}
          >
            {cta}
          </Button>
        )}
        {secondaryCta && (
          <Button onClick={onSecondaryTap || (() => {})} variant={secondaryCtaVariant}>
            {secondaryCta}
          </Button>
        )}
      </div>
    </Card>
  );
}
