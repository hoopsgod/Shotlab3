import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";
import "./PlayerDashboardHeader.css";

export default function PlayerDashboardHeader({ userName, subtitle, mission }) {
  const displayName = String(userName || "Player").trim();
  return (
    <TeamIdentityTitleStage
      variant="hero"
      surface="dark"
      role="Player Mode"
      title={displayName}
      summary={subtitle || "Train. Track. Improve."}
      status={mission || null}
      testId="player-dashboard-identity-header"
      className="playerDashboardIdentityStage"
      dataLayoutRole="dashboard-identity"
      dataVisualRole="player-home-identity"
      dataPageKind="home"
      dataMobileStage="team-identity"
      ariaLabel={`${displayName} player identity`}
    />
  );
}
