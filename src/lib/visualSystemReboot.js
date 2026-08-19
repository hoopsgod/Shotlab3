const STYLE_ID = "shotlab-visual-system-reboot";

export const VISUAL_SYSTEM_REBOOT_VERSION = "product-light-v3-mission-control";

const CSS = `
/* ShotLab product-light reboot owns Mission Control support surfaces only.
   Coach Hero identity, crest, title, summary, and mobile control bar are source-owned. */
:root {
  --sl-canvas: #f5f5f2;
  --sl-surface: #ffffff;
  --sl-surface-subtle: #f0f1ed;
  --sl-ink: #171a18;
  --sl-muted: #68706a;
  --sl-faint: #8b928d;
  --sl-line: rgba(23,26,24,.10);
  --sl-line-strong: rgba(23,26,24,.16);
  --sl-accent: color-mix(in srgb, var(--team-brand-primary,var(--accent,#9fbe28)) 76%, #596225);
  --sl-shadow: 0 12px 34px rgba(23,28,24,.07);
  --sl-shadow-raised: 0 20px 48px rgba(23,28,24,.10);
}

body.mission-control-active {
  color-scheme: light !important;
  color: var(--sl-ink) !important;
  background: var(--sl-canvas) !important;
}

body.mission-control-active::before,
body.mission-control-active::after {
  opacity: 0 !important;
  background: none !important;
  pointer-events: none !important;
}

body.mission-control-active .missionControl {
  width: min(100%, 1180px) !important;
  margin-inline: auto !important;
  padding: 18px 18px 92px !important;
  background: var(--sl-canvas) !important;
}

body.mission-control-active .mcTopbar,
body.mission-control-active .mcTopBar {
  min-height: 0 !important;
  padding: 14px 16px !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 18px !important;
  background: rgba(255,255,255,.94) !important;
  color: var(--sl-ink) !important;
  box-shadow: 0 6px 22px rgba(23,28,24,.055) !important;
  backdrop-filter: blur(18px) saturate(115%) !important;
}

body.mission-control-active .mcTopbar h1,
body.mission-control-active .mcTopBar h1 {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: clamp(25px,5vw,38px) !important;
  font-weight: 780 !important;
  line-height: 1 !important;
  letter-spacing: -.045em !important;
  text-transform: none !important;
}

body.mission-control-active .mcTopbar button,
body.mission-control-active .mcTopBar button {
  border-color: var(--sl-line) !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}

body.mission-control-active .mcRealityStrip {
  grid-column: 1/-1 !important;
  width: 100% !important;
  margin: 2px 0 0 !important;
  border: 0 !important;
  border-top: 1px solid var(--sl-line) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.mission-control-active .mcRealityStrip > * {
  min-height: 62px !important;
  border-color: var(--sl-line) !important;
  background: transparent !important;
  color: var(--sl-ink) !important;
}

body.mission-control-active .mcPrimary {
  grid-column: 1/-1 !important;
  min-height: 50px !important;
  border: 0 !important;
  border-radius: 14px !important;
  background: #202421 !important;
  color: #fff !important;
  box-shadow: none !important;
}

body.mission-control-active .mcSection,
body.mission-control-active .mcTodayPlan,
body.mission-control-active [data-testid="coach-assignment-accountability"] {
  border: 1px solid var(--sl-line) !important;
  border-radius: 20px !important;
  background: var(--sl-surface) !important;
  color: var(--sl-ink) !important;
  box-shadow: var(--sl-shadow) !important;
}

body.mission-control-active .mcSection::before,
body.mission-control-active .mcSection::after,
body.mission-control-active [data-testid="coach-assignment-accountability"]::before,
body.mission-control-active [data-testid="coach-assignment-accountability"]::after {
  opacity: 0 !important;
  background: none !important;
}

body.mission-control-active .mcSection h2,
body.mission-control-active .mcSection h3,
body.mission-control-active [data-testid="coach-assignment-accountability"] h2 {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-weight: 760 !important;
  letter-spacing: -.035em !important;
  text-transform: none !important;
}

body.mission-control-active .mcSection p,
body.mission-control-active .mcSection small,
body.mission-control-active [data-testid="coach-assignment-accountability"] small,
body.mission-control-active [data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityMeta,
body.mission-control-active [data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityStatus {
  color: var(--sl-muted) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}

body.mission-control-active .mcAssignmentStateFacts {
  grid-template-columns: repeat(5,minmax(0,1fr)) !important;
  gap: 0 !important;
  border-block: 1px solid var(--sl-line) !important;
}

body.mission-control-active .mcAssignmentStateFact {
  padding: 14px 8px !important;
  border: 0 !important;
  border-right: 1px solid var(--sl-line) !important;
  border-radius: 0 !important;
  background: transparent !important;
}

body.mission-control-active .mcAssignmentStateFact:last-child {
  border-right: 0 !important;
}

body.mission-control-active .mcAssignmentStateFact strong {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: 24px !important;
  font-weight: 760 !important;
}

body.mission-control-active .mcAssignmentStateFact small {
  font-size: 10px !important;
}

body.mission-control-active .mcAssignmentAccountabilityBadge {
  border-color: var(--sl-line-strong) !important;
  background: var(--sl-surface-subtle) !important;
  color: var(--sl-muted) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;
  letter-spacing: .04em !important;
}

body.mission-control-active .mcAssignmentAccountabilityEmpty,
body.mission-control-active .mcAssignmentAccountabilityRow {
  border-color: var(--sl-line) !important;
  background: #fafaf8 !important;
  color: var(--sl-ink) !important;
}

@media (max-width: 760px) {
  body.mission-control-active .missionControl {
    padding: 12px 12px 96px !important;
  }

  body.mission-control-active .mcAssignmentStateFacts {
    grid-template-columns: repeat(3,minmax(0,1fr)) !important;
  }

  body.mission-control-active .mcAssignmentStateFact:nth-child(4),
  body.mission-control-active .mcAssignmentStateFact:nth-child(5) {
    border-top: 1px solid var(--sl-line) !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-shotlab-design="${VISUAL_SYSTEM_REBOOT_VERSION}"] *,
  body.mission-control-active * {
    animation-duration:.01ms !important;
    transition-duration:.01ms !important;
  }
}
`;

export function installVisualSystemReboot() {
  if (typeof document === "undefined") return false;
  const previous = document.getElementById(STYLE_ID);
  if (previous) previous.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.designSystem = VISUAL_SYSTEM_REBOOT_VERSION;
  style.textContent = CSS;
  document.head.appendChild(style);
  document.documentElement.dataset.shotlabDesign = VISUAL_SYSTEM_REBOOT_VERSION;
  return true;
}
