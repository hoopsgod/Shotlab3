import ShotLabIcon from "./ShotLabIcon";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage";
import "./SecondaryPageSystem.css";
import "./Phase2PremiumActionLayer.css";
import "./Phase3CoachLeaderboardHierarchy.css";
import "../styles/Phase2PremiumRosterLayer.css";
import "./TeamIdentityTitleStage.css";

const ICONS = [
  [/player|roster/, "team"],
  [/event|schedule|calendar/, "calendar"],
  [/strength|lifting|conditioning/, "strength"],
  [/activity|signal|feed/, "activity"],
  [/career|profile/, "profile"],
  [/leader|rank/, "trophy"],
  [/store/, "store"],
  [/progress|analytic/, "chart"],
  [/program|brand|identity/, "program"],
  [/account|setting/, "settings"],
  [/coach|assignment/, "coach"],
  [/training|drill/, "training"],
];

const iconFor = (value) => ICONS.find(([pattern]) => pattern.test(String(value).toLowerCase()))?.[1] || "target";

export function SecondaryPageShell({ children, testId, className = "" }) {
  return <section className={["secondaryPageShell", className].filter(Boolean).join(" ")} data-testid={testId} data-page-hierarchy="editorial" data-surface="light" data-visual-role="secondary-page">{children}</section>;
}

export function SecondaryPageIntro({ eyebrow, title, summary, status, actions = [], testId, icon, variant = "standard", role }) {
  const iconName = icon || iconFor(`${eyebrow} ${title}`);
  return (
    <TeamIdentityTitleStage
      variant={variant}
      surface="light"
      role={role}
      eyebrow={eyebrow}
      title={title}
      summary={summary}
      status={status}
      actions={actions}
      testId={testId}
      iconName={iconName}
      className="secondaryPageIntro appHeader"
      dataLayoutRole="editorial-header"
      dataVisualRole="page-intro"
      dataPageKind={iconName}
      dataMobileStage="team-identity"
    />
  );
}

export function SecondaryPageToolbar({ children, testId, label = "Page tools" }) {
  return <section className="secondaryPageToolbar" data-testid={testId} data-layout-role="evidence-tools" data-surface="light" data-visual-role="page-tools" aria-label={label}>{children}</section>;
}

export function SecondaryPageDecision({ eyebrow, title, detail, tone = "neutral", action, children, testId, icon }) {
  const iconName = icon || iconFor(`${eyebrow} ${title}`);
  return <section className="secondaryPageDecision" data-tone={tone} data-testid={testId} data-layout-role="primary-decision" data-surface="dark" data-visual-role="primary-decision" data-page-kind={iconName} data-mobile-stage="performance"><span className="secondaryPageDecision__icon" aria-hidden="true"><ShotLabIcon name={iconName} size={23}/></span><div className="secondaryPageDecision__copy">{eyebrow?<div className="secondaryPageDecision__eyebrow">{eyebrow}</div>:null}<h2>{title}</h2>{detail?<p>{detail}</p>:null}{action?<button type="button" onClick={action.onClick} disabled={action.disabled}><span>{action.label}</span><ShotLabIcon name="arrow" size={16}/></button>:null}</div>{children?<div className="secondaryPageDecision__visual">{children}</div>:null}</section>;
}

export function SecondaryPageEvidence({ children, testId, label = "Supporting evidence" }) {
  return <section className="secondaryPageEvidence" data-testid={testId} data-layout-role="supporting-evidence" data-surface="light" data-visual-role="supporting-evidence" aria-label={label}>{children}</section>;
}
