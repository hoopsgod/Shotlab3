import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const displayName = String(userName || "Demo Coach").trim();
  const actions = onOpenTeamBranding ? [{ key: "branding", label: "Team Branding", onClick: onOpenTeamBranding, ariaLabel: "Team Branding Settings" }] : [];
  return (
    <div ref={heroRef}>
      <TeamIdentityTitleStage
        variant="standard"
        surface="light"
        role="Coach Mode"
        title="Mission Control"
        personName={displayName}
        summary="Lead. Develop. Dominate."
        actions={actions}
        testId="coach-dashboard-identity-header"
        className="coachDashboardIdentityStage"
        dataLayoutRole="dashboard-identity"
        dataVisualRole="coach-home-identity-proxy"
        dataPageKind="home"
        dataMobileStage="team-identity"
        ariaLabel={`${displayName} Coach Mission Control identity`}
      />
    </div>
  );
}
