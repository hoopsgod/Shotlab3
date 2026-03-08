import EmptyDrillsArc from "../assets/empty-states/EmptyDrillsArc";
import EmptyEventsCourt from "../assets/empty-states/EmptyEventsCourt";
import EmptyLeaderboardPodium from "../assets/empty-states/EmptyLeaderboardPodium";
import EmptyLiftingRack from "../assets/empty-states/EmptyLiftingRack";
import { EmptyStateCard } from "./cards/MobileCards";
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
  description,
  onTap,
  onCtaClick,
  cta = "Get started",
  ctaLabel,
  ctaVariant = "primary",
  secondaryCta,
  onSecondaryTap,
  secondaryCtaVariant = "tertiary",
  icon,
  className,
}) {
  const Art = variant ? ART_BY_VARIANT[variant] : null;
  const primaryLabel = ctaLabel ?? cta;
  const primaryAction = onCtaClick ?? onTap;

  return (
    <EmptyStateCard
      className={`emptyState card card--empty ${className || ""}`.trim()}
      icon={<>{Art ? <Art /> : icon}</>}
      title={title}
      description={description || subtitle}
      actions={(
        <>
          {primaryLabel && primaryAction && (
            <Button
              onClick={primaryAction}
              variant={ctaVariant}
              className={`${ctaVariant === "primary" ? "emptyState__primary" : ""}`.trim()}
            >
              {primaryLabel}
            </Button>
          )}
          {secondaryCta && (
            <Button onClick={onSecondaryTap || (() => {})} variant={secondaryCtaVariant}>
              {secondaryCta}
            </Button>
          )}
        </>
      )}
    />
  );
}
