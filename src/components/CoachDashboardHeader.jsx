import TeamIdentityTitleStage from "./TeamIdentityTitleStage";
import ShotLabIcon from "./ShotLabIcon";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const displayName = String(userName || "Demo Coach").trim();

  return (
    <div ref={heroRef}>
      <TeamIdentityTitleStage
        variant="hero"
        surface="dark"
        role="Coach"
        title="Mission Control"
        personName={displayName}
        summary="Lead. Develop. Dominate."
        actions={onOpenTeamBranding ? [{
          key: "branding",
          label: "Team Branding",
          onClick: onOpenTeamBranding,
          ariaLabel: "Team Branding Settings",
          icon: <ShotLabIcon name="settings" size={16} />,
        }] : []}
        testId="coach-dashboard-identity-header"
        iconName="coach"
        className="coachDashboardIdentityStage"
        dataLayoutRole="coach-team-credential"
        dataVisualRole="team-home-title"
        dataPageKind="home"
        dataMobileStage="team-identity-hero"
        ariaLabel="Coach team identity and Mission Control"
      />
    </div>
  );
}
