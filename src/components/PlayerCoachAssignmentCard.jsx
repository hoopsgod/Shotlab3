import { useCallback, useEffect, useState } from "react";
import { formatAssignmentDueDate } from "../lib/assignmentDeadline.js";
import { derivePlayerAssignmentPriority } from "../lib/playerAssignmentPriority.js";
import { loadPlayerAssignment, PLAYER_ASSIGNMENT_CHANGE_EVENT, updatePlayerAssignmentState } from "../lib/playerAssignmentService.js";
import styles from "./PlayerCoachAssignmentCard.module.css";

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
  const priority = derivePlayerAssignmentPriority(assignment);
  const next = actionFor(priority.state);
  const dueLabel = formatAssignmentDueDate(assignment.dueDate);

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
    <section
      className={`${styles.root} ${priority.complete ? styles.rootComplete : styles.rootPriority}`}
      data-testid="player-coach-assignment"
      data-assignment-state={priority.state}
      data-assignment-overdue={String(priority.overdue)}
      data-assignment-priority={priority.priorityState}
      aria-label={priority.complete ? "Completed coach assignment" : "Coach assignment next action"}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>{priority.eyebrow}</div>
          <h2 className={styles.title}>{priority.title}</h2>
        </div>
        <span className={`${styles.status} ${priority.overdue ? styles.statusOverdue : ""}`}>{priority.status}</span>
      </div>

      <p className={styles.summary}>{priority.summary}</p>

      {!priority.complete ? (
        <>
          <div className={styles.assignmentBody}>
            <div className={styles.assignmentLabel}>Assignment</div>
            <p className={styles.copy}>{priority.assignmentText}</p>
            {dueLabel ? <p className={`${styles.deadline} ${priority.overdue ? styles.deadlineOverdue : ""}`} data-testid="player-assignment-due-date">{priority.overdue ? "Overdue" : "Due"} {dueLabel}</p> : null}
            {priority.resultDetail ? <p className={styles.context}>Coach response context: {priority.resultDetail}</p> : null}
          </div>

          <div className={styles.progress} data-testid="player-assignment-progress" aria-label="Assignment progress">
            {priority.steps.map((step, index) => {
              const stepState = step.done ? "done" : step.active ? "active" : "pending";
              return (
                <div className={styles.progressStep} data-state={stepState} data-testid={`player-assignment-step-${step.id}`} key={step.id}>
                  <span className={styles.progressMarker} aria-hidden="true">{step.done ? "✓" : index + 1}</span>
                  <span className={styles.progressLabel}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className={styles.completedAssignment}>{priority.assignmentText}</p>
      )}

      <div className={styles.actions}>
        {next ? <button type="button" className={styles.primary} onClick={advance} disabled={busy} data-testid="player-assignment-action">{busy ? "Saving…" : next.label}</button> : <button type="button" className={styles.primary} disabled data-testid="player-assignment-action">Assignment complete</button>}
        <span className={styles.meta}>{assignment.updatedAt ? `Updated ${formatDate(assignment.updatedAt)}` : "Coach assigned"}</span>
      </div>
      <div className={`${styles.message} ${error ? styles.messageError : ""}`} role="status">{message}</div>
    </section>
  );
}
