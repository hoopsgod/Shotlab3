import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const COACH_BEFORE = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;';
const COACH_AFTER = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} aria-current={active?"page":undefined} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;';
const PLAYER_BEFORE = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>switchTab(item.k)}><ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span></button>;';
const PLAYER_AFTER = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} aria-current={active?"page":undefined} onClick={()=>switchTab(item.k)}><ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span></button>;';
const COACH_HOME_BREAKPOINT_BEFORE = 'const DESKTOP_RAIL_MIN_WIDTH = 981;';
const COACH_HOME_BREAKPOINT_AFTER = 'const DESKTOP_RAIL_MIN_WIDTH = 1024;';
const COACH_HOME_NAV_BEFORE = '<nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} onClick={item.onClick}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>';
const COACH_HOME_NAV_AFTER = '<nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} aria-current={item.active?"page":undefined} onClick={item.onClick}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>';

function replaceOrVerify(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Phase 2 desktop workspace hardening could not locate ${label}.`);
  return source.replace(before, after);
}

export function applyPhase2DesktopWorkspaceHardening(source) {
  let next = String(source || "");
  next = replaceOrVerify(next, COACH_BEFORE, COACH_AFTER, "Coach desktop navigation");
  next = replaceOrVerify(next, PLAYER_BEFORE, PLAYER_AFTER, "Player desktop navigation");
  return next;
}

export function applyPhase2CoachHomeHardening(source) {
  let next = String(source || "");
  next = replaceOrVerify(next, COACH_HOME_BREAKPOINT_BEFORE, COACH_HOME_BREAKPOINT_AFTER, "Coach Home desktop breakpoint");
  next = replaceOrVerify(next, COACH_HOME_NAV_BEFORE, COACH_HOME_NAV_AFTER, "Coach Home desktop navigation semantics");
  return next;
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) {
  const appPath = path.resolve(process.cwd(), "src/App.jsx");
  const coachHomePath = path.resolve(process.cwd(), "src/components/CoachCommandCenter.jsx");
  const appSource = fs.readFileSync(appPath, "utf8");
  const coachHomeSource = fs.readFileSync(coachHomePath, "utf8");
  const nextApp = applyPhase2DesktopWorkspaceHardening(appSource);
  const nextCoachHome = applyPhase2CoachHomeHardening(coachHomeSource);
  if (nextApp !== appSource) fs.writeFileSync(appPath, nextApp);
  if (nextCoachHome !== coachHomeSource) fs.writeFileSync(coachHomePath, nextCoachHome);
  console.log("Phase 2 desktop workspace hardening applied.");
}
