export const COACH_RESPONSE_CONTEXT_KEY = "__shotlabCoachResponseContext";
export const COACH_FOLLOW_UP_CONTEXT_KEY = "__shotlabCoachFollowUpContext";
export const NEXT_ASSIGNMENT_MARKER = "[SHOTLAB NEXT ASSIGNMENT]";
export const PRIVATE_NOTE_MARKER = "[SHOTLAB PRIVATE NOTE]";

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const normalize = (value) => clean(value, 320).toLowerCase().replace(/\s+/g, " ");

export function buildCoachResponseContext({
  playerIdentity = "",
  playerName = "",
  detail = "",
  resultDetail: storedResultDetail = "",
  meta = "",
  resultMeta: storedResultMeta = "",
  source = "live-activity",
  openedAt = new Date().toISOString(),
} = {}) {
  const resultDetail = clean(detail || storedResultDetail, 600);
  const makesMatch = resultDetail.match(/(?:^|\D)(\d{1,5})\s+make(?:s)?\b/i);
  return {
    playerIdentity: normalize(playerIdentity),
    playerName: clean(playerName, 320),
    resultDetail,
    resultMeta: clean(meta || storedResultMeta, 160),
    made: makesMatch ? Math.max(0, Number(makesMatch[1]) || 0) : 0,
    source: clean(source, 80) || "live-activity",
    openedAt: clean(openedAt, 120),
  };
}

export function setCoachResponseContext(context = {}, target = globalThis) {
  const normalized = buildCoachResponseContext(context);
  if (!normalized.playerIdentity && !normalized.playerName) return null;
  try {
    target[COACH_RESPONSE_CONTEXT_KEY] = normalized;
    target[COACH_FOLLOW_UP_CONTEXT_KEY] = {
      playerIdentity: normalized.playerIdentity || normalized.playerName,
      playerName: normalized.playerName,
    };
  } catch {}
  return normalized;
}

export function getCoachResponseContext({
  target = globalThis,
  playerIdentity = "",
  playerName = "",
  maxAgeMs = 10 * 60 * 1000,
  now = Date.now(),
} = {}) {
  const context = target?.[COACH_RESPONSE_CONTEXT_KEY];
  if (!context) return null;
  const expectedIdentity = normalize(playerIdentity);
  const expectedName = normalize(playerName);
  const contextIdentity = normalize(context.playerIdentity);
  const contextName = normalize(context.playerName);
  const matches = Boolean(
    (expectedIdentity && contextIdentity && expectedIdentity === contextIdentity)
    || (expectedIdentity && contextName && expectedIdentity === contextName)
    || (expectedName && contextName && expectedName === contextName)
    || (expectedName && contextIdentity && expectedName === contextIdentity)
  );
  if (!matches) return null;
  const openedAt = Date.parse(context.openedAt || "");
  if (Number.isFinite(openedAt) && Number.isFinite(Number(now)) && Number(now) - openedAt > Math.max(1, Number(maxAgeMs) || 1)) return null;
  return buildCoachResponseContext(context);
}

export function buildNextAssignmentSuggestion(context = {}) {
  const playerName = clean(context.playerName, 320);
  const made = Math.max(0, Number(context.made) || 0);
  if (made > 0) return `Repeat this shooting block and match or improve ${made} makes with the same standard.`;
  if (clean(context.resultDetail, 600)) return "Review this result and complete the next agreed training block.";
  return playerName ? `Confirm the next training priority with ${playerName}.` : "Confirm the next training priority with this player.";
}

export function parseCoachResponseNote(note = "") {
  const value = clean(note, 4000);
  if (!value.startsWith(NEXT_ASSIGNMENT_MARKER)) {
    return { assignment: "", privateNote: value, structured: false };
  }
  const body = value.slice(NEXT_ASSIGNMENT_MARKER.length).trim();
  const privateIndex = body.indexOf(PRIVATE_NOTE_MARKER);
  if (privateIndex < 0) return { assignment: clean(body, 2000), privateNote: "", structured: true };
  return {
    assignment: clean(body.slice(0, privateIndex), 2000),
    privateNote: clean(body.slice(privateIndex + PRIVATE_NOTE_MARKER.length), 2000),
    structured: true,
  };
}

export function serializeCoachResponseNote({ assignment = "", privateNote = "" } = {}) {
  const nextAssignment = clean(assignment, 2000);
  const coachNote = clean(privateNote, 2000);
  if (!nextAssignment) return coachNote;
  return [
    NEXT_ASSIGNMENT_MARKER,
    nextAssignment,
    coachNote ? `${PRIVATE_NOTE_MARKER}\n${coachNote}` : "",
  ].filter(Boolean).join("\n");
}
