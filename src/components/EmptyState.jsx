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
  cta = "GET STARTED",
  ctaVariant = "primary",
  secondaryCta,
  onSecondaryTap,
  secondaryCtaVariant = "tertiary",
  icon,
}) {
  const Art = variant ? ART_BY_VARIANT[variant] : null;

  return (
    <Card variant="empty" className="emptyState card card--empty">
      <div className="emptyState__art">
        {Art ? <Art /> : icon}
      </div>
      <p className="emptyState__title">
        {title}
      </p>
      {subtitle && (
        <p className="emptyState__subtitle u-secondary-text">
          {subtitle}
        </p>
      )}
      <div className="emptyState__actions">
        <Button
          onClick={onTap || (() => {})}
          variant={ctaVariant}
          className={`${ctaVariant === "tertiary" ? "" : "btn-v"} ${ctaVariant === "primary" ? "emptyState__primary" : ""}`.trim()}
        >
          {cta}
        </Button>
        {secondaryCta && (
          <Button onClick={onSecondaryTap || (() => {})} variant={secondaryCtaVariant}>
            {secondaryCta}
          </Button>
        )}
      </div>
    </Card>
  );
}
