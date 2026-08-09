const safeArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const percent = (value, fallback = 0) => {
  const parsed = Number(value);
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(parsed) ? parsed : fallback)));
};

export function buildCoachInboxModel({
  attentionItems = [],
  activationPath = null,
  hasScheduledSession = false,
  nextEventDateFormatted = "",
  eventReadiness = null,
} = {}) {
  const eventId = clean(eventReadiness?.eventId || eventReadiness?.key || eventReadiness?.event?.id);
  const attending = count(eventReadiness?.attending ?? eventReadiness?.confirmed);
  const unavailable = count(eventReadiness?.unavailable);
  const awaitingResponse = count(eventReadiness?.awaitingResponse ?? eventReadiness?.missing);
  const observedRoster = count(eventReadiness?.rosterCount);
  const rosterSize = observedRoster || (attending + unavailable + awaitingResponse);
  const responded = Math.min(rosterSize, count(eventReadiness?.responded || (attending + unavailable)));
  const calculatedRate = rosterSize ? (responded / rosterSize) * 100 : 0;
  const responseRate = percent(eventReadiness?.responseRate, calculatedRate);
  const dateLabel = clean(eventReadiness?.dateLabel) || [clean(eventReadiness?.date), clean(eventReadiness?.time)].filter(Boolean).join(" at ");
  const readiness = eventId && dateLabel && awaitingResponse > 0 && rosterSize > 0
    ? [{
        kind: "event-readiness",
        title: clean(eventReadiness?.title) || "Next team event",
        detail: `${awaitingResponse} of ${rosterSize} ${rosterSize === 1 ? "player" : "players"} still ${awaitingResponse === 1 ? "needs" : "need"} to RSVP.`,
        meta: [`${attending} attending`, unavailable ? `${unavailable} unavailable` : "", `${responseRate}% responded`, dateLabel].filter(Boolean).join(" · "),
        label: "Review RSVPs",
        action: "open-event-readiness",
        eventId,
        tone: "warning",
      }]
    : [];

  const attention = safeArray(attentionItems).map((item, sourceIndex) => ({
    kind: "attention",
    title: clean(item?.name || item?.title) || "Player follow-up",
    detail: clean(item?.detail) || "Review player status.",
    meta: clean(item?.meta),
    label: clean(item?.actionLabel) || "Review player",
    action: "open-attention",
    sourceIndex,
    tone: item?.tone === "danger" ? "danger" : item?.tone === "success" ? "success" : "warning",
  }));

  const activation = !activationPath?.complete && activationPath?.next
    ? [{
        kind: "activation",
        title: clean(activationPath.next.title) || "Continue team setup",
        detail: clean(activationPath.next.detail) || "Complete the next team activation step.",
        meta: "Team launch",
        label: clean(activationPath.next.label) || "Continue",
        action: clean(activationPath.next.action),
        tone: "planning",
      }]
    : [];

  const items = [...readiness, ...attention, ...activation];
  const sessionDate = clean(nextEventDateFormatted);
  const validSession = Boolean(hasScheduledSession && sessionDate && !/^(none|—|not set)$/i.test(sessionDate));

  return {
    items,
    actionableCount: items.length,
    allClear: items.length === 0,
    context: validSession
      ? {
          kind: "session",
          title: "Next team session",
          detail: sessionDate,
          label: "Open session",
          action: "open-session",
        }
      : null,
  };
}