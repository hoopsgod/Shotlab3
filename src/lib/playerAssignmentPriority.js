import { isAssignmentOverdue } from "./assignmentDeadline.js";

const STATES = new Set(["assigned", "acknowledged", "started", "completed"]);
const STATE_INDEX = { assigned: 0, acknowledged: 1, started: 2, completed: 3 };
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);

const copyFor = ({ state, overdue }) => {
  if (state === "completed") {
    return {
      eyebrow: "Coach priority · Complete",
      title: "Coach assignment complete",
      summary: "Your coach-directed work is banked. Your normal training plan is back in focus.",
      status: "Complete",
    };
  }
  if (overdue) {
    return {
      eyebrow: "Coach priority · Past due",
      title: "This assignment needs attention",
      summary: state === "started"
        ? "Finish the work and mark it complete so your coach can see the response."
        : state === "acknowledged"
          ? "You have reviewed the assignment. Start it now and close the loop with your coach."
          : "Review the assignment and acknowledge it before moving to optional training.",
      status: "Overdue",
    };
  }
  if (state === "started") {
    return {
      eyebrow: "Coach priority · In progress",
      title: "Finish what you started",
      summary: "Complete the coach-directed work, then record the finish so the assignment clears from your priority queue.",
      status: "In progress",
    };
  }
  if (state === "acknowledged") {
    return {
      eyebrow: "Coach priority · Ready to start",
      title: "Start your coach assignment",
      summary: "You have reviewed the assignment. Begin the work now and keep the response loop moving.",
      status: "Ready",
    };
  }
  return {
    eyebrow: "Coach priority · Review now",
    title: "Your coach’s next action",
    summary: "Review the assignment, then acknowledge it so your coach knows you received the direction.",
    status: "New",
  };
};

export function derivePlayerAssignmentPriority(assignment = {}, { now = new Date() } = {}) {
  const rawState = clean(assignment?.state, 40).toLowerCase();
  const state = STATES.has(rawState) ? rawState : "assigned";
  const overdue = isAssignmentOverdue({
    dueDate: assignment?.dueDate || assignment?.due_date,
    state,
    now,
  });
  const index = STATE_INDEX[state];
  const copy = copyFor({ state, overdue });
  const steps = [
    { id: "acknowledge", label: "Acknowledge", done: index >= 1, active: index === 0 },
    { id: "start", label: "Start", done: index >= 2, active: index === 1 },
    { id: "complete", label: "Complete", done: index >= 3, active: index === 2 },
  ];

  return {
    ...copy,
    state,
    overdue,
    complete: state === "completed",
    priorityState: state === "completed" ? "complete" : overdue ? "overdue" : state,
    assignmentText: clean(assignment?.assignmentText || assignment?.assignment_text),
    resultDetail: clean(assignment?.resultDetail || assignment?.result_detail, 1200),
    steps,
  };
}
