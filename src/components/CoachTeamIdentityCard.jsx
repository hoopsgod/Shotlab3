import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachTeamIdentityCard.module.css";

export default function CoachTeamIdentityCard({ onOpenTeamBranding }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || "Titans Program";

  return (
    <section className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.label}>Team Brand</span>
        <button type="button" className={styles.action} onClick={onOpenTeamBranding}>Team Branding Settings</button>
      </div>
      <div className={styles.body}>
        <img className={styles.logo} src={logoSrc} alt={`${teamName} logo`} />
        <div className={styles.teamName}>{teamName}</div>
      </div>
    </section>
  );
}
