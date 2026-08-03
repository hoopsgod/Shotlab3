const STYLE_ID = "shotlab-visual-system-reboot";

export const VISUAL_SYSTEM_REBOOT_VERSION = "product-light-v2";

const CSS = `
/* ShotLab product-light v2: one restrained product language across coach surfaces. */
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

body.mission-control-active,
.performance-shell,
.performance-workspace,
.premium-screen {
  color-scheme: light !important;
  color: var(--sl-ink) !important;
  background: var(--sl-canvas) !important;
}

/* Remove legacy cinematic overlays, texture and sport-dashboard glow. */
body.mission-control-active::before,
body.mission-control-active::after,
.performance-shell::before,
.performance-shell::after,
.performance-workspace::before,
.performance-workspace::after {
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

/* Compact, product-like app header. */
body.mission-control-active .mcTopbar,
body.mission-control-active .mcTopBar,
body.mission-control-active .mcHeader,
.performance-shell .appHeader,
.premium-screen .appHeader {
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
body.mission-control-active .mcTopBar h1,
body.mission-control-active .mcHeader h1,
.performance-shell .appHeaderTitle,
.premium-screen .appHeaderTitle {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: clamp(25px,5vw,38px) !important;
  font-weight: 780 !important;
  line-height: 1 !important;
  letter-spacing: -.045em !important;
  text-transform: none !important;
}
body.mission-control-active .mcTopbar button,
body.mission-control-active .mcTopBar button,
body.mission-control-active .mcHeader button {
  border-color: var(--sl-line) !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}

/* Mission Control: compact summary instead of oversized poster. */
body.mission-control-active .mcHero {
  min-height: 0 !important;
  margin-top: 16px !important;
  padding: 0 !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 22px !important;
  background: var(--sl-surface) !important;
  color: var(--sl-ink) !important;
  box-shadow: var(--sl-shadow) !important;
}
body.mission-control-active .mcHero::before,
body.mission-control-active .mcHero::after { opacity: 0 !important; background: none !important; }
body.mission-control-active .mcHeroContent {
  max-width: none !important;
  padding: 24px !important;
  display: grid !important;
  grid-template-columns: minmax(0,1fr) auto !important;
  gap: 18px 24px !important;
  align-items: center !important;
}
body.mission-control-active .mcHeroContent h1 {
  max-width: 13ch !important;
  margin: 4px 0 0 !important;
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: clamp(35px,7vw,54px) !important;
  font-weight: 790 !important;
  line-height: .98 !important;
  letter-spacing: -.055em !important;
  text-transform: none !important;
}
body.mission-control-active .mcHeroContent > p {
  max-width: 48ch !important;
  margin: 10px 0 0 !important;
  color: var(--sl-muted) !important;
  font-size: 15px !important;
  line-height: 1.5 !important;
}
body.mission-control-active .mcHeroEyebrow,
body.mission-control-active .mcEyebrow {
  color: var(--sl-accent) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;
  font-size: 11px !important;
  font-weight: 760 !important;
  letter-spacing: .06em !important;
  text-transform: none !important;
}
body.mission-control-active .mcHeroLogo,
body.mission-control-active .mcHeroContent img {
  width: clamp(72px,18vw,132px) !important;
  max-height: 112px !important;
  object-fit: contain !important;
  filter: none !important;
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

/* Every coach section becomes a clean content section, not an esports card. */
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
body.mission-control-active [data-testid="coach-assignment-accountability"]::after { opacity: 0 !important; background: none !important; }
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
body.mission-control-active .mcAssignmentStateFact:last-child { border-right: 0 !important; }
body.mission-control-active .mcAssignmentStateFact strong {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: 24px !important;
  font-weight: 760 !important;
}
body.mission-control-active .mcAssignmentStateFact small { font-size: 10px !important; }
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

/* Canonical secondary pages: remove the mixed dark/light dashboard layers. */
.secondaryPageShell {
  width: min(100%,1080px) !important;
  margin-inline: auto !important;
  padding: 20px 18px 96px !important;
  gap: 22px !important;
  color: var(--sl-ink) !important;
  background: transparent !important;
}
.secondaryPageIntro {
  align-items: flex-end !important;
  padding: 18px 0 20px !important;
  border-bottom: 1px solid var(--sl-line) !important;
}
.secondaryPageIntro__eyebrow,
.secondaryPageDecision__eyebrow {
  color: var(--sl-accent) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;
  font-size: 11px !important;
  font-weight: 760 !important;
  letter-spacing: .06em !important;
  text-transform: none !important;
}
.secondaryPageIntro__title {
  color: var(--sl-ink) !important;
  font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important;
  font-size: clamp(38px,8vw,58px) !important;
  font-weight: 790 !important;
  line-height: .98 !important;
  letter-spacing: -.055em !important;
  text-transform: none !important;
}
.secondaryPageIntro__summary {
  max-width: 58ch !important;
  color: var(--sl-muted) !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
  background: transparent !important;
}
.secondaryPageAction,
.secondaryPageAction--primary {
  min-height: 46px !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 13px !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.secondaryPageAction--primary { background: #202421 !important; color: #fff !important; border-color: #202421 !important; }
.secondaryPageToolbar {
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}
.secondaryPageToolbar [class*="metricStrip"],
.secondaryPageToolbar [class*="filterRail"] {
  border: 1px solid var(--sl-line) !important;
  border-radius: 18px !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.secondaryPageToolbar [class*="metric"] {
  border-color: var(--sl-line) !important;
  background: transparent !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.secondaryPageToolbar input {
  min-height: 48px !important;
  border: 1px solid var(--sl-line-strong) !important;
  border-radius: 13px !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.secondaryPageToolbar button {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--sl-muted) !important;
  box-shadow: none !important;
}
.secondaryPageToolbar button[aria-pressed="true"],
.secondaryPageToolbar button[data-active="true"] {
  background: var(--sl-surface-subtle) !important;
  color: var(--sl-ink) !important;
}
.secondaryPageDecision {
  grid-template-columns: minmax(0,1fr) !important;
  min-height: 0 !important;
  padding: 24px !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 20px !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: var(--sl-shadow) !important;
}
.secondaryPageDecision h2 {
  max-width: 22ch !important;
  color: var(--sl-ink) !important;
  font-size: clamp(25px,5vw,36px) !important;
  font-weight: 770 !important;
  letter-spacing: -.045em !important;
}
.secondaryPageDecision p { color: var(--sl-muted) !important; }
.secondaryPageDecision button {
  min-height: 44px !important;
  margin-top: 14px !important;
  padding: 0 15px !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 12px !important;
  background: #f7f7f4 !important;
  color: var(--sl-ink) !important;
  text-decoration: none !important;
}
.secondaryPageDecision__visual { display: none !important; }
.secondaryPageEvidence {
  grid-template-columns: repeat(3,minmax(0,1fr)) !important;
  gap: 12px !important;
  border: 0 !important;
}
.secondaryPageEvidence > * {
  padding: 18px !important;
  border: 1px solid var(--sl-line) !important;
  border-radius: 18px !important;
  background: #fff !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.secondaryPageEvidence > * + * { border-left: 1px solid var(--sl-line) !important; }
.secondaryPageEvidence h2,
.secondaryPageEvidence h3,
.secondaryPageEvidence strong { color: var(--sl-ink) !important; }
.secondaryPageEvidence p,
.secondaryPageEvidence small { color: var(--sl-muted) !important; }

/* Empty states: one compact, quiet action surface. */
.coachDashboardNoResults,
[class*="EmptyState"],
[class*="emptyState"] {
  min-height: 0 !important;
  padding: 36px 22px !important;
  border: 1px dashed var(--sl-line-strong) !important;
  border-radius: 20px !important;
  background: #fafaf8 !important;
  color: var(--sl-ink) !important;
  box-shadow: none !important;
}
.coachDashboardNoResults h2,
.coachDashboardNoResults h3,
[class*="EmptyState"] h2,
[class*="EmptyState"] h3 { color: var(--sl-ink) !important; font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif !important; text-transform: none !important; letter-spacing: -.035em !important; }
.coachDashboardNoResults p,
[class*="EmptyState"] p { color: var(--sl-muted) !important; font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important; }

@media (max-width: 760px) {
  body.mission-control-active .missionControl { padding: 12px 12px 96px !important; }
  body.mission-control-active .mcHeroContent { grid-template-columns: 1fr auto !important; padding: 20px !important; }
  body.mission-control-active .mcHeroContent h1 { font-size: 39px !important; }
  body.mission-control-active .mcHeroLogo,
  body.mission-control-active .mcHeroContent img { width: 82px !important; max-height: 78px !important; }
  body.mission-control-active .mcAssignmentStateFacts { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
  body.mission-control-active .mcAssignmentStateFact:nth-child(4),
  body.mission-control-active .mcAssignmentStateFact:nth-child(5) { border-top: 1px solid var(--sl-line) !important; }
  .secondaryPageShell { padding: 12px 16px 96px !important; }
  .secondaryPageIntro { align-items: flex-start !important; gap: 16px !important; }
  .secondaryPageIntro__title { font-size: 44px !important; }
  .secondaryPageIntro__summary { font-size: 15px !important; }
  .secondaryPageIntro__actions { width: 100% !important; }
  .secondaryPageAction { flex: 1 1 0 !important; }
  .secondaryPageEvidence { grid-template-columns: 1fr !important; }
  .secondaryPageEvidence > * + * { border-left: 1px solid var(--sl-line) !important; }
}

@media (prefers-reduced-motion: reduce) {
  [data-shotlab-design="${VISUAL_SYSTEM_REBOOT_VERSION}"] *,
  body.mission-control-active * { animation-duration:.01ms !important; transition-duration:.01ms !important; }
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
