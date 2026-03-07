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

export const EMPTY_STATE_PRESETS = {
  noSessions: {
    variant: "lifting",
    title: "No sessions scheduled yet",
    description: "Plan your next training block so players can RSVP and prepare early.",
    ctaLabel: "Schedule session",
  },
  noActivity: {
    variant: "events",
    title: "No team activity yet",
    description: "Scores, logs, and updates will populate here as your group starts recording reps.",
    ctaLabel: "Log first score",
  },
  noPlayers: {
    variant: "leaderboard",
    title: "No players on the roster yet",
    description: "Invite your squad to join and unlock player tracking, status, and leaderboards.",
    ctaLabel: "Invite players",
  },
  noDuels: {
    variant: "drills",
    title: "No duels available yet",
    description: "Start the first matchup to spark competition and build momentum.",
    ctaLabel: "Start a duel",
  },
  noCoachInsightsYet: {
    variant: "events",
    title: "Coach insights are warming up",
    description: "Once activity rolls in, you'll see attendance trends, roster movement, and session signals here.",
    ctaLabel: "Open activity feed",
  },
};

export default function EmptyState({
  preset,
  variant,
  title,
  subtitle,
  description,
  onTap,
  onCtaClick,
  cta = "GET STARTED",
  ctaLabel,
  ctaVariant = "primary",
  secondaryCta,
  onSecondaryTap,
  secondaryCtaVariant = "tertiary",
  icon,
  className,
}) {
  const resolvedPreset = preset ? EMPTY_STATE_PRESETS[preset] || {} : {};
  const Art = (variant || resolvedPreset.variant) ? ART_BY_VARIANT[variant || resolvedPreset.variant] : null;
  const primaryLabel = ctaLabel ?? resolvedPreset.ctaLabel ?? cta;
  const primaryAction = onCtaClick ?? onTap;
  const resolvedTitle = title ?? resolvedPreset.title;
  const resolvedDescription = description || subtitle || resolvedPreset.description;

  return (
    <Card variant="empty" className={`emptyState card card--empty ${className || ""}`.trim()}>
      <div className="emptyState__art">
        {Art ? <Art /> : icon}
      </div>
      <p className="emptyState__title">
        {resolvedTitle}
      </p>
      {resolvedDescription && (
        <p className="emptyState__subtitle u-secondary-text">
          {resolvedDescription}
        </p>
      )}
      <div className="emptyState__actions">
        {primaryLabel && primaryAction && (
          <Button
            onClick={primaryAction}
            variant={ctaVariant}
            className={`${ctaVariant === "tertiary" ? "" : "btn-v"} ${ctaVariant === "primary" ? "emptyState__primary" : ""}`.trim()}
          >
            {primaryLabel}
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
