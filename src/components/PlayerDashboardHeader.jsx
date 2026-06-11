import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachDashboardHeader.module.css";

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";

  return (
    <section className={`${styles.header} ${styles.playerHeader}`} data-dashboard-header="player-premium">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <span className={styles.badge}>Player Mode</span>
          <h1 className={styles.name}>{(userName || "Demo Player").toUpperCase()}</h1>
          <p className={styles.tagline}>{subtitle}</p>
          <div className={styles.meta}><span className={styles.dot} aria-hidden="true" />{mission}</div>
        </div>
        <img className={styles.brandMark} src={logoSrc} alt="" aria-hidden="true" />
      </div>
    </section>
  );
}
