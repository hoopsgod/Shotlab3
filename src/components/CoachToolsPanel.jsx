import React, { useEffect, useId, useState } from "react";

const STORAGE_KEY = "shotlab-coach-tools-open";
const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

function UtilitySlidersIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6H8M12 6H20M4 12H14M18 12H20M4 18H10M14 18H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function CoachToolsPanel({ children, defaultCollapsed = true, storageKey = STORAGE_KEY }) {
  const panelId = useId();
  const [open, setOpen] = useState(!defaultCollapsed);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) {
        setOpen(saved === "1");
      }
    } catch {}
  }, [defaultCollapsed, storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, open ? "1" : "0");
    } catch {}
  }, [open, storageKey]);

  return (
    <section className="coach-tools-panel">
      <button
        type="button"
        className="coach-tools-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Collapse coach tools" : "Expand coach tools"}
      >
        <span className="coach-tools-trigger__left">
          <span className="coach-tools-trigger__icon-wrap">
            <UtilitySlidersIcon />
          </span>
          <span>COACH TOOLS</span>
        </span>
        <span className="coach-tools-trigger__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>

      <div id={panelId} className={`coach-tools-content ${open ? "is-open" : ""}`}>
        <div className="coach-tools-content__inner">{children}</div>
      </div>

      <style>{`
        .coach-tools-panel {
          margin-bottom: var(--stack-gap);
          border-radius: var(--radius-card);
          border: 1px solid var(--stroke-1);
          background: var(--surface-2);
          box-shadow: var(--shadow-1);
          overflow: hidden;
        }

        .coach-tools-trigger {
          position: relative;
          height: var(--coach-button-height);
          min-height: var(--coach-button-height);
          max-height: 52px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-8);
          padding: 0 var(--coach-card-pad);
          border: 0;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.01);
          cursor: pointer;
          color: var(--text-secondary);
          font-family: ${FB};
          font-weight: 700;
          letter-spacing: var(--tracking-tight);
          text-transform: uppercase;
          font-size: 11px;
          transition: background-color 160ms ease, color 160ms ease;
        }

        .coach-tools-trigger::before {
          content: "";
          position: absolute;
          left: 0;
          top: var(--space-8);
          bottom: var(--space-8);
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--stroke-1);
        }

        .coach-tools-trigger:hover {
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-primary);
        }

        .coach-tools-trigger:active {
          background: rgba(0, 0, 0, 0.24);
        }

        .coach-tools-trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }

        .coach-tools-trigger__left {
          display: inline-flex;
          align-items: center;
          gap: var(--space-8);
        }

        .coach-tools-trigger__icon-wrap {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .coach-tools-trigger__chevron {
          display: inline-flex;
          transform: ${open ? "rotate(180deg)" : "rotate(0deg)"};
          transition: transform 200ms ease;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1;
        }

        .coach-tools-content {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          border-top: 1px solid transparent;
          transition: max-height 200ms ease, opacity 200ms ease, border-color 200ms ease;
        }

        .coach-tools-content.is-open {
          max-height: 900px;
          opacity: 1;
          border-top-color: rgba(255, 255, 255, 0.07);
        }

        .coach-tools-content__inner {
          padding-top: var(--space-8);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        @media (prefers-reduced-motion: reduce) {
          .coach-tools-trigger,
          .coach-tools-trigger__chevron,
          .coach-tools-content {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
