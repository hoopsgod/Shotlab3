import { useEffect, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import useCleanTeamLogo from "./useCleanTeamLogo";

const markStyle = { position: "relative", display: "grid", placeItems: "center", minWidth: 0, width: "100%", height: "100%", overflow: "visible" };
const logoStyle = { display: "block", width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", transform: "scale(1.45)", filter: "drop-shadow(0 11px 17px rgba(7,26,34,.2))", userSelect: "none" };

export default function SecondaryTeamBrandMark({ iconName = "target", variant = "route", className = "" }) {
  const { branding } = useTeamBranding();
  const rawLogo = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const logoSrc = useCleanTeamLogo(rawLogo);
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoSrc]);

  return (
    <span className={className} style={markStyle} data-secondary-team-brand="true" data-brand-variant={variant}>
      {logoSrc && !failed ? (
        <img style={logoStyle} src={logoSrc} alt={`${teamName} logo`} onError={() => setFailed(true)} draggable="false" />
      ) : (
        <ShotLabIcon name={iconName} size={22} />
      )}
    </span>
  );
}
