import EmptyDrillsArc from "../assets/empty-states/EmptyDrillsArc";
import EmptyEventsCourt from "../assets/empty-states/EmptyEventsCourt";
import EmptyLeaderboardPodium from "../assets/empty-states/EmptyLeaderboardPodium";
import EmptyLiftingRack from "../assets/empty-states/EmptyLiftingRack";
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
  action,
  onTap,
  cta = "GET STARTED",
  ctaVariant = "primary",
  icon,
}) {
  const Art = variant ? ART_BY_VARIANT[variant] : null;

  return (
    <div className="emptyState" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div className="emptyState__art" style={{ color: "rgba(255,255,255,0.35)" }}>
        {Art ? <Art /> : icon}
      </div>
      <p className="emptyState__title u-allcaps-long" style={{ fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif", color: "#E5E7EB", fontSize: 18, lineHeight: 1.2 }}>
        {title}
      </p>
      {(subtitle || action) && (
        <p className="emptyState__subtitle u-secondary-text" style={{ fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif", fontSize: 13, lineHeight: 1.5, fontWeight: 500, maxWidth: 260, marginInline: "auto" }}>
          {subtitle || action}
        </p>
      )}
      <Button
        onClick={onTap || (() => {})}
        variant={ctaVariant}
        className={ctaVariant === "tertiary" ? "" : "btn-v"}
        style={{
          marginTop: 14,
          width: ctaVariant === "tertiary" ? "auto" : "calc(100% - 32px)",
          marginLeft: ctaVariant === "tertiary" ? "auto" : 16,
          marginRight: ctaVariant === "tertiary" ? "auto" : 16,
        }}
      >
        {cta}
      </Button>
    </div>
  );
}
