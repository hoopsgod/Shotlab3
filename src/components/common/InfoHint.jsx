import React, { useEffect, useRef, useState } from "react";
import { HELP_TOPICS } from "../../help/helpContent";

export default function InfoHint({ topicKey, className = "" }) {
  const topic = HELP_TOPICS[topicKey];
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
        setExpanded(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!topic) return null;

  return (
    <span className={`sl-help ${className}`} ref={rootRef}>
      <button
        type="button"
        className="sl-help__icon"
        aria-label={`Help: ${topic.title}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>

      {open && (
        <div className="sl-help__popover" role="dialog" aria-label={topic.title}>
          <div className="sl-help__title">{topic.title}</div>
          <p className="sl-help__body">{topic.shortHint}</p>

          {expanded && (
            <ul className="sl-help__list">
              {topic.details.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className="sl-help__actions">
            <button
              type="button"
              className="sl-help__linkBtn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Show less" : "Learn more"}
            </button>

            <button
              type="button"
              className="sl-help__linkBtn"
              onClick={() => {
                setOpen(false);
                setExpanded(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
