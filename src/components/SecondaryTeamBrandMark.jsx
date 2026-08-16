import { useEffect, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import useCleanTeamLogo from "./useCleanTeamLogo";
import styles from "./SecondaryTeamBrandMark.module.css";

export default function SecondaryTeamBrandMark({ iconName = "target", variant = "route", className = "" }) {
  const { branding } = useTeamBranding();
  const rawLogo = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const logoSrc = useCleanTeamLogo(rawLogo);
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoSrc]);

  const classes = [styles.mark, styles[variant], className].filter(Boolean).join(" ");

  return (
    <span className={classes} data-secondary-team-brand="true" data-brand-variant={variant}>
      {logoSrc && !failed ? (
        <img
          className={styles.logo}
          src={logoSrc}
          alt={`${teamName} logo`}
          onError={() => setFailed(true)}
          draggable="false"
        />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          <ShotLabIcon name={iconName} size={22} />
        </span>
      )}
    </span>
  );
}
