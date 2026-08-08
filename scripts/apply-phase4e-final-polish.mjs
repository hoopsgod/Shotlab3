import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4e-final-polish] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
};
const requirePattern = (source, pattern, label) => {
  if (!pattern.test(source)) fail(`${label}: required pattern missing`);
};

const appHeader = readFileSync("src/components/AppHeader.jsx", "utf8");
for (const expected of [
  "minHeight: 44",
  "minWidth: 44",
  'overflowWrap: "break-word"',
]) {
  if (!appHeader.includes(expected)) fail(`AppHeader final-polish contract missing: ${expected}`);
}

const hierarchy = readFileSync("src/components/VisualHierarchy.module.css", "utf8");
for (const expected of [
  ".quietAction { min-height: 44px",
  ".objectiveTitle { font-size: 34px; max-width: 100%;",
  ".quietHeader { flex-wrap: wrap; }",
]) {
  if (!hierarchy.includes(expected)) fail(`VisualHierarchy final-polish contract missing: ${expected}`);
}

const authority = readFileSync("public/shotlab-phase4e-final-polish.css", "utf8");
for (const expected of [
  "--phase4e-mobile-gutter",
  "--phase4e-dock-clearance",
  ".performance-shell .appHeaderAction",
  'data-testid="player-workspace-empty-state"',
]) {
  if (!authority.includes(expected)) fail(`Phase 4E authority missing: ${expected}`);
}
requirePattern(authority, /@media\s*\(max-width:\s*820px\)/, "Phase 4E mobile authority");

const indexPath = "index.html";
let index = readFileSync(indexPath, "utf8");
if (!index.includes('shotlab-phase4e-final-polish')) {
  const anchor = '  <link id="shotlab-phase4d-state-reconciliation" rel="stylesheet" href="/shotlab-phase4d-state-reconciliation.css" />';
  requireOne(index, anchor, "Phase 4D stylesheet link");
  index = index.replace(anchor, `${anchor}\n  <link id="shotlab-phase4e-final-polish" rel="stylesheet" href="/shotlab-phase4e-final-polish.css" />`);
  writeFileSync(indexPath, index);
}

console.log("Applied Phase 4E final cross-screen polish.");
