import { useEffect, useMemo, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import useCleanTeamLogo from "./useCleanTeamLogo";
import ShotLabIcon from "./ShotLabIcon";
import "./TeamIdentityTitleStage.css";
import "./CoachHomeIdentityReconciliation.css";

const tidy = (value) => String(value || "").trim();

function buildInitials(value) {
  const words = tidy(value).split(/\s+/).filter(Boolean);
  if (!words.length) return "SL";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase();
}

export default function TeamIdentityTitleStage({
  variant = "standard",
  surface = "light",
  role,
  eyebrow,
  title,
  personName,
  summary,
  status,
  actions = [],
  testId,
  iconName = "program",
  className = "",
  ariaLabel,
  logoAlt,
  dataLayoutRole,
  dataVisualRole,
  dataPageKind,
  dataMobileStage,
}) {
  const { branding, hasCustomLogo = false } = useTeamBranding();
  const teamName = tidy(branding?.teamName || branding?.name || "Your Team");
  const rawLogo = hasCustomLogo ? (branding?.logoUrl || branding?.logoMarkUrl || "") : "";
  const logoSrc = useCleanTeamLogo(rawLogo);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoSrc]);

  const descriptor = tidy(role || eyebrow);
  const initials = useMemo(() => buildInitials(teamName), [teamName]);
  const titleText = tidy(title) || teamName;
  const hasWideWord = titleText.split(/\s+/).some((word) => word.length >= 11);
  const isLongTitle = titleText.length > 20 || hasWideWord;
  const hasLogo = Boolean(logoSrc && !failed);
  const actionItems = Array.isArray(actions) ? actions.filter(Boolean) : [];
  const variantClass = variant === "hero" ? "teamIdentityTitleStage--hero" : "teamIdentityTitleStage--standard";
  const surfaceClass = surface === "dark" ? "teamIdentityTitleStage--dark" : "teamIdentityTitleStage--light";
  const titleTextStyle = surface === "dark"
    ? { color: "#f8fbfc", WebkitTextFillColor: "#f8fbfc", overflowWrap: "normal", wordBreak: "normal" }
    : { overflowWrap: "normal", wordBreak: "normal" };

  return (
    <header
      className={[
        "teamIdentityTitleStage",
        variantClass,
        surfaceClass,
        isLongTitle ? "teamIdentityTitleStage--longTitle" : "",
        className,
      ].filter(Boolean).join(" ")}
      data-testid={testId}
      data-team-identity-stage="true"
      data-variant={variant}
      data-surface={surface}
      data-layout-role={dataLayoutRole}
      data-visual-role={dataVisualRole}
      data-page-kind={dataPageKind}
      data-mobile-stage={dataMobileStage}
      aria-label={ariaLabel}
    >
      {hasLogo ? (
        <img className="teamIdentityTitleStage__tonalCrest" src={logoSrc} alt="" aria-hidden="true" draggable="false" />
      ) : (
        <span className="teamIdentityTitleStage__tonalFallback" aria-hidden="true">{initials}</span>
      )}

      <div className="teamIdentityTitleStage__inner" data-identity-role="inner">
        <div className="teamIdentityTitleStage__copy secondaryPageIntro__copy" data-identity-role="identity">
          <div className="teamIdentityTitleStage__identityLine secondaryPageIntro__eyebrow" data-identity-role="mode-row">
            <span className="teamIdentityTitleStage__teamName" data-identity-role="team-name">{teamName}</span>
            {descriptor ? <><span className="teamIdentityTitleStage__separator" aria-hidden="true">·</span><span className="teamIdentityTitleStage__descriptor" data-identity-role="badge">{descriptor}</span></> : null}
          </div>

          <h1 className="teamIdentityTitleStage__title secondaryPageIntro__title appHeaderTitle" data-identity-role={role === "Player" && variant === "hero" && !personName ? "name" : "page-title"}><span data-identity-role="title-text" style={titleTextStyle}>{titleText}</span></h1>
          {personName ? <div className="teamIdentityTitleStage__person" data-identity-role="name">{personName}</div> : null}
          {summary ? <p className="teamIdentityTitleStage__summary secondaryPageIntro__summary" data-identity-role="tagline">{summary}</p> : null}

          {(status || actionItems.length) ? (
            <div className="teamIdentityTitleStage__support secondaryPageIntro__actions">
              {status ? <div className="teamIdentityTitleStage__status secondaryPageIntro__status" aria-live="polite">{status}</div> : null}
              {actionItems.length ? (
                <div className="teamIdentityTitleStage__actions secondaryPageIntro__buttonRow">
                  {actionItems.map((action, index) => {
                    const key = action.key || action.label || index;
                    const brandingAction = /brand/i.test(String(key));
                    return (
                      <button
                        key={key}
                        type="button"
                        className={["teamIdentityTitleStage__action", "secondaryPageAction", index ? "secondaryPageAction--secondary" : "secondaryPageAction--primary", action.className].filter(Boolean).join(" ")}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        aria-label={action.ariaLabel || action.label}
                        data-identity-role={brandingAction ? "brand-button" : undefined}
                      >
                        {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
                        <span>{action.label}</span>
                        {!action.icon && index === 0 ? <ShotLabIcon name="arrow" size={15} /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="teamIdentityTitleStage__crestSlot" data-identity-role="brand-panel">
          {hasLogo ? (
            <img
              className="teamIdentityTitleStage__crest"
              data-identity-role="brand-mark"
              src={logoSrc}
              alt={logoAlt || `${teamName} team crest`}
              onError={() => setFailed(true)}
              draggable="false"
            />
          ) : (
            <span className="teamIdentityTitleStage__fallbackCrest" aria-label={`${teamName} team identity`}>
              <span>{initials}</span>
              <ShotLabIcon name={iconName} size={18} />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
