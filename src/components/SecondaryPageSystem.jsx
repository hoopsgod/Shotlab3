import "./SecondaryPageSystem.css";

export function SecondaryPageShell({ children, testId }) {
  return <section className="secondaryPageShell" data-testid={testId}>{children}</section>;
}

export function SecondaryPageIntro({ eyebrow, title, summary, status, actions = [], testId }) {
  return (
    <header className="secondaryPageIntro" data-testid={testId}>
      <div className="secondaryPageIntro__copy">
        {eyebrow ? <div className="secondaryPageIntro__eyebrow">{eyebrow}</div> : null}
        <h1 className="secondaryPageIntro__title">{title}</h1>
        {summary ? <p className="secondaryPageIntro__summary">{summary}</p> : null}
      </div>
      <div className="secondaryPageIntro__actions">
        {status ? <div className="secondaryPageIntro__status">{status}</div> : null}
        {actions.map((action, index) => (
          <button
            key={action.key || action.label}
            type="button"
            className={index === 0 ? "secondaryPageAction secondaryPageAction--primary" : "secondaryPageAction"}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </header>
  );
}

export function SecondaryPageToolbar({ children, testId }) {
  return <div className="secondaryPageToolbar" data-testid={testId}>{children}</div>;
}

export function SecondaryPageDecision({ eyebrow, title, detail, tone = "neutral", action, children, testId }) {
  return (
    <section className="secondaryPageDecision" data-tone={tone} data-testid={testId}>
      <div className="secondaryPageDecision__copy">
        {eyebrow ? <div className="secondaryPageDecision__eyebrow">{eyebrow}</div> : null}
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
        {action ? <button type="button" onClick={action.onClick}>{action.label}</button> : null}
      </div>
      {children ? <div className="secondaryPageDecision__visual">{children}</div> : null}
    </section>
  );
}

export function SecondaryPageEvidence({ children, testId }) {
  return <div className="secondaryPageEvidence" data-testid={testId}>{children}</div>;
}
