const safeArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();

export function buildCoachInboxModel({
  attentionItems = [],
  activationPath = null,
  hasScheduledSession = false,
  nextEventDateFormatted = "",
} = {}) {
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

  const items = [...attention, ...activation];
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
