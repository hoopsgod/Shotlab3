import { useCallback, useEffect, useRef, useState } from "react";
import { formatAssignmentDueDate } from "../lib/assignmentDeadline.js";
import { derivePlayerAssignmentPriority } from "../lib/playerAssignmentPriority.js";
import {
  ASSIGNMENT_READ_STATES,
  loadPlayerAssignment,
  PLAYER_ASSIGNMENT_CHANGE_EVENT,
  updatePlayerAssignmentState,
} from "../lib/playerAssignmentService.js";
import styles from "./PlayerCoachAssignmentCard.module.css";

const actionFor = (state = "assigned") => state === "assigned" ? { action: "acknowledge", label: "Acknowledge assignment" } : state === "acknowledged" ? { action: "start", label: "Start assignment" } : state === "started" ? { action: "complete", label: "Mark assignment complete" } : null;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};
const readMessage = (readState) => readState === ASSIGNMENT_READ_STATES.DEGRADED
  ? "Showing the saved assignment. Latest coach updates could not be refreshed."
  : readState === ASSIGNMENT_READ_STATES.FAILURE
    ? "Coach assignment is temporarily unavailable. Try again when your connection is restored."
    : readState === ASSIGNMENT_READ_STATES.DENIED
      ? "Coach assignment is unavailable for this account."
      : "";

export default function PlayerCoachAssignmentCard() {
  const [assignment, setAssignment] = useState(null);
  const [readState, setReadState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const actionInFlightRef = useRef(false);

  const applyLoadResult = useCallback((result = {}) => {
    const nextReadState = result.readState || (result.ok ? ASSIGNMENT_READ_STATES.EMPTY : ASSIGNMENT_READ_STATES.FAILURE);
    setReadState(nextReadState);
    if (result.assignment || nextReadState === ASSIGNMENT_READ_STATES.EMPTY) setAssignment(result.assignment || null);
    const nextMessage = readMessage(nextReadState);
    setError(Boolean(nextMessage));
    setMessage(nextMessage);
  }, []);

  const refresh = useCallback(async () => {
    const result = await loadPlayerAssignment();
    applyLoadResult(result);
  }, [applyLoadResult]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await loadPlayerAssignment();
      if (cancelled) return;
      applyLoadResult(result);
    };
    const onFocus = () => void run();
    const onVisibility = () => { if (document.visibilityState === "visible") void run(); };
    const onChanged = (event) => {
      if (!cancelled && event?.detail?.assignmentText) {
        setAssignment(event.detail);
        setReadState(ASSIGNMENT_READ_STATES.SUCCESS);
      }
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
  }, [applyLoadResult, refresh]);

  if (!assignment) {
    if (readState !== ASSIGNMENT_READ_STATES.FAILURE && readState !== ASSIGNMENT_READ_STATES.DENIED) return null;
    return (
      <section
        className={styles.root}
        data-testid="player-coach-assignment"
        data-assignment-read-state={readState}
        aria-label="Coach assignment status"
      >
        <div className={`${styles.message} ${styles.messageError}`} role="status">{message}</div>
      </section>
    );
  }
  const priority = derivePlayerAssignmentPriority(assignment);
  const next = actionFor(priority.state);
  const dueLabel = formatAssignmentDueDate(assignment.dueDate);

  const advance = async () => {
    if (!next || actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setBusy(true);
    setError(false);
    setMessage("Saving…");
    try {
      const result = await updatePlayerAssignmentState({ teamId: assignment.teamId, action: next.action });
      setAssignment(result.assignment || assignment);
      setError(!result.ok);
      setMessage(result.message || (result.ok ? "Assignment updated." : "Assignment status could not be updated. Try again."));
    } catch {
      setError(true);
      setMessage("Assignment status could not be updated. Try again.");
    } finally {
      actionInFlightRef.current = false;
      setBusy(false);
    }
  };

  return (
    <section
      className={`${styles.root} ${priority.complete ? styles.rootComplete : styles.rootPriority}`}
      data-testid="player-coach-assignment"
      data-assignment-state={priority.state}
      data-assignment-overdue={String(priority.overdue)}
      data-assignment-priority={priority.priorityState}
      data-assignment-read-state={readState}
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
        {next ? <button type="button" className={styles.primary} onClick={advance} disabled={busy} aria-busy={busy} data-testid="player-assignment-action">{busy ? "Saving…" : next.label}</button> : <button type="button" className={styles.primary} disabled data-testid="player-assignment-action">Assignment complete</button>}
        <span className={styles.meta}>{assignment.updatedAt ? `Updated ${formatDate(assignment.updatedAt)}` : "Coach assigned"}</span>
      </div>
      <div className={`${styles.message} ${error ? styles.messageError : ""}`} role="status">{message}</div>
    </section>
  );
}
