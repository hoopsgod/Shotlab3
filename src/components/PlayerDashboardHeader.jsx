import styles from "./CoachDashboardHeader.module.css";

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
  wordmark,
  onOpenProfile,
  profileInitial = "?",
  actions,
}) {
  return (
    <section className={`${styles.header} ${styles.playerHeader}`} data-dashboard-header="player-premium">
      <div className={`${styles.inner} ${styles.playerInner}`}>
        <div className={styles.identityRow}>
          <button type="button" aria-label="Open profile" onClick={onOpenProfile} className={styles.avatarButton}>
            {profileInitial}
          </button>
          <div className={styles.identity}>
            <span className={styles.badge}>Player Mode</span>
            <h1 className={styles.name}>{(userName || "Demo Player").toUpperCase()}</h1>
            <p className={styles.tagline}>{subtitle}</p>
            <div className={styles.meta}><span className={styles.dot} aria-hidden="true" />{mission}</div>
          </div>
        </div>
        <div className={styles.playerActions}>
          <div className={styles.wordmarkPanel}>{wordmark}</div>
          <div className={styles.iconActions}>{actions}</div>
        </div>
      </div>
    </section>
  );
}
