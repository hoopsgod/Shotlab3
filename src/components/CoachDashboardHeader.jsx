import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachDashboardHeader.module.css";

const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4v-4h.1A1.7 1.7 0 0 0 4.2 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.66 3.8l.06.06A1.7 1.7 0 0 0 8.6 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.4h4v.1a1.7 1.7 0 0 0 1 1.7 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.6a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7 1Z" />
  </svg>
);

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Coach").trim();

  return (
    <section ref={heroRef} className={styles.header} data-testid="coach-dashboard-identity-header">
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.modeRow}>
            <span className={styles.badge}>Coach Mode</span>
            <span className={styles.teamName}>{teamName}</span>
          </div>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.tagline}>Lead. Develop. Dominate.</p>
          <button type="button" onClick={onOpenTeamBranding} className={styles.brandBtn}>
            <SettingsIcon />
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
