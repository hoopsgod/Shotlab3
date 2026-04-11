import React, { useMemo, useState } from "react";
import { HELP_TOPICS } from "../../help/helpContent";
import { dismissCoachmark, isCoachmarkDismissed } from "../../help/helpStorage";
import InfoHint from "./InfoHint";

export default function HelpAnchor({
  topicKey,
  coachmarkId,
  showCoachmark = false,
  children,
  className = "",
}) {
  const topic = HELP_TOPICS[topicKey];

  const shouldStartOpen = useMemo(() => {
    if (!showCoachmark || !coachmarkId) return false;
    return !isCoachmarkDismissed(coachmarkId);
  }, [showCoachmark, coachmarkId]);

  const [open, setOpen] = useState(shouldStartOpen);
  const [expanded, setExpanded] = useState(false);

  if (!topic) return children;

  return (
    <div className={`sl-help-anchor ${className}`}>
      <div className="sl-help-anchor__main">{children}</div>

      <div className="sl-help-anchor__corner">
        <InfoHint topicKey={topicKey} />
      </div>

      {open && (
        <div className="sl-coachmark" role="dialog" aria-label={`${topic.title} coachmark`}>
          <div className="sl-coachmark__eyebrow">Quick help</div>
          <div className="sl-coachmark__title">{topic.title}</div>
          <p className="sl-coachmark__body">{topic.shortHint}</p>

          {expanded && (
            <ul className="sl-coachmark__list">
              {topic.details.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className="sl-coachmark__actions">
            <button
              type="button"
              className="sl-coachmark__btn sl-coachmark__btn--ghost"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Less" : "More"}
            </button>

            <button
              type="button"
              className="sl-coachmark__btn"
              onClick={() => {
                dismissCoachmark(coachmarkId);
                setOpen(false);
                setExpanded(false);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
