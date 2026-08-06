import ShotLabIcon from "./ShotLabIcon";
import "./SecondaryPageSystem.css";

const iconFor = (value = "") => {
  const text = String(value).toLowerCase();
  if (text.includes("player") || text.includes("roster")) return "team";
  if (text.includes("event") || text.includes("schedule") || text.includes("calendar")) return "calendar";
  if (text.includes("career") || text.includes("profile")) return "profile";
  if (text.includes("leader") || text.includes("rank")) return "trophy";
  if (text.includes("store")) return "store";
  if (text.includes("progress") || text.includes("analytic")) return "chart";
  if (text.includes("coach") || text.includes("assignment")) return "coach";
  if (text.includes("training") || text.includes("drill")) return "training";
  return "target";
};

const actionClassName = (index, action) => [
  "secondaryPageAction",
  index === 0 ? "secondaryPageAction--primary" : "secondaryPageAction--secondary",
  action.className,
].filter(Boolean).join(" ");

export function SecondaryPageShell({ children, testId, className = "" }) {
  return (
    <section className={["secondaryPageShell", className].filter(Boolean).join(" ")} data-testid={testId}>
      {children}
    </section>
  );
}

export function SecondaryPageIntro({ eyebrow, title, summary, status, actions = [], testId, icon }) {
  const iconName = icon || iconFor(`${eyebrow} ${title}`);
  return (
    <header className="secondaryPageIntro appHeader" data-testid={testId}>
      <span className="secondaryPageIntro__icon" aria-hidden="true"><ShotLabIcon name={iconName} size={28} /></span>
      <div className="secondaryPageIntro__copy">
        {eyebrow ? <div className="secondaryPageIntro__eyebrow">{eyebrow}</div> : null}
        <h1 className="secondaryPageIntro__title appHeaderTitle">{title}</h1>
        {summary ? <p className="secondaryPageIntro__summary">{summary}</p> : null}
      </div>

      {(status || actions.length > 0) ? (
        <div className="secondaryPageIntro__actions">
          {status ? <div className="secondaryPageIntro__status" aria-live="polite">{status}</div> : null}
          <div className="secondaryPageIntro__buttonRow">
            {actions.map((action, index) => (
              <button key={action.key || action.label} type="button" className={actionClassName(index, action)} onClick={action.onClick} disabled={action.disabled} aria-label={action.ariaLabel || action.label}>
                <span>{action.label}</span>
                <span className="secondaryPageAction__icon" aria-hidden="true">{action.icon || <ShotLabIcon name={index === 0 ? "arrow" : "plus"} size={16} />}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SecondaryPageToolbar({ children, testId, label = "Page tools" }) {
  return <section className="secondaryPageToolbar" data-testid={testId} aria-label={label}>{children}</section>;
}

export function SecondaryPageDecision({ eyebrow, title, detail, tone = "neutral", action, children, testId, icon }) {
  const iconName = icon || iconFor(`${eyebrow} ${title}`);
  return (
    <section className="secondaryPageDecision" data-tone={tone} data-testid={testId}>
      <span className="secondaryPageDecision__icon" aria-hidden="true"><ShotLabIcon name={iconName} size={23} /></span>
      <div className="secondaryPageDecision__copy">
        {eyebrow ? <div className="secondaryPageDecision__eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
        {action ? <button type="button" onClick={action.onClick} disabled={action.disabled}><span>{action.label}</span><ShotLabIcon name="arrow" size={16} /></button> : null}
      </div>
      {children ? <div className="secondaryPageDecision__visual">{children}</div> : null}
    </section>
  );
}

export function SecondaryPageEvidence({ children, testId, label = "Supporting evidence" }) {
  return <section className="secondaryPageEvidence" data-testid={testId} aria-label={label}>{children}</section>;
}
