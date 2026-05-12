import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./CoachTeamIdentityCard.module.css";

export default function CoachTeamIdentityCard() {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || "Titans Program";

  return (
    <section className={styles.card}>
      <div className={styles.meta}>
        <span className={styles.label}>Team Brand</span>
        <div className={styles.teamName}>{teamName}</div>
      </div>
      <img className={styles.logo} src={logoSrc} alt={`${teamName} logo`} />
    </section>
  );
}
