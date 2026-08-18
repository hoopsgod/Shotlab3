import TeamIdentityTitleStage from "./TeamIdentityTitleStage";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const displayName = String(userName || "Coach").trim();

  return (
    <div ref={heroRef}>
      <TeamIdentityTitleStage
        variant="hero"
        surface="dark"
        role="COACH"
        eyebrow="PROGRAM COMMAND"
        title="Mission Control"
        userName={displayName}
        summary="Lead. Develop. Dominate."
        actions={onOpenTeamBranding ? [{ key: "branding", label: "Team Branding", onClick: onOpenTeamBranding }] : []}
        testId="coach-dashboard-identity-header"
        showTonalCrest
      />
    </div>
  );
}
