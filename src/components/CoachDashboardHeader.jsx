import styles from "./CoachDashboardHeader.module.css";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {

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
    </section>
  );
}
