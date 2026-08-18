import TeamIdentityTitleStage from "./TeamIdentityTitleStage";

const PLAYER_HOME_IDENTITY_CSS = `
@media(max-width:700px){
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"]{display:none!important}
}
`;

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const displayName = String(userName || "Player").trim();

  return <>
    <style>{PLAYER_HOME_IDENTITY_CSS}</style>
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
  </>;
}
