const STYLE_ID = "shotlab-phase1-evidence-closure";
const ROSTER_ROOT = "#coach-roster-operations";
const ROSTER_ROW = `${ROSTER_ROOT} > .fade-up > div[role="button"], ${ROSTER_ROOT} > div[role="button"]`;
const QUEUED_INDEX = '[aria-label^="Queued action "]';
const FINAL_A11Y_MARKER = "/* phase1-final-a11y */";
const COACH_MOBILE_PARITY_MARKER = "/* coach-mobile-production-parity */";
const FINAL_A11Y_CSS = `${FINAL_A11Y_MARKER}
[data-testid="auth-workspace"]>.fade-up,[data-testid="auth-workspace"] .auth-card-enter{animation:none!important;transition:none!important;opacity:1!important;transform:none!important;filter:none!important}
[data-testid="auth-workspace"] button,[data-testid="auth-workspace"] input,[data-testid="auth-workspace"] a{opacity:1!important;filter:none!important}
[data-testid="auth-workspace"] input::placeholder{color:#465159!important;opacity:1!important}
[data-testid="auth-workspace"] a[href$="privacy"]{color:#35434c!important;-webkit-text-fill-color:#35434c!important}
[data-testid="coach-players-interactive-dashboard"] .teamIdentityTitleStage__action--primary{color:#f8fbf6!important;-webkit-text-fill-color:#f8fbf6!important}
${COACH_MOBILE_PARITY_MARKER}
@media(max-width:700px){
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHeader[data-testid="mission-control-team-header"]{display:none!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"]{min-height:334px!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroContent{min-height:334px!important;padding:20px 18px 18px!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroIdentity{--coach-hero-crest:clamp(80px,21vw,92px)!important;gap:12px!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark{width:var(--coach-hero-crest)!important;height:var(--coach-hero-crest)!important;min-width:var(--coach-hero-crest)!important;min-height:var(--coach-hero-crest)!important;max-width:var(--coach-hero-crest)!important;max-height:var(--coach-hero-crest)!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcProgramIdentity{font:780 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif!important;letter-spacing:.075em!important;text-transform:uppercase!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcEyebrow{font:720 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif!important;letter-spacing:.055em!important;text-transform:uppercase!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] h1{max-width:15ch!important;margin:12px 0 0!important;font-family:"Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif!important;font-size:clamp(36px,9.4vw,40px)!important;font-weight:800!important;line-height:.94!important;letter-spacing:-.02em!important;text-wrap:balance!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroContent>p{max-width:36ch!important;margin:7px 0 0!important;font:520 14px/1.42 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcRealityStrip{margin-top:13px!important}
 body.mission-control-active .mcShellV3.is-mobile-shell .mcHero[data-team-identity-stage="coach-mission-control"] .mcPrimary{margin-top:11px!important}
}`;

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function ensureStyles() {
  if (!document.head) return false;
  const style = document.getElementById(STYLE_ID);
  if (!style) return false;
  if (!style.textContent.includes(FINAL_A11Y_MARKER)) style.textContent += `\n${FINAL_A11Y_CSS}\n`;
  else if (!style.textContent.includes(COACH_MOBILE_PARITY_MARKER)) style.textContent += `\n${FINAL_A11Y_CSS.slice(FINAL_A11Y_CSS.indexOf(COACH_MOBILE_PARITY_MARKER))}\n`;
  if (document.head.lastElementChild !== style) document.head.appendChild(style);
  return true;
}

function ensureRosterProfileButton(row) {
  if (!(row instanceof HTMLElement)) return false;
  const nestedControls = row.querySelectorAll("button, a[href], input, select, textarea");
  if (!nestedControls.length) return false;

  const details = row.children?.[1]?.children?.[1];
  const name = cleanText(details?.querySelector?.("span")?.textContent)
    || cleanText(row.querySelector("strong")?.textContent)
    || "player";
  row.classList.add("phase1RosterRow");
  row.removeAttribute("role");
  row.removeAttribute("tabindex");
  row.dataset.phase1RosterRow = "true";

  const existingButton = row.querySelector('[data-phase1-open-profile="true"]');
  if (existingButton) return true;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.phase1OpenProfile = "true";
  button.className = "phase1RosterProfileAction";
  button.setAttribute("aria-label", `Open ${name} profile`);
  button.textContent = "PROFILE";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    row.click();
  });

  const content = row.lastElementChild;
  const actionColumn = content instanceof HTMLElement ? content.lastElementChild : null;
  if (actionColumn instanceof HTMLElement && actionColumn.querySelector("button")) actionColumn.appendChild(button);
  else row.appendChild(button);
  return true;
}

function normalizeQueuedActionMarkers(root = document) {
  let changed = false;
  for (const node of root.querySelectorAll?.(QUEUED_INDEX) || []) {
    if (!(node instanceof HTMLElement)) continue;
    node.removeAttribute("aria-label");
    node.setAttribute("aria-hidden", "true");
    changed = true;
  }
  return changed;
}

function normalizeRosterRows(root = document) {
  let changed = false;
  for (const row of root.querySelectorAll?.(ROSTER_ROW) || []) changed = ensureRosterProfileButton(row) || changed;
  return changed;
}

function applyPhase1EvidenceClosure(root = document) {
  ensureStyles();
  normalizeQueuedActionMarkers(root);
  normalizeRosterRows(root);
}

export function installPhase1EvidenceClosure() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabPhase1EvidenceClosureInstalled) return true;
  window.__shotlabPhase1EvidenceClosureInstalled = true;

  let frame = null;
  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      applyPhase1EvidenceClosure(document);
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("focus", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
  return true;
}

installPhase1EvidenceClosure();
