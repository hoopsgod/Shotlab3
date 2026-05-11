import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachDashboardHeader.module.css";

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding, onLogout }) {
  const { branding } = useTeamBranding();
  const defaultFullLogo = "/branding/titans-exact-logo.png.PNG";
  const logoUrl = typeof branding?.logoUrl === "string" ? branding.logoUrl.trim() : "";
  const isDefaultFullLogo = logoUrl === defaultFullLogo;
  const logoSrc = (!isDefaultFullLogo && logoUrl) || branding?.logoMarkUrl || "/branding/titans-default-mark-free.svg";

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

        <div className={styles.logoArea}>
          <img className={styles.logo} src={logoSrc} alt={`${branding?.teamName || "Team"} logo`} />
          <button type="button" onClick={onLogout} aria-label="Log out" className={styles.closeBtn}>✕</button>
        </div>
      </div>
    </section>
  );
}
