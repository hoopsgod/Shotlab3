import { useEffect, useMemo, useState } from "react";
import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import useCleanTeamLogo from "./useCleanTeamLogo";

const TEAM_IDENTITY_STAGE_CSS = `
.teamIdentityStage{--team-stage-crest:96px;--team-stage-tonal:208px;position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:var(--team-stage-crest) minmax(0,1fr) auto;gap:18px;align-items:end;width:100%;min-width:0;padding:14px 2px 12px;border:0;border-radius:0;background:transparent;color:var(--sl-ink,#171a18)}
.teamIdentityStage::after{content:"";position:absolute;left:0;bottom:0;width:min(132px,34%);height:3px;background:var(--team-brand-primary,var(--sl-accent,#71851f));opacity:.82;pointer-events:none}
.teamIdentityStage--compact{--team-stage-crest:76px;--team-stage-tonal:166px;gap:14px;padding-block:10px}
.teamIdentityStage--hero{--team-stage-crest:112px;--team-stage-tonal:232px;gap:20px;padding:18px 2px 16px}
.teamIdentityStage--dark{padding-inline:18px;border-bottom:1px solid rgba(255,255,255,.08);background:radial-gradient(circle at 92% -18%,color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 16%,transparent),transparent 42%),linear-gradient(126deg,#061923 0%,#082430 59%,#0b2d37 100%);color:#f6f8f7}
.teamIdentityStage--dark::after{left:18px;background:var(--team-brand-primary,#c8ff1a);opacity:.9}
.teamIdentityStage__crest{position:relative;z-index:2;align-self:center;display:grid;place-items:center;width:var(--team-stage-crest);height:var(--team-stage-crest);min-width:0;overflow:visible}
.teamIdentityStage__crest img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;filter:drop-shadow(0 12px 18px rgba(7,26,34,.2));user-select:none;-webkit-user-drag:none}
.teamIdentityStage--dark .teamIdentityStage__crest img{filter:drop-shadow(0 13px 20px rgba(0,0,0,.34))}
.teamIdentityStage__fallback{display:grid;place-items:center;width:82%;height:82%;clip-path:polygon(50% 0,93% 17%,86% 74%,50% 100%,14% 74%,7% 17%);background:color-mix(in srgb,var(--team-brand-primary,#71851f) 14%,#fff);border:1px solid color-mix(in srgb,var(--team-brand-primary,#71851f) 34%,transparent);color:#172019;font:850 22px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;letter-spacing:-.035em}
.teamIdentityStage--dark .teamIdentityStage__fallback{background:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 12%,rgba(255,255,255,.04));color:#f5f8f9}
.teamIdentityStage__tonal{position:absolute;z-index:-1;top:50%;right:clamp(-72px,-12vw,-34px);width:var(--team-stage-tonal);height:var(--team-stage-tonal);transform:translateY(-54%);display:grid;place-items:center;pointer-events:none;opacity:.055;filter:grayscale(1) contrast(1.08)}
.teamIdentityStage--dark .teamIdentityStage__tonal{opacity:.085;filter:grayscale(1) brightness(1.75) contrast(.85)}
.teamIdentityStage__tonal img{width:100%;height:100%;object-fit:contain;object-position:center}
.teamIdentityStage__copy{position:relative;z-index:2;min-width:0;max-width:760px;padding-right:6px}
.teamIdentityStage__teamLine{display:block;max-width:100%;margin:0 0 6px;color:var(--team-brand-accent-text,#617900);font:830 12px/1.15 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;letter-spacing:.085em;text-transform:uppercase;overflow-wrap:anywhere}
.teamIdentityStage--dark .teamIdentityStage__teamLine{color:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 66%,#f6f8f7)}
.teamIdentityStage__eyebrow{margin:0 0 7px;color:#657068;font:760 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;letter-spacing:.075em;text-transform:uppercase}
.teamIdentityStage--dark .teamIdentityStage__eyebrow{color:#aebbc0}
.teamIdentityStage__title{max-width:18ch;margin:0;color:var(--sl-ink,#171a18);font:830 clamp(42px,11vw,54px)/.92 -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;letter-spacing:-.058em;overflow-wrap:anywhere;text-wrap:balance}
.teamIdentityStage--compact .teamIdentityStage__title{font-size:clamp(38px,10vw,48px)}
.teamIdentityStage--dark .teamIdentityStage__title{color:#f7faf9}
.teamIdentityStage__user{margin:8px 0 0;color:#303a33;font:760 14px/1.22 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;overflow-wrap:anywhere}
.teamIdentityStage--dark .teamIdentityStage__user{color:#dce5e2}
.teamIdentityStage__summary{max-width:58ch;margin:10px 0 0;color:var(--sl-muted,#68706a);font:500 14px/1.46 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;letter-spacing:-.01em}
.teamIdentityStage--dark .teamIdentityStage__summary{color:#b5c1c4}
.teamIdentityStage__aside{position:relative;z-index:3;align-self:end;display:grid;justify-items:end;gap:10px;min-width:min(100%,238px)}
.teamIdentityStage__status{max-width:30ch;color:#536057;font:680 12px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;text-align:right}
.teamIdentityStage--dark .teamIdentityStage__status{color:#bdc8cb}
.teamIdentityStage__actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.teamIdentityStage__action,.teamIdentityStage__back{min-height:46px;padding:0 15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(23,26,24,.14);border-radius:13px;background:transparent;color:var(--sl-ink,#171a18);font:740 13px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.teamIdentityStage__action:first-child{border-color:#202421;background:#202421;color:#fff}
.teamIdentityStage--dark .teamIdentityStage__action,.teamIdentityStage--dark .teamIdentityStage__back{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.055);color:#f5f8f9}
.teamIdentityStage--dark .teamIdentityStage__action:first-child{border-color:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 26%,rgba(255,255,255,.14));background:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 10%,rgba(255,255,255,.04))}
.teamIdentityStage__action:focus-visible,.teamIdentityStage__back:focus-visible{outline:3px solid color-mix(in srgb,var(--team-brand-primary,#71851f) 28%,transparent);outline-offset:3px}
.teamIdentityStage__action:active,.teamIdentityStage__back:active{transform:scale(.98)}
.teamIdentityStage__action:disabled{opacity:.5;cursor:not-allowed}
.teamIdentityStage__back{position:absolute;z-index:5;top:12px;right:12px;width:46px;padding:0;border-radius:14px}
.teamIdentityStage__back span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:760px){
 .teamIdentityStage{grid-template-columns:96px minmax(0,1fr);gap:14px;align-items:center;padding:10px 0 14px;--team-stage-crest:96px;--team-stage-tonal:204px}
 .teamIdentityStage--compact{grid-template-columns:78px minmax(0,1fr);--team-stage-crest:78px;--team-stage-tonal:168px}
 .teamIdentityStage--hero{grid-template-columns:112px minmax(0,1fr);--team-stage-crest:112px;--team-stage-tonal:230px;padding-block:14px 16px}
 .teamIdentityStage--dark{padding:max(13px,env(safe-area-inset-top)) 16px 16px;grid-template-columns:112px minmax(0,1fr)}
 .teamIdentityStage__aside{grid-column:1/-1;width:100%;min-width:0;justify-items:start;align-self:auto;padding-left:calc(var(--team-stage-crest) + 14px);margin-top:-6px}
 .teamIdentityStage__status{text-align:left}
 .teamIdentityStage__actions{justify-content:flex-start}
 .teamIdentityStage__title{max-width:100%;font-size:clamp(40px,11.4vw,50px);line-height:.94}
 .teamIdentityStage__summary{font-size:13.5px;line-height:1.42}
 .teamIdentityStage__tonal{right:-72px;top:43%}
 .teamIdentityStage__teamLine{font-size:11.5px;letter-spacing:.075em}
}
@media(max-width:389px){
 .teamIdentityStage{grid-template-columns:88px minmax(0,1fr);--team-stage-crest:88px;gap:12px}
 .teamIdentityStage--hero{grid-template-columns:104px minmax(0,1fr);--team-stage-crest:104px}
 .teamIdentityStage--compact{grid-template-columns:72px minmax(0,1fr);--team-stage-crest:72px}
 .teamIdentityStage__aside{padding-left:calc(var(--team-stage-crest) + 12px)}
 .teamIdentityStage__title{font-size:clamp(38px,11vw,46px)}
}
@media(min-width:761px){.teamIdentityStage__back{display:none}}
@media(prefers-reduced-motion:no-preference){.teamIdentityStage__crest,.teamIdentityStage__copy{animation:teamIdentityEnter 220ms ease-out both}.teamIdentityStage__copy{animation-delay:24ms}@keyframes teamIdentityEnter{from{opacity:.01;transform:translateY(5px)}to{opacity:1;transform:none}}}
`;

