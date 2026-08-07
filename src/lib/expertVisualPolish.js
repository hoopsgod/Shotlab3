const TEXT_ROLE_RULES = [
  { pattern: /^request data$/i, role: "utility" },
  { pattern: /^load demo data$/i, role: "demo-secondary" },
  { pattern: /^clear demo data$/i, role: "demo-destructive" },
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

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
