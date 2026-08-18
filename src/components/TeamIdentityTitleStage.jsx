import { useEffect, useMemo, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import useCleanTeamLogo from "./useCleanTeamLogo";
import "./TeamIdentityTitleStage.css";

const DEFAULT_TITANS_LOGOS = [
  "/branding/titans-exact-logo.png.PNG",
  "/branding/titans-default-mark.svg",
];

const tidy = (value, fallback = "") => String(value ?? fallback).trim();
const initialsFor = (value) => {
  const parts = tidy(value, "ShotLab Team").split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 2) || "SL").toUpperCase();
};
const isDefaultTitansLogo = (url = "") => DEFAULT_TITANS_LOGOS.some((candidate) => String(url).includes(candidate));

export default function TeamIdentityTitleStage({
  variant = "standard",
  surface = "light",
  role = "Team",
  eyebrow = "",
  title,
  personName = "",
  summary = "",
  status = null,
  actions = [],
  testId,
  className = "",
  ariaLabel,
  dataLayoutRole = "editorial-header",
  dataVisualRole = "team-identity-title",
  dataPageKind = "team",
  dataMobileStage = "team-identity",
}) {
  const { branding } = useTeamBranding();
  const teamName = tidy(branding?.teamName || branding?.name, "ShotLab Team");
  const rawLogo = tidy(branding?.logoUrl || branding?.logoMarkUrl);
  const teamOwnsDefaultTitansIdentity = /titans/i.test(teamName);
  const logoCandidate = rawLogo && (!isDefaultTitansLogo(rawLogo) || teamOwnsDefaultTitansIdentity) ? rawLogo : "";
  const cleanedLogo = useCleanTeamLogo(logoCandidate);
  const [logoFailed, setLogoFailed] = useState(false);
  const displayTitle = tidy(title, personName || "ShotLab");
  const displayPerson = tidy(personName);
  const descriptor = tidy(eyebrow || role, "Team");
  const longTitle = displayTitle.length > 22 || displayTitle.split(/\s+/).some((word) => word.length > 12);
  const heroClass = variant === "hero" ? "teamIdentityTitleStage--hero" : "teamIdentityTitleStage--standard";
  const surfaceClass = surface === "dark" ? "teamIdentityTitleStage--dark" : "teamIdentityTitleStage--light";
  const fallbackInitials = useMemo(() => initialsFor(teamName), [teamName]);

  useEffect(() => setLogoFailed(false), [cleanedLogo]);

  return (
    <header
      className={["teamIdentityTitleStage", heroClass, surfaceClass, longTitle ? "teamIdentityTitleStage--longTitle" : "", className].filter(Boolean).join(" ")}
      data-testid={testId}
      data-team-identity-stage="true"
      data-variant={variant === "hero" ? "hero" : "standard"}
      data-surface={surface === "dark" ? "dark" : "light"}
      data-layout-role={dataLayoutRole}
      data-visual-role={dataVisualRole}
      data-page-kind={dataPageKind}
      data-mobile-stage={dataMobileStage}
      aria-label={ariaLabel || `${teamName} ${displayTitle}`}
    >
      <div className="teamIdentityTitleStage__tonalCrest" aria-hidden="true">{fallbackInitials}</div>
      <div className="teamIdentityTitleStage__inner">
        <div className="teamIdentityTitleStage__copy">
          <div className="teamIdentityTitleStage__identityLine">
            <span className="teamIdentityTitleStage__team" data-identity-role="team-name">{teamName}</span>
            <span className="teamIdentityTitleStage__descriptor" data-identity-role="role">{descriptor}</span>
          </div>
          <h1 className="teamIdentityTitleStage__title" data-identity-role="page-title">{displayTitle}</h1>
          {displayPerson && displayPerson !== displayTitle ? <div className="teamIdentityTitleStage__person" data-identity-role="person-name">{displayPerson}</div> : null}
          {summary ? <p className="teamIdentityTitleStage__summary">{summary}</p> : null}
          {status || actions.length ? (
            <div className="teamIdentityTitleStage__support">
              {status ? <div className="teamIdentityTitleStage__status" aria-live="polite">{status}</div> : null}
              {actions.length ? <div className="teamIdentityTitleStage__actions">{actions.map((action, index) => (
                <button
                  key={action.key || action.label}
                  type="button"
                  className={index === 0 ? "teamIdentityTitleStage__action teamIdentityTitleStage__action--primary" : "teamIdentityTitleStage__action"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  aria-label={action.ariaLabel || action.label}
                >{action.label}</button>
              ))}</div> : null}
            </div>
          ) : null}
        </div>
        <div className="teamIdentityTitleStage__crestSlot" data-identity-role="brand-panel" aria-label={`${teamName} identity`}>
          {cleanedLogo && !logoFailed ? (
            <img
              className="teamIdentityTitleStage__crest"
              data-identity-role="brand-mark"
              src={cleanedLogo}
              alt={`${teamName} logo`}
              draggable="false"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="teamIdentityTitleStage__fallbackCrest" data-identity-role="brand-fallback" aria-label={`${teamName} initials`}>{fallbackInitials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
