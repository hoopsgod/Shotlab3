const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const COMPLETE_STATES = new Set(["completed"]);

const pad = (value) => String(value).padStart(2, "0");

export function normalizeAssignmentDueDate(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  if (!DATE_KEY.test(candidate)) return "";
  const [year, month, day] = candidate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return candidate;
}

export function assignmentDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function assignmentDueDateFromOffset(days = 0, value = new Date()) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + Math.max(0, Math.floor(Number(days) || 0)));
  return assignmentDateKey(date);
}

export function isAssignmentOverdue({ dueDate = "", state = "assigned", now = new Date() } = {}) {
  const normalized = normalizeAssignmentDueDate(dueDate);
  if (!normalized || COMPLETE_STATES.has(String(state || "").trim().toLowerCase())) return false;
  const today = assignmentDateKey(now);
  return Boolean(today) && normalized < today;
}

export function formatAssignmentDueDate(value, options = {}) {
  const normalized = normalizeAssignmentDueDate(value);
  if (!normalized) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(options.includeYear ? { year: "numeric" } : {}),
  });
}
