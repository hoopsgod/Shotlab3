import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const titleCss = fs.readFileSync("src/components/CoachMissionControlTitleStage.css", "utf8");
const workspaceCss = fs.readFileSync("src/styles/DesktopHudlWorkspace2026.css", "utf8");

const desktopTitle = titleCss.match(/@media\(min-width:981px\)\{([\s\S]*?)\n\}/)?.[1] || "";

test("shared desktop workspace owns Coach rail geometry", () => {
  assert.doesNotMatch(desktopTitle, /grid-template-columns:208px minmax\(0,1fr\)/);
  assert.doesNotMatch(desktopTitle, /\.mcShellV3\{[^}]*\b(?:width|min-height|margin):/);
  assert.match(workspaceCss, /\.mcShellV3\.is-desktop-shell\s*\{[^}]*grid-template-columns:248px minmax\(0,1fr\)/);
  assert.match(workspaceCss, /\.mcShellV3\.is-desktop-shell\s*>\s*\.mcRail\s*\{[^}]*position:sticky/);
});

test("Coach Home keeps its route-specific desktop composition", () => {
  assert.match(desktopTitle, /\.missionControl\{[^}]*grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(desktopTitle, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][^{]*\{[^}]*grid-column:1\/10/);
  assert.match(desktopTitle, /\.mcTeamHealth\{[^}]*grid-column:10\/-1/);
});
