import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const COACH_BEFORE = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;';
const COACH_AFTER = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} aria-current={active?"page":undefined} onClick={()=>handleNavChange(item.k)}>{item.svg}<span>{item.l}</span></button>;';
const PLAYER_BEFORE = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} onClick={()=>switchTab(item.k)}><ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span></button>;';
const PLAYER_AFTER = 'return <button key={item.k} className={`nav-item ${active?"is-active":""}`} aria-current={active?"page":undefined} onClick={()=>switchTab(item.k)}><ShotLabIcon name={item.icon} size={22}/><span>{item.l}</span></button>;';

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

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) {
  const appPath = path.resolve(process.cwd(), "src/App.jsx");
  const source = fs.readFileSync(appPath, "utf8");
  const next = applyPhase2DesktopWorkspaceHardening(source);
  if (next !== source) fs.writeFileSync(appPath, next);
  console.log("Phase 2 desktop workspace hardening applied.");
}
