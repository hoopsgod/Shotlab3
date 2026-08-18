import { useEffect, useMemo, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import useCleanTeamLogo from "./useCleanTeamLogo";

const markStyle = { position: "relative", display: "grid", placeItems: "center", minWidth: 0, width: "100%", height: "100%", overflow: "visible" };
const logoStyle = { display: "block", width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", transform: "scale(1.45)", filter: "drop-shadow(0 11px 17px rgba(7,26,34,.2))", userSelect: "none" };
const fallbackStyle = { display: "grid", placeItems: "center", alignContent: "center", gap: 2, width: "100%", height: "100%", color: "currentColor", font: "800 14px/1 system-ui, sans-serif", letterSpacing: "-.04em" };

const initialsFor = (value) => {
  const words = String(value || "Team").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "TM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase();
};

export default function SecondaryTeamBrandMark({ iconName = "target", variant = "route", className = "" }) {
  const { branding, hasCustomLogo = false } = useTeamBranding();
  const rawLogo = hasCustomLogo ? (branding?.logoUrl || branding?.logoMarkUrl || "") : "";
  const logoSrc = useCleanTeamLogo(rawLogo);
  const teamName = branding?.teamName || branding?.name || "Your Team";
  const initials = useMemo(() => initialsFor(teamName), [teamName]);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoSrc]);

  return (
    <span className={className} style={markStyle} data-secondary-team-brand="true" data-brand-variant={variant}>
      {logoSrc && !failed ? (
        <img style={logoStyle} src={logoSrc} alt={`${teamName} team crest`} onError={() => setFailed(true)} draggable="false" />
      ) : (
        <span style={fallbackStyle} aria-label={`${teamName} team identity`}>
          <span>{initials}</span>
          <ShotLabIcon name={iconName} size={18} />
        </span>
      )}
    </span>
  );
}