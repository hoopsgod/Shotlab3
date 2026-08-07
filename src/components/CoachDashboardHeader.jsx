import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./DashboardIdentityHeader.module.css";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Coach").trim();

  return (
    <section ref={heroRef} className={`${styles.header} ${styles.coach}`} data-testid="coach-dashboard-identity-header">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.modeRow}>
            <span className={styles.badge}>Coach Mode</span>
            <span className={styles.teamName}>{teamName}</span>
          </div>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.tagline}>Lead. Develop. Dominate.</p>
          <button type="button" onClick={onOpenTeamBranding} className={styles.brandBtn}>
            <ShotLabIcon name="settings" size={17} />
            <span>Team Branding Settings</span>
          </button>
        </div>
        <div className={styles.brandPanel} aria-label={`${teamName} identity`}>
          <img className={styles.brandMark} src={logoSrc} alt={`${teamName} logo`} />
        </div>
      </div>
    </section>
  );
}
