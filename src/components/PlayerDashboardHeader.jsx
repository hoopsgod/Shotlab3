import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./PlayerDashboardHeader.module.css";

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Player").trim();

  return (
    <section className={styles.header} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.modeRow}>
            <span className={styles.badge}>Player Mode</span>
            <span className={styles.teamName}>{teamName}</span>
          </div>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.tagline}>{subtitle}</p>
          <div className={styles.mission}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.missionLabel}>Today</span>
            <strong>{mission}</strong>
          </div>
        </div>
        <div className={styles.brandPanel} aria-hidden="true">
          <img className={styles.brandMark} src={logoSrc} alt="" />
          <span className={styles.brandCaption}>Team identity</span>
        </div>
      </div>
    </section>
  );
}
