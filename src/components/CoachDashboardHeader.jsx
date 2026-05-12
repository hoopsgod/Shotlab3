import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachDashboardHeader.module.css";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding, onLogout }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";

  return (
    <section ref={heroRef} className={styles.header}>
      <div className={styles.inner}>
        <div>
          <span className={styles.badge}>Coach Mode</span>
          <h1 className={styles.name}>{(userName || "Demo Coach").toUpperCase()}</h1>
          <p className={styles.tagline}>Lead. Develop. Dominate.</p>
          <div className={styles.meta}><span className={styles.dot} aria-hidden="true" />Coach identity · Team control</div>
          <button type="button" onClick={onOpenTeamBranding} className={styles.brandBtn}>Team Branding Settings</button>
        </div>
      </div>

      <img className={styles["coach-floating-logo"]} src={logoSrc} alt={`${branding?.teamName || "Team"} logo`} />
      <button type="button" onClick={onLogout} aria-label="Log out" className={styles["coach-logo-close"]}>✕</button>
    </section>
  );
}
