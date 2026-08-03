import "./SecondaryPageSystem.css";

const actionClassName = (index, action) => [
  "secondaryPageAction",
  index === 0 ? "secondaryPageAction--primary" : "secondaryPageAction--secondary",
  action.className,
].filter(Boolean).join(" ");

export function SecondaryPageShell({ children, testId, className = "" }) {
  return (
    <section
      className={["secondaryPageShell", className].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      {children}
    </section>
  );
}

export function SecondaryPageIntro({ eyebrow, title, summary, status, actions = [], testId }) {
  return (
    <header className="secondaryPageIntro appHeader" data-testid={testId}>
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
              <button
                key={action.key || action.label}
                type="button"
                className={actionClassName(index, action)}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.ariaLabel || action.label}
              >
                <span>{action.label}</span>
                {action.icon ? <span className="secondaryPageAction__icon" aria-hidden="true">{action.icon}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SecondaryPageToolbar({ children, testId, label = "Page tools" }) {
  return (
    <section className="secondaryPageToolbar" data-testid={testId} aria-label={label}>
      {children}
    </section>
  );
}

export function SecondaryPageDecision({ eyebrow, title, detail, tone = "neutral", action, children, testId }) {
  return (
    <section className="secondaryPageDecision" data-tone={tone} data-testid={testId}>
      <div className="secondaryPageDecision__copy">
        {eyebrow ? <div className="secondaryPageDecision__eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
        {action ? (
          <button type="button" onClick={action.onClick} disabled={action.disabled}>
            <span>{action.label}</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
      {children ? <div className="secondaryPageDecision__visual">{children}</div> : null}
    </section>
  );
}

export function SecondaryPageEvidence({ children, testId, label = "Supporting evidence" }) {
  return (
    <section className="secondaryPageEvidence" data-testid={testId} aria-label={label}>
      {children}
    </section>
  );
}
