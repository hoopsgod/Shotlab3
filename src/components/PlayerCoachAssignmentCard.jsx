import { useCallback, useEffect, useState } from "react";
import { loadPlayerAssignment, PLAYER_ASSIGNMENT_CHANGE_EVENT, updatePlayerAssignmentState } from "../lib/playerAssignmentService.js";
import styles from "./PlayerCoachAssignmentCard.module.css";

const statusLabel = (state = "assigned") => state === "completed" ? "Completed" : state === "started" ? "In progress" : state === "acknowledged" ? "Acknowledged" : "New assignment";
const actionFor = (state = "assigned") => state === "assigned" ? { action: "acknowledge", label: "Acknowledge assignment" } : state === "acknowledged" ? { action: "start", label: "Start assignment" } : state === "started" ? { action: "complete", label: "Mark assignment complete" } : null;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function PlayerCoachAssignmentCard() {
  const [assignment, setAssignment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    const result = await loadPlayerAssignment();
    if (result.assignment) setAssignment(result.assignment);
    if (!result.ok && result.error) {
      setError(true);
      setMessage("The latest coach assignment could not be refreshed.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await loadPlayerAssignment();
      if (cancelled) return;
      setAssignment(result.assignment || null);
      setError(!result.ok && Boolean(result.error));
      setMessage(!result.ok && result.error ? "The latest coach assignment could not be refreshed." : "");
    };
    const onFocus = () => void run();
    const onVisibility = () => { if (document.visibilityState === "visible") void run(); };
    const onChanged = (event) => {
      if (!cancelled && event?.detail?.assignmentText) setAssignment(event.detail);
    };
    void run();
    const timer = window.setInterval(run, 15_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, onChanged);
    };
  }, [refresh]);

  if (!assignment) return null;
  const next = actionFor(assignment.state);

  const advance = async () => {
    if (!next || busy) return;
    setBusy(true);
    setError(false);
    setMessage("Saving…");
    const result = await updatePlayerAssignmentState({ teamId: assignment.teamId, action: next.action });
    setBusy(false);
    setAssignment(result.assignment || assignment);
    setError(!result.ok);
    setMessage(result.message || (result.ok ? "Assignment updated." : "Assignment status could not be updated."));
  };

  return (
    <section className={styles.root} data-testid="player-coach-assignment" data-assignment-state={assignment.state} aria-label="Coach directed assignment">
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Coach directed · Personal assignment</div>
          <h2 className={styles.title}>Your next assignment</h2>
        </div>
        <span className={styles.status}>{statusLabel(assignment.state)}</span>
      </div>
      <p className={styles.copy}>{assignment.assignmentText}</p>
      {assignment.resultDetail ? <p className={styles.context}>Coach response context: {assignment.resultDetail}</p> : null}
      <div className={styles.actions}>
        {next ? <button type="button" className={styles.primary} onClick={advance} disabled={busy} data-testid="player-assignment-action">{busy ? "Saving…" : next.label}</button> : <button type="button" className={styles.primary} disabled data-testid="player-assignment-action">Assignment complete</button>}
        <span className={styles.meta}>{assignment.updatedAt ? `Updated ${formatDate(assignment.updatedAt)}` : "Coach assigned"}</span>
      </div>
      <div className={`${styles.message} ${error ? styles.messageError : ""}`} role="status">{message}</div>
    </section>
  );
}
