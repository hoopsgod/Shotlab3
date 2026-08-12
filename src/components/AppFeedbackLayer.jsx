import { useCallback, useEffect, useRef, useState } from "react";
import "./AppFeedbackLayer.css";

const FEEDBACK_EVENT = "shotlab:feedback";
const DEFAULT_DURATION = 3600;
const EXIT_DURATION = 160;
const ALLOWED_TONES = ["success", "error", "info", "warning"];

export function announceFeedback(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail }));
}

export function clearFeedback(key) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { action: "clear", key } }));
}

export default function AppFeedbackLayer() {
  const [feedback, setFeedback] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const timeoutRef = useRef(null);
  const exitRef = useRef(null);

  const cancelTimers = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (exitRef.current) window.clearTimeout(exitRef.current);
    timeoutRef.current = null;
    exitRef.current = null;
  }, []);

  const dismiss = useCallback((immediate = false) => {
    cancelTimers();
    if (immediate) {
      setLeaving(false);
      setFeedback(null);
      return;
    }
    setLeaving(true);
    exitRef.current = window.setTimeout(() => {
      setLeaving(false);
      setFeedback(null);
      exitRef.current = null;
    }, EXIT_DURATION);
  }, [cancelTimers]);

  useEffect(() => {
    const handleFeedback = (event) => {
      const detail = event?.detail || {};
      if (detail.action === "clear") {
        if (!detail.key || detail.key === feedback?.key) dismiss();
        return;
      }

      const message = String(detail.message || "").trim();
      if (!message) return;
      cancelTimers();
      setLeaving(false);
      const persistent = detail.persistent === true;
      const nextFeedback = {
        id: `${Date.now()}-${Math.random()}`,
        key: String(detail.key || "").trim() || null,
        tone: ALLOWED_TONES.includes(detail.tone) ? detail.tone : "info",
        title: String(detail.title || "").trim(),
        message,
        persistent,
        dismissible: detail.dismissible !== false,
      };
      setFeedback(nextFeedback);

      if (!persistent) {
        const requestedDuration = Number(detail.duration);
        const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
          ? requestedDuration
          : DEFAULT_DURATION;
        timeoutRef.current = window.setTimeout(() => dismiss(), duration);
      }
    };

    window.addEventListener(FEEDBACK_EVENT, handleFeedback);
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, handleFeedback);
      cancelTimers();
    };
  }, [cancelTimers, dismiss, feedback?.key]);

  if (!feedback) return null;

  const mark = feedback.tone === "success"
    ? "✓"
    : feedback.tone === "error"
      ? "!"
      : feedback.tone === "warning"
        ? "•"
        : "i";

  return (
    <div
      className="app-feedback-region"
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      data-feedback-key={feedback.key || undefined}
    >
      <section
        className={`app-feedback app-feedback--${feedback.tone}${leaving ? " app-feedback--leaving" : ""}`}
        role={feedback.tone === "error" ? "alert" : "status"}
        data-persistent={feedback.persistent ? "true" : "false"}
      >
        <span className="app-feedback__mark" aria-hidden="true">{mark}</span>
        <div className="app-feedback__copy">
          {feedback.title ? <strong>{feedback.title}</strong> : null}
          <span>{feedback.message}</span>
        </div>
        {feedback.dismissible ? (
          <button className="app-feedback__dismiss" type="button" onClick={() => dismiss()} aria-label="Dismiss notification">×</button>
        ) : <span className="app-feedback__dismiss-spacer" aria-hidden="true" />}
      </section>
    </div>
  );
}
