import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import useCleanTeamLogo from "./useCleanTeamLogo";
import "./TeamIdentityTitleStage.css";
import "./TeamIdentityBrandHierarchy.css";

const tidy = (value, fallback = "") => String(value ?? fallback).trim();
const BRAND_TREATMENTS = new Set(["hero", "compact"]);
const initialsFor = (value) => {
  const parts = tidy(value, "ShotLab Team").split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 2) || "SL").toUpperCase();
};

export function TeamIdentitySupportRail({ status = null, actions = [], external = false, className = "", ariaLabel = "Page status and actions" }) {
  const actionItems = Array.isArray(actions) ? actions.filter(Boolean) : [];
  if (!status && !actionItems.length) return null;

  return (
    <div
      className={[
        "teamIdentityTitleStage__support",
        external ? "teamIdentityTitleStage__support--external" : "",
        className,
      ].filter(Boolean).join(" ")}
      data-identity-role={external ? "operational-rail" : "title-support"}
      aria-label={external ? ariaLabel : undefined}
    >
      {status ? <div className="teamIdentityTitleStage__status" aria-live="polite">{status}</div> : null}
      {actionItems.length ? <div className="teamIdentityTitleStage__actions">{actionItems.map((action, index) => (
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
  );
}

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
  backAction = null,
  titleSize = "auto",
  brandTreatment = "auto",
  testId,
  className = "",
  ariaLabel,
  dataLayoutRole = "editorial-header",
  dataVisualRole = "team-identity-title",
  dataPageKind = "team",
  dataMobileStage = "",
}) {
  const { branding } = useTeamBranding();
  const stageRef = useRef(null);
  const teamName = tidy(branding?.teamName || branding?.name, "ShotLab Team");
  const cleanedLogo = useCleanTeamLogo(tidy(branding?.logoUrl || branding?.logoMarkUrl));
  const [logoFailed, setLogoFailed] = useState(false);
  const displayTitle = tidy(title, personName || "ShotLab");
  const displayPerson = tidy(personName);
  const descriptor = tidy(eyebrow || role, "Team");
  const titleWords = displayTitle.split(/\s+/).filter(Boolean);
  const singleWordTitle = titleWords.length === 1;
  const longestWordLength = titleWords.reduce((max, word) => Math.max(max, word.length), 0);
  const longSingleWord = singleWordTitle && longestWordLength >= 11;
  const longTitle = displayTitle.length > 22 || longestWordLength > 12;
  const isHero = variant === "hero" || variant === "identity";
  const isDark = surface === "dark";
  const heroClass = isHero ? "teamIdentityTitleStage--hero" : "teamIdentityTitleStage--standard";
  const surfaceClass = isDark ? "teamIdentityTitleStage--dark" : "teamIdentityTitleStage--light";
  const titleFamily = isHero ? "identity" : "editorial";
  const requestedMobileStage = tidy(dataMobileStage);
  const resolvedMobileStage = titleFamily === "editorial" && requestedMobileStage === "team-identity"
    ? "editorial"
    : requestedMobileStage || (isHero ? "team-identity" : "editorial");
  const requestedBrandTreatment = tidy(brandTreatment, "auto").toLowerCase();
  const fallbackBrandTreatment = titleFamily === "identity" ? "hero" : "compact";
  const resolvedBrandTreatment = requestedBrandTreatment === "auto"
    ? fallbackBrandTreatment
    : (BRAND_TREATMENTS.has(requestedBrandTreatment) ? requestedBrandTreatment : fallbackBrandTreatment);
  const fallbackInitials = useMemo(() => initialsFor(teamName), [teamName]);
  const brandingAction = Array.isArray(actions) ? actions.find((action) => action?.key === "branding") : null;
  const isCoachStage = /coach/i.test(`${role} ${eyebrow} ${dataVisualRole} ${className} ${testId || ""}`);
  const showLogoSetupAction = isCoachStage && (!cleanedLogo || logoFailed);
  const hasUsableLogo = Boolean(cleanedLogo && !logoFailed);
  const openBrandingSettings = () => {
    if (brandingAction?.onClick) {
      brandingAction.onClick();
      return;
    }
    const destination = document.querySelector('[data-nav-key="branding"]');
    if (destination instanceof HTMLElement) {
      destination.click();
      return;
    }
    const more = document.querySelector('[data-testid="mobile-navigation-more"]');
    if (more instanceof HTMLElement) {
      more.click();
      setTimeout(() => {
        const brandingDestination = document.querySelector('[data-nav-key="branding"]');
        if (brandingDestination instanceof HTMLElement) brandingDestination.click();
      }, 0);
      return;
    }
    document.querySelector('[data-testid="coach-dashboard-identity-header"] button')?.click();
  };

  useEffect(() => setLogoFailed(false), [cleanedLogo]);

  useLayoutEffect(() => {
    if (titleFamily !== "editorial" || innerWidth > 767) return;
    stageRef.current?.closest(".player-scroll-container,.coach-scroll-container,.content-wrap")?.scrollTo(0, 0);
    document.scrollingElement?.scrollTo(0, 0);
  }, [displayTitle, titleFamily]);

  const fullCrestBrand = (
    <div className="teamIdentityTitleStage__crestSlot" data-identity-role="brand-panel" aria-label={`${teamName} identity`}>
      {hasUsableLogo ? (
        <img
          className="teamIdentityTitleStage__crest"
          data-identity-role="brand-mark"
          src={cleanedLogo}
          alt={`${teamName} logo`}
          draggable="false"
          onError={() => setLogoFailed(true)}
        />
      ) : showLogoSetupAction ? (
        <button
          type="button"
          className="teamIdentityTitleStage__fallbackCrest teamIdentityTitleStage__fallbackAction"
          data-identity-role="brand-fallback"
          data-team-logo-fallback={fallbackInitials}
          onClick={openBrandingSettings}
          aria-label={`Add a logo for ${teamName} in Program Branding`}
        >
          <strong className="teamIdentityTitleStage__fallbackActionMark">{fallbackInitials}</strong>
          <span className="teamIdentityTitleStage__fallbackActionLabel">Add logo</span>
        </button>
      ) : (
        <span className="teamIdentityTitleStage__fallbackCrest" data-identity-role="brand-fallback" aria-label={`${teamName} initials`}>{fallbackInitials}</span>
      )}
    </div>
  );

  return (
    <header
      ref={stageRef}
      className={[
        "teamIdentityTitleStage",
        heroClass,
        surfaceClass,
        longTitle ? "teamIdentityTitleStage--longTitle" : "",
        singleWordTitle ? "teamIdentityTitleStage--singleWord" : "teamIdentityTitleStage--multiWord",
        longSingleWord ? "teamIdentityTitleStage--longSingleWord" : "",
        titleSize !== "auto" ? `teamIdentityTitleStage--title-${titleSize}` : "",
        className,
      ].filter(Boolean).join(" ")}
      data-testid={testId}
      data-team-identity-stage="true"
      data-variant={isHero ? "hero" : "standard"}
      data-title-stage-family={titleFamily}
      data-brand-treatment={resolvedBrandTreatment}
      data-title-size={titleSize}
      data-title-word-count={titleWords.length}
      data-surface={isDark ? "dark" : "light"}
      data-layout-role={dataLayoutRole}
      data-visual-role={dataVisualRole}
      data-page-kind={dataPageKind}
      data-mobile-stage={resolvedMobileStage}
      aria-label={ariaLabel || `${teamName} ${displayTitle}`}
    >
      {resolvedBrandTreatment === "hero" ? <div className="teamIdentityTitleStage__tonalCrest" aria-hidden="true">{fallbackInitials}</div> : null}
      {backAction?.onClick ? (
        <nav className="teamIdentityTitleStage__navigation" aria-label={backAction.ariaLabel || "Back navigation"}>
          <button
            type="button"
            className="teamIdentityTitleStage__back"
            onClick={backAction.onClick}
            aria-label={backAction.ariaLabel || backAction.label || "Back"}
          >
            <span aria-hidden="true" className="teamIdentityTitleStage__backIcon">←</span>
            <span>{backAction.label || "Back"}</span>
          </button>
        </nav>
      ) : null}
      <div className="teamIdentityTitleStage__inner">
        <div className="teamIdentityTitleStage__copy">
          <div className="teamIdentityTitleStage__identityLine">
            <span className="teamIdentityTitleStage__team" data-identity-role="team-name">{teamName}</span>
            <span className="teamIdentityTitleStage__descriptor" data-identity-role="role">{descriptor}</span>
          </div>
          <h1 className="teamIdentityTitleStage__title" data-identity-role="page-title">{displayTitle}</h1>
          {displayPerson && displayPerson !== displayTitle ? <div className="teamIdentityTitleStage__person" data-identity-role="person-name">{displayPerson}</div> : null}
          {summary ? <p className="teamIdentityTitleStage__summary">{summary}</p> : null}
          <TeamIdentitySupportRail status={status} actions={actions} />
        </div>
        {fullCrestBrand}
      </div>
    </header>
  );
}