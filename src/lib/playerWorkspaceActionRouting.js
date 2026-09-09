const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const findTextElement = (root, text, selector, partial = false) => {
  const wanted = normalize(text);
  if (!root || !wanted) return null;
  return Array.from(root.querySelectorAll(selector)).find((node) => {
    const value = normalize(node.textContent);
    return partial ? value.includes(wanted) : value === wanted;
  }) || null;
};

const findExactTextElement = (root, text) =>
  findTextElement(root, text, "h1,h2,h3,h4,[role='heading'],label,button,div,span");

const findLabeledControl = (root, labelText) => {
  const label = findExactTextElement(root, labelText);
  if (!label) return null;
  return label.control || label.parentElement?.querySelector?.("input,select,textarea,button") || null;
};

const findButtonByText = (root, text) => findTextElement(root, text, "button", true);

const revealControl = (control, scrollTarget = control) => {
  if (!control) return false;
  scrollTarget?.scrollIntoView?.({ block: "center" });
  control.focus?.({ preventScroll: true });
  return true;
};

export const hasWorkspaceRevealIntent = (action = {}) => Boolean(action?.focus || action?.reveal);

export const scheduleWorkspaceActionReveal = (action = {}, options = {}) => {
  if (typeof window === "undefined" || typeof document === "undefined" || !hasWorkspaceRevealIntent(action)) return null;
  const maxAttempts = Number.isFinite(options.maxAttempts) ? options.maxAttempts : 10;
  const retryDelay = Number.isFinite(options.retryDelay) ? options.retryDelay : 70;
  let attempts = 0;

  const attemptReveal = () => {
    attempts += 1;
    const intent = action.reveal || {};
    const container = intent.containerTestId
      ? document.querySelector(`[data-testid="${intent.containerTestId}"]`)
      : document;

    if (!container) {
      if (attempts < maxAttempts) window.setTimeout(attemptReveal, retryDelay);
      return;
    }

    const focusLabel = intent.focusLabel || (action.focus === "shot-tracker" ? "SHOTS MADE" : action.focus === "sc-log" ? "TIME" : "");
    if (focusLabel) {
      const control = findLabeledControl(container, focusLabel);
      if (control && revealControl(control, control.closest?.("div") || control)) return;
    }

    const matchedText = intent.matchText ? findExactTextElement(container, intent.matchText) : null;
    if (matchedText) {
      const card = matchedText.closest?.(".ch") || matchedText.closest?.("button") || matchedText.parentElement || matchedText;
      const cardScope = card?.parentElement || card;
      const expandedAction = intent.activate === "expand" && card?.matches?.("button");
      if (expandedAction && !findButtonByText(cardScope, intent.focusButtonText || "RSVP")) card.click?.();

      window.setTimeout(() => {
        const focusTarget = intent.focusButtonText
          ? findButtonByText(cardScope, intent.focusButtonText)
          : card?.matches?.("button") ? card : null;
        revealControl(focusTarget || card, card);
      }, expandedAction ? 80 : 0);
      return;
    }

    if (intent.containerTestId && !intent.matchText) {
      revealControl(container, container);
      return;
    }

    if (attempts < maxAttempts) window.setTimeout(attemptReveal, retryDelay);
  };

  return window.setTimeout(attemptReveal, Number.isFinite(options.initialDelay) ? options.initialDelay : 90);
};
