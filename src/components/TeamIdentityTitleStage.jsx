import { useEffect, useMemo, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import useCleanTeamLogo from "./useCleanTeamLogo";
import "./TeamIdentityTitleStage.css";
import "./TeamIdentityBrandHierarchy.css";

const tidy = (value, fallback = "") => String(value ?? fallback).trim();
const BRAND_TREATMENTS = new Set(["hero", "compact", "signature", "watermark", "none"]);
const AUTO_BRAND_TREATMENT_BY_PAGE_KIND = Object.freeze({
  events: "compact",
  schedule: "compact",
  calendar: "compact",
  program: "compact",
  strength: "watermark",
  lifting: "watermark",
  conditioning: "watermark",
  leaderboards: "none",
  rankings: "none",
  trophy: "none",
  players: "signature",
  roster: "signature",
  team: "signature",
  training: "signature",
  drills: "signature",
  progress: "signature",
  profile: "signature",
});
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
  const teamName = tidy(branding?.teamName || branding?.name, "ShotLab Team");
  const rawLogo = tidy(branding?.logoUrl || branding?.logoMarkUrl);
  const cleanedLogo = useCleanTeamLogo(rawLogo);
  const [logoFailed, setLogoFailed] = useState(false);
  const displayTitle = tidy(title, personName || "ShotLab");
  const displayPerson = tidy(personName);
  const descriptor = tidy(eyebrow || role, "Team");
  const titleWords = displayTitle.split(/\s+/).filter(Boolean);
  const singleWordTitle = titleWords.length === 1;
  const longestWordLength = titleWords.reduce((max, word) => Math.max(max, word.length), 0);
  const longSingleWord = singleWordTitle && longestWordLength >= 11;
  const longTitle = displayTitle.length > 22 || longestWordLength > 12;
  const heroClass = variant === "hero" || variant === "identity" ? "teamIdentityTitleStage--hero" : "teamIdentityTitleStage--standard";
  const surfaceClass = surface === "dark" ? "teamIdentityTitleStage--dark" : "teamIdentityTitleStage--light";
  const titleFamily = heroClass === "teamIdentityTitleStage--hero" ? "identity" : "editorial";
  const requestedMobileStage = tidy(dataMobileStage);
  const resolvedMobileStage = titleFamily === "editorial" && requestedMobileStage === "team-identity"
    ? "editorial"
    : requestedMobileStage || (titleFamily === "identity" ? "team-identity" : "editorial");
  const requestedBrandTreatment = tidy(brandTreatment, "auto").toLowerCase();
  const normalizedPageKind = tidy(dataPageKind, "team").toLowerCase();
  const automaticEditorialTreatment = AUTO_BRAND_TREATMENT_BY_PAGE_KIND[normalizedPageKind] || "signature";
  const resolvedBrandTreatment = requestedBrandTreatment === "auto"
    ? (titleFamily === "identity" ? "hero" : automaticEditorialTreatment)
    : (BRAND_TREATMENTS.has(requestedBrandTreatment) ? requestedBrandTreatment : automaticEditorialTreatment);
  const fallbackInitials = useMemo(() => initialsFor(teamName), [teamName]);
  const brandingAction = Array.isArray(actions) ? actions.find((action) => action?.key === "branding") : null;
  const isCoachStage = /coach/i.test(`${role} ${eyebrow} ${dataVisualRole} ${className} ${testId || ""}`);
  const showLogoSetupPrompt = resolvedBrandTreatment === "hero" && isCoachStage && (!cleanedLogo || logoFailed);
  const hasUsableLogo = Boolean(cleanedLogo && !logoFailed);
  const openBrandingSettings = () => {
    if (brandingAction?.onClick) {
      brandingAction.onClick();
      return;
    }

    const directBrandingDestination = document.querySelector('[data-nav-key="branding"]');
    if (directBrandingDestination instanceof HTMLElement) {
      directBrandingDestination.click();
      return;
    }

    const mobileMore = document.querySelector('[data-testid="mobile-navigation-more"]');
    if (mobileMore instanceof HTMLElement) {
      mobileMore.click();
      window.setTimeout(() => {
        const brandingDestination = document.querySelector('[data-nav-key="branding"]');
        if (brandingDestination instanceof HTMLElement) brandingDestination.click();
      }, 0);
      return;
    }

    document.querySelector('[data-testid="coach-dashboard-identity-header"] button')?.click();
  };

  useEffect(() => setLogoFailed(false), [cleanedLogo]);

  // Every authenticated destination keeps the coach-configured team logo visibly present.
  // Treatment still controls hierarchy: editorial pages use a supporting mark, watermark
  // pages may add tonal depth behind it, and Home keeps the full hero crest.
  const supportingBrand = resolvedBrandTreatment !== "hero" ? (
    <span className="teamIdentityTitleStage__microBrand" data-identity-role="brand-panel" aria-label={`${teamName} identity`}>
      {hasUsableLogo ? (
        <img
          className="teamIdentityTitleStage__microBrandImage"
          data-identity-role="brand-mark"
          src={cleanedLogo}
          alt=""
          aria-hidden="true"
          draggable="false"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="teamIdentityTitleStage__microBrandFallback" aria-hidden="true">{fallbackInitials}</span>
      )}
    </span>
  ) : null;

  const watermarkBrand = resolvedBrandTreatment === "watermark" ? (
    hasUsableLogo ? (
      <img
        className="teamIdentityTitleStage__watermarkBrand"
        data-identity-role="brand-watermark"
        src={cleanedLogo}
        alt=""
        aria-hidden="true"
        draggable="false"
        onError={() => setLogoFailed(true)}
      />
    ) : (
      <span className="teamIdentityTitleStage__watermarkFallback" data-identity-role="brand-watermark" aria-hidden="true">{fallbackInitials}</span>
    )
  ) : null;

  const heroBrand = resolvedBrandTreatment === "hero" ? (
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
      ) : showLogoSetupPrompt ? (
        <button
          type="button"
          className="teamIdentityTitleStage__logoSetup"
          data-identity-role="brand-setup"
          onClick={openBrandingSettings}
          aria-label="Add your custom team logo in Program Branding"
        >
          Click here to add your custom team logo
        </button>
      ) : (
        <span className="teamIdentityTitleStage__fallbackCrest" data-identity-role="brand-fallback" aria-label={`${teamName} initials`}>{fallbackInitials}</span>
      )}
    </div>
  ) : null;

  return (
    <header
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
      data-variant={titleFamily === "identity" ? "hero" : "standard"}
      data-title-stage-family={titleFamily}
      data-brand-treatment={resolvedBrandTreatment}
      data-title-size={titleSize}
      data-title-word-count={titleWords.length}
      data-surface={surface === "dark" ? "dark" : "light"}
      data-layout-role={dataLayoutRole}
      data-visual-role={dataVisualRole}
      data-page-kind={dataPageKind}
      data-mobile-stage={resolvedMobileStage}
      aria-label={ariaLabel || `${teamName} ${displayTitle}`}
    >
      {resolvedBrandTreatment === "hero" ? <div className="teamIdentityTitleStage__tonalCrest" aria-hidden="true">{fallbackInitials}</div> : null}
      {watermarkBrand}
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
            {supportingBrand}
            {resolvedBrandTreatment === "signature" ? <span className="teamIdentityTitleStage__signatureRule" aria-hidden="true" /> : null}
            <span className="teamIdentityTitleStage__team" data-identity-role="team-name">{teamName}</span>
            <span className="teamIdentityTitleStage__descriptor" data-identity-role="role">{descriptor}</span>
          </div>
          <h1 className="teamIdentityTitleStage__title" data-identity-role="page-title">{displayTitle}</h1>
          {displayPerson && displayPerson !== displayTitle ? <div className="teamIdentityTitleStage__person" data-identity-role="person-name">{displayPerson}</div> : null}
          {summary ? <p className="teamIdentityTitleStage__summary">{summary}</p> : null}
          <TeamIdentitySupportRail status={status} actions={actions} />
        </div>
        {heroBrand}
      </div>
    </header>
  );
}
