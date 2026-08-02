import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { buildCoachResponseContext, setCoachResponseContext } from "./coachPlayerResponseLoop.js";

const STYLE_ID = "shotlab-coach-response-loop-styles";
const ROW_SELECTOR = '[data-testid="coach-live-activity"] .mcTimeline > div';
const PLAYER_DRAWER_SELECTOR = '[data-testid="coach-player-intelligence-drawer"]';
const PLAYER_STATS_ROW_SELECTOR = '#coach-roster-operations [role="button"]';
const PLAYER_DRAWER_RECOVERY_DELAYS = [650, 1500, 2800, 4500];

const styles = `
.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]{position:relative;cursor:pointer;touch-action:manipulation;transition:border-color 150ms ease,background 150ms ease,transform 150ms ease}
.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]::after{content:"Review →";margin-left:auto;color:var(--mc,#c8ff1a);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:hover,.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:focus-visible{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 34%,rgba(255,255,255,.08));background:color-mix(in srgb,var(--mc,#c8ff1a) 5%,rgba(255,255,255,.018));outline:none;transform:translateY(-1px)}
.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:active{transform:scale(.992)}
@media(max-width:420px){.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]::after{content:"Open →"}}
@media(prefers-reduced-motion:reduce){.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]{transition:none}.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:hover,.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:focus-visible,.mcActivity .mcTimeline>div[data-shotlab-response-row="true"]:active{transform:none}}
`;

const clean = (value) => String(value ?? "").trim();
const normalize = (value) => clean(value).toLowerCase().replace(/\s+/g, " ");

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function readLiveResultRow(row) {
  const playerName = clean(row?.querySelector?.("strong")?.textContent);
  const detail = clean(row?.querySelector?.("small")?.textContent);
  const meta = clean(row?.querySelector?.("time")?.textContent);
  const normalizedName = normalize(playerName);
  const actionable = Boolean(playerName && detail)
    && normalizedName !== "team"
    && !/athletes? active|player activity/i.test(normalizedName)
    && /(home shots?|shooting|drill score|score|strength|s&c|makes?|logged|completed)/i.test(detail);
  return { actionable, playerName, detail, meta };
}

export function findPlayerStatsRow(root, playerName) {
  const targetName = normalize(playerName);
  if (!root?.querySelectorAll || !targetName) return null;
  const rows = [...root.querySelectorAll(PLAYER_STATS_ROW_SELECTOR)];
  return rows.find((row) => {
    const heading = normalize(row?.querySelector?.("strong")?.textContent);
    if (heading) return heading === targetName;
    return normalize(row?.textContent).includes(targetName);
  }) || null;
}

export function ensurePlayerStatsDrawerOpens(playerName, target = window, root = document) {
  if (!target?.setTimeout || !root?.querySelector || !root?.body) return false;
  if (root.querySelector(PLAYER_DRAWER_SELECTOR)) return true;

  let complete = false;
  const timers = [];
  const finish = () => {
    if (complete) return;
    complete = true;
    for (const timer of timers) target.clearTimeout?.(timer);
    observer?.disconnect?.();
  };
  const observer = target.MutationObserver ? new target.MutationObserver(() => {
    if (root.querySelector(PLAYER_DRAWER_SELECTOR)) finish();
  }) : null;
  observer?.observe?.(root.body, { childList: true, subtree: true });

  const recover = () => {
    if (complete) return;
    if (root.querySelector(PLAYER_DRAWER_SELECTOR)) {
      finish();
      return;
    }
    findPlayerStatsRow(root, playerName)?.click?.();
  };

  for (const delay of PLAYER_DRAWER_RECOVERY_DELAYS) timers.push(target.setTimeout(recover, delay));
  timers.push(target.setTimeout(finish, PLAYER_DRAWER_RECOVERY_DELAYS.at(-1) + 1800));
  return true;
}

export function openLiveResultResponse(row) {
  const result = readLiveResultRow(row);
  if (!result.actionable) return false;
  const context = setCoachResponseContext(buildCoachResponseContext({
    playerIdentity: result.playerName,
    playerName: result.playerName,
    detail: result.detail,
    meta: result.meta,
  }));
  if (!context) return false;
  const opened = openExactPlayerFollowUp({ searchIdentity: result.playerName, name: result.playerName });
  ensurePlayerStatsDrawerOpens(result.playerName);
  return opened;
}

function markRows() {
  for (const row of document.querySelectorAll(ROW_SELECTOR)) {
    const result = readLiveResultRow(row);
    if (!result.actionable) {
      row.removeAttribute("data-shotlab-response-row");
      row.removeAttribute("role");
      row.removeAttribute("tabindex");
      row.removeAttribute("aria-label");
      continue;
    }
    row.dataset.shotlabResponseRow = "true";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-label", `Review ${result.playerName} result and record next assignment`);
  }
}

export function installCoachResponseLoopEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachResponseLoopEnhancer) return true;
  window.__shotlabCoachResponseLoopEnhancer = true;
  ensureStyles();

  document.addEventListener("click", (event) => {
    const row = event.target?.closest?.(`${ROW_SELECTOR}[data-shotlab-response-row="true"]`);
    if (row) openLiveResultResponse(row);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target?.closest?.(`${ROW_SELECTOR}[data-shotlab-response-row="true"]`);
    if (!row) return;
    event.preventDefault();
    openLiveResultResponse(row);
  }, true);

  let frame = null;
  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      markRows();
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener("focus", schedule);
  schedule();
  return true;
}
