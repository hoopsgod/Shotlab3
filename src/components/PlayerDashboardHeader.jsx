import TeamIdentityTitleStage from "./TeamIdentityTitleStage";

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const displayName = String(userName || "Player").trim();

  return (
    <TeamIdentityTitleStage
      variant="hero"
      surface="dark"
      role="PLAYER"
      eyebrow="ATHLETE WORKSPACE"
      title={displayName}
      summary={subtitle}
      status={mission}
      testId="player-dashboard-identity-header"
      showTonalCrest
    />
  );
}
