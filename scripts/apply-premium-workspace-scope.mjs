import fs from "node:fs";

const appPath = "src/App.jsx";
let source = fs.readFileSync(appPath, "utf8");

const importAnchor = 'import SemanticStatus from "./components/SemanticStatus.jsx";';
const workspaceImport = 'import "./styles/PremiumWorkspace.css";';
if (!source.includes(workspaceImport)) {
  if (!source.includes(importAnchor)) throw new Error("SemanticStatus import anchor missing");
  source = source.replace(importAnchor, `${importAnchor}\n${workspaceImport}`);
}

const playerRootBefore = 'return <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`}>\n{isDesktop&&<aside className="sidebar-nav" aria-label="Player navigation">';
const playerRootAfter = 'return <div className={`app-shell performance-shell performance-shell--player ${isDesktop?"is-desktop":"is-mobile"}`} data-workspace-tab={tab}>\n{isDesktop&&<aside className="sidebar-nav" aria-label="Player navigation">';
if (!source.includes(playerRootAfter)) {
  if (!source.includes(playerRootBefore)) throw new Error("Player shell anchor missing");
  source = source.replace(playerRootBefore, playerRootAfter);
}

const coachRootBefore = 'return <div className={`app-shell ${isDesktop?"is-desktop":"is-mobile"}`} data-text-scale={coachTextScale}>\n{isDesktop&&<aside className="sidebar-nav" aria-label="Coach navigation">';
const coachRootAfter = 'return <div className={`app-shell performance-shell performance-shell--coach ${isDesktop?"is-desktop":"is-mobile"}`} data-workspace-tab={tab} data-text-scale={coachTextScale}>\n{isDesktop&&<aside className="sidebar-nav" aria-label="Coach navigation">';
if (!source.includes(coachRootAfter)) {
  if (!source.includes(coachRootBefore)) throw new Error("Coach shell anchor missing");
  source = source.replace(coachRootBefore, coachRootAfter);
}

const pageRootBefore = 'className={`team-brand ${u.isCoach?"coach-mode ":""}page`}';
const pageRootAfter = 'className={`team-brand ${u.isCoach?"coach-mode ":""}page performance-workspace ${u.isCoach?"performance-workspace--coach":"performance-workspace--player"}`}';
if (!source.includes(pageRootAfter)) {
  const count = source.split(pageRootBefore).length - 1;
  if (count < 2) throw new Error(`Expected two team-brand page roots, found ${count}`);
  source = source.split(pageRootBefore).join(pageRootAfter);
}

fs.writeFileSync(appPath, source);
console.log("Applied premium workspace import and shell scopes.");
