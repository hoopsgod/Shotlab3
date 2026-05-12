import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachDashboardHeader.module.css";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";

  return (
    <section ref={heroRef} className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <span className={styles.badge}>Coach Mode</span>
          <h1 className={styles.name}>{(userName || "Demo Coach").toUpperCase()}</h1>
          <p className={styles.tagline}>Lead. Develop. <span className={styles.taglineAccent}>Dominate.</span></p>
          <div className={styles.meta}><span className={styles.dot} aria-hidden="true" />Coach identity · Team control</div>
          <button type="button" onClick={onOpenTeamBranding} className={styles.brandBtn}>Team Branding Settings</button>
        </div>
        <img className={styles.brandMark} src={logoSrc} alt="" aria-hidden="true" />
      </div>
    </section>
  );
}
