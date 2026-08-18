import TeamIdentityTitleStage from "./TeamIdentityTitleStage";

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const displayName = String(userName || "Demo Player").trim();

  return (
    <TeamIdentityTitleStage
      variant="hero"
      surface="dark"
      role="Player"
      title={displayName}
      summary={subtitle}
      status={mission}
      testId="player-dashboard-identity-header"
      iconName="player"
      className="playerDashboardIdentityStage"
      dataLayoutRole="athlete-team-credential"
      dataVisualRole="team-home-title"
      dataPageKind="home"
      dataMobileStage="team-identity-hero"
      ariaLabel="Player team identity"
    />
  );
}
