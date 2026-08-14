const TEXT_ROLE_RULES = [
  { pattern: /^request data$/i, role: "utility" },
  { pattern: /^load demo data$/i, role: "demo-secondary" },
  { pattern: /^clear demo data$/i, role: "demo-destructive" },
];

const COACH_HOME_TITLE_STAGE_CSS = String.raw`
@media(max-width:700px){
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .missionControl{padding:8px 12px 108px!important;gap:14px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeader{grid-template-columns:40px minmax(0,1fr) 40px!important;gap:9px!important;margin:0 7px -64px!important;padding:max(7px,env(safe-area-inset-top)) 3px 7px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcBrandLockup{gap:9px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeaderTeamMark{width:40px!important;height:40px!important;flex-basis:40px!important;border-radius:12px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeaderTeamMark img{width:42px!important;height:42px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcBrandCopy small{color:#9aabb2!important;font-size:9px!important;letter-spacing:.09em!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcBrandCopy strong{max-width:none!important;color:#f7fafb!important;-webkit-text-fill-color:#f7fafb!important;font-size:18px!important;font-weight:810!important;line-height:1!important;letter-spacing:-.045em!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeaderActions{display:block!important;width:40px!important;min-width:40px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcTeamSelect{display:none!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcBell{width:40px!important;height:40px!important;border-radius:13px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHero{min-height:356px!important;max-height:none!important;border:1px solid rgba(200,255,26,.16)!important;border-radius:30px 30px 30px 11px!important;background:radial-gradient(circle at 88% 7%,rgba(200,255,26,.16),transparent 29%),radial-gradient(circle at 5% 100%,rgba(64,116,137,.22),transparent 44%),linear-gradient(145deg,#0b2a38,#06151c 79%)!important;box-shadow:0 28px 62px rgba(7,24,32,.25),inset 0 1px rgba(255,255,255,.08)!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeroContent{grid-template-columns:minmax(0,1fr) 62px!important;padding:86px 18px 17px!important;gap:8px 11px!important;background:transparent!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeroTeamMark{top:80px!important;right:17px!important;width:62px!important;height:62px!important;opacity:.96!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeroTeamMark img{width:60px!important;height:60px!important;filter:drop-shadow(0 14px 22px rgba(0,0,0,.28))!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcDecisionIndex{display:none!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcEyebrow{color:#c8ff1a!important;-webkit-text-fill-color:#c8ff1a!important;font-size:10px!important;font-weight:780!important;letter-spacing:.115em!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHero h1{max-width:10.4ch!important;margin-top:8px!important;color:#f7fafb!important;-webkit-text-fill-color:#f7fafb!important;font-size:42px!important;font-weight:850!important;line-height:.91!important;letter-spacing:-.064em!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHeroContent>p{max-width:29ch!important;margin-top:8px!important;color:#b7c5cb!important;-webkit-text-fill-color:#b7c5cb!important;font-size:13.5px!important;line-height:1.42!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcRealityStrip{margin-top:11px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:18px 18px 18px 7px!important;background:rgba(255,255,255,.055)!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcRealityStrip>button{min-height:48px!important;padding:5px 4px!important;background:transparent!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcRealityStrip strong{color:#f7fafb!important;-webkit-text-fill-color:#f7fafb!important;font-size:20px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcRealityStrip small{color:#9fb0b7!important;-webkit-text-fill-color:#9fb0b7!important;font-size:9.5px!important}
html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcPrimary{min-height:52px!important;margin-top:11px!important;border-radius:16px 16px 16px 6px!important;background:linear-gradient(135deg,#c8ff1a,#aee800)!important;color:#071007!important;-webkit-text-fill-color:#071007!important;font-size:13.5px!important;font-weight:800!important}
}
@media(max-width:390px){html body.mission-control-active [data-mobile-visual-system="phase-2"].mcShellV3 .mcHero h1{font-size:37px!important}}
`;

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

function installCoachHomeTitleStage() {
  if (document.getElementById("shotlab-coach-home-title-stage")) return;
  const style = document.createElement("style");
  style.id = "shotlab-coach-home-title-stage";
  style.textContent = COACH_HOME_TITLE_STAGE_CSS;
  document.head.appendChild(style);
}

function isExplicitDemoRuntime() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "1"
    || params.get("mode") === "demo"
    || document.documentElement.classList.contains("shotlab-demo")
    || document.body?.classList.contains("shotlab-demo");
}

function classifyButtons(root = document) {
  for (const button of root.querySelectorAll?.("button") || []) {
    const label = normalize(button.textContent);
    const match = TEXT_ROLE_RULES.find((rule) => rule.pattern.test(label));
    if (!match) continue;
    button.dataset.visualRole = match.role;
    if (match.role === "demo-destructive") {
      button.hidden = !isExplicitDemoRuntime();
      button.setAttribute("aria-hidden", button.hidden ? "true" : "false");
    }
  }
}

function fixCopy(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const updates = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const next = node.nodeValue
      ?.replace(/\b1 player have no recorded activity\b/gi, "1 player has no recorded activity")
      .replace(/\b1 player have current-week activity\b/gi, "1 player has current-week activity");
    if (next && next !== node.nodeValue) updates.push([node, next]);
  }
  for (const [node, value] of updates) node.nodeValue = value;
}

function normalizeAddPlayerDescription(root = document) {
  for (const heading of root.querySelectorAll?.("h1,h2,h3,h4,[role='heading']") || []) {
    if (!/^add a player$/i.test(normalize(heading.textContent))) continue;
    const container = heading.closest("section,article,form,dialog,[role='dialog'],div");
    const description = container?.querySelector("p");
    if (description) description.dataset.visualRole = "description-copy";
  }
}

function condenseDuplicateTouchpoint(root = document) {
  for (const element of root.querySelectorAll?.("h1,h2,h3,strong") || []) {
    if (!/players? need(?:s)? a (?:coaching )?touchpoint/i.test(normalize(element.textContent))) continue;
    if (element.closest?.('[data-testid="coach-players-interactive-dashboard"]')) continue;
    const card = element.closest("article,section,div");
    if (!card || card.dataset.touchpointTeaser === "true") continue;
    card.dataset.touchpointTeaser = "true";
    element.textContent = "Roster follow-up ready";
    const detail = card.querySelector("p,small");
    if (detail) detail.textContent = "Open Players for the full attention queue and exact next actions.";
  }
}

function apply(root = document) {
  classifyButtons(root);
  fixCopy(root);
  normalizeAddPlayerDescription(root);
  condenseDuplicateTouchpoint(root);
}

export function installExpertVisualPolish() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabExpertVisualPolish) return true;
  window.__shotlabExpertVisualPolish = true;
  installCoachHomeTitleStage();
  apply(document);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) apply(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("shotlab:app-ready", () => apply(document));
  return true;
}