const initialsFor = (value) => String(value || "Team")
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join("") || "SL";

export default function TeamIdentityTitleStage({
  variant = "standard",
  surface = "light",
  role,
  eyebrow,
  title,
  userName,
  summary,
  status,
  actions = [],
  backAction,
  iconName = "target",
  showTonalCrest = true,
  testId,
  className = "",
  crestSize,
  titleAs = "h1",
}) {
  const { branding } = useTeamBranding();
  const teamName = String(branding?.teamName || branding?.name || "ShotLab Team").trim();
  const rawLogo = branding?.logoUrl || branding?.logoMarkUrl || "";
  const logoSrc = useCleanTeamLogo(rawLogo);
  const [failed, setFailed] = useState(false);
  const TitleTag = titleAs === "div" ? "div" : titleAs === "h2" ? "h2" : "h1";
  const identityLabel = useMemo(() => [teamName, role].filter(Boolean).join(" · "), [teamName, role]);

  useEffect(() => setFailed(false), [logoSrc]);

  const hasLogo = Boolean(logoSrc && !failed);
  const stageStyle = crestSize ? { "--team-stage-crest": `${crestSize}px` } : undefined;
  const stageClass = ["teamIdentityStage", `teamIdentityStage--${variant}`, surface === "dark" ? "teamIdentityStage--dark" : "", className].filter(Boolean).join(" ");

  return <>
    <style>{TEAM_IDENTITY_STAGE_CSS}</style>
    <header className={stageClass} style={stageStyle} data-testid={testId} data-team-identity-stage={variant} data-layout-role="editorial-header" data-page-kind={iconName} data-surface={surface}>
      {backAction ? <button type="button" className="teamIdentityStage__back" onClick={backAction.onClick} aria-label={backAction.ariaLabel || backAction.label || "Back"}><ShotLabIcon name="arrow" size={18}/><span>{backAction.label || "Back"}</span></button> : null}
      <div className="teamIdentityStage__crest">
        {hasLogo ? <img src={logoSrc} alt={`${teamName} team crest`} onError={() => setFailed(true)} draggable="false"/> : <div className="teamIdentityStage__fallback" role="img" aria-label={`${teamName} team mark`}>{initialsFor(teamName)}</div>}
      </div>
      {showTonalCrest && hasLogo ? <div className="teamIdentityStage__tonal" aria-hidden="true"><img src={logoSrc} alt="" draggable="false"/></div> : null}
      <div className="teamIdentityStage__copy">
        <div className="teamIdentityStage__teamLine">{identityLabel}</div>
        {eyebrow ? <div className="teamIdentityStage__eyebrow">{eyebrow}</div> : null}
        <TitleTag className="teamIdentityStage__title">{title}</TitleTag>
        {userName ? <div className="teamIdentityStage__user">{userName}</div> : null}
        {summary ? <p className="teamIdentityStage__summary">{summary}</p> : null}
      </div>
      {status || actions.length ? <div className="teamIdentityStage__aside">
        {status ? <div className="teamIdentityStage__status" aria-live="polite">{status}</div> : null}
        {actions.length ? <div className="teamIdentityStage__actions">{actions.map((action) => <button key={action.key || action.label} type="button" className="teamIdentityStage__action" onClick={action.onClick} disabled={action.disabled} aria-label={action.ariaLabel || action.label}><span>{action.label}</span>{action.icon ? <span aria-hidden="true">{action.icon}</span> : null}</button>)}</div> : null}
      </div> : null}
    </header>
  </>;
}
