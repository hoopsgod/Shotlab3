import { useEffect, useRef, useState } from "react";
import "./AppFeedbackLayer.css";

const FEEDBACK_EVENT = "shotlab:feedback";
const DEFAULT_DURATION = 3600;

export function announceFeedback(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail }));
}

export default function AppFeedbackLayer() {
  const [feedback, setFeedback] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleFeedback = (event) => {
      const detail = event?.detail || {};
      const message = String(detail.message || "").trim();
      if (!message) return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setFeedback({
        id: `${Date.now()}-${Math.random()}`,
        tone: ["success", "error", "info"].includes(detail.tone) ? detail.tone : "info",
        title: String(detail.title || "").trim(),
        message,
      });
      timeoutRef.current = window.setTimeout(() => setFeedback(null), Number(detail.duration) || DEFAULT_DURATION);
    };

    window.addEventListener(FEEDBACK_EVENT, handleFeedback);
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, handleFeedback);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!feedback) return null;

  return (
    <div className="app-feedback-region" aria-live={feedback.tone === "error" ? "assertive" : "polite"} aria-atomic="true">
      <section className={`app-feedback app-feedback--${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}>
        <span className="app-feedback__mark" aria-hidden="true">{feedback.tone === "success" ? "✓" : feedback.tone === "error" ? "!" : "i"}</span>
        <div className="app-feedback__copy">
          {feedback.title ? <strong>{feedback.title}</strong> : null}
          <span>{feedback.message}</span>
        </div>
        <button className="app-feedback__dismiss" type="button" onClick={() => setFeedback(null)} aria-label="Dismiss notification">×</button>
      </section>
    </div>
  );
}
