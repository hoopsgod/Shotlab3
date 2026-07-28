const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const supportsSmoothMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const findExactTextElement = (root, text) => {
  const wanted = normalize(text);
  if (!root || !wanted || typeof root.querySelectorAll !== "function") return null;
  const nodes = root.querySelectorAll("h1,h2,h3,h4,[role='heading'],label,button,div,span");
  return Array.from(nodes).find((node) => normalize(node.textContent) === wanted) || null;
};

const findLabeledControl = (root, labelText) => {
  const label = findExactTextElement(root, labelText);
  if (!label) return null;
  if (label.control) return label.control;
  return label.parentElement?.querySelector?.("input,select,textarea,button") || null;
};

const findButtonByText = (root, text) => {
  const wanted = normalize(text);
  if (!root || !wanted || typeof root.querySelectorAll !== "function") return null;
  return Array.from(root.querySelectorAll("button")).find((button) => normalize(button.textContent).includes(wanted)) || null;
};

const pulse = (element) => {
  if (!element || !supportsSmoothMotion() || typeof element.animate !== "function") return;
  element.animate(
    [
      { transform: "scale(1)", boxShadow: "0 0 0 rgba(200,255,0,0)" },
      { transform: "scale(1.01)", boxShadow: "0 0 0 3px rgba(200,255,0,0.28)" },
      { transform: "scale(1)", boxShadow: "0 0 0 rgba(200,255,0,0)" },
    ],
    { duration: 760, easing: "ease-out" },
  );
};

const revealControl = (control, scrollTarget = control) => {
  if (!control) return false;
  scrollTarget?.scrollIntoView?.({ behavior: supportsSmoothMotion() ? "smooth" : "auto", block: "center" });
  window.setTimeout(() => control.focus?.({ preventScroll: true }), supportsSmoothMotion() ? 180 : 0);
  pulse(scrollTarget);
  return true;
};

const revealIntent = (action = {}) => action?.reveal || null;

export const hasWorkspaceRevealIntent = (action = {}) => Boolean(action?.focus || revealIntent(action));

export const scheduleWorkspaceActionReveal = (action = {}, options = {}) => {
  if (typeof window === "undefined" || typeof document === "undefined" || !hasWorkspaceRevealIntent(action)) return null;
  const maxAttempts = Number.isFinite(options.maxAttempts) ? options.maxAttempts : 10;
  const retryDelay = Number.isFinite(options.retryDelay) ? options.retryDelay : 70;
  let attempts = 0;

  const attemptReveal = () => {
    attempts += 1;
    const intent = revealIntent(action) || {};
    const container = intent.containerTestId
      ? document.querySelector(`[data-testid="${String(intent.containerTestId).replace(/"/g, '\\"')}"]`)
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
      const expandedContentPresent = expandedAction && Boolean(findButtonByText(cardScope, intent.focusButtonText || "RSVP"));
      if (expandedAction && !expandedContentPresent) card.click?.();

      const finish = () => {
        const focusTarget = intent.focusButtonText
          ? findButtonByText(cardScope, intent.focusButtonText)
          : card?.matches?.("button") ? card : null;
        revealControl(focusTarget || card, card);
      };
      window.setTimeout(finish, expandedAction ? 80 : 0);
      return;
    }

    if (intent.containerTestId && !intent.matchText && container !== document) {
      revealControl(container, container);
      return;
    }

    if (attempts < maxAttempts) window.setTimeout(attemptReveal, retryDelay);
  };

  return window.setTimeout(attemptReveal, Number.isFinite(options.initialDelay) ? options.initialDelay : 90);
};
