import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');
let changed = false;

function replaceOptional(needle, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) {
    console.log(`Phase 4D desktop navigation preservation skipped ${label}; source shape is not present.`);
    return;
  }
  source = source.replace(needle, replacement);
  changed = true;
}

// The mobile heading pass intentionally removes duplicate top-level return rows from
// phone layouts. Preserve the established desktop workflow by restoring those controls
// behind the existing isDesktop boundary. Mobile remains clean because these nodes are
// never rendered there (and Coach also retains the CSS safety rule that hides the shared
// legacy control on mobile).
replaceOptional(
  '{tab==="log-drill"&&showShotStats&&!active&&<DashboardReturnButton onClick={()=>setShowShotStats(false)} label="Back to Training" />}',
  '{isDesktop&&tab!=="home"&&!active&&<DashboardReturnButton onClick={()=>switchTab("home")} label="Back to Dashboard" />}\n  {!isDesktop&&tab==="log-drill"&&showShotStats&&!active&&<DashboardReturnButton onClick={()=>setShowShotStats(false)} label="Back to Training" />}',
  'Player desktop return control',
);

replaceOptional(
  '{tab==="drills"&&!editD&&<div className="page pageShell fade-up" data-accent="drills" id="coach-drills-management" style={shellVars("drills")}><CoachPageDashboardHeader',
  '{tab==="drills"&&!editD&&<div className="page pageShell fade-up" data-accent="drills" id="coach-drills-management" style={shellVars("drills")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPageDashboardHeader',
  'Coach Drills desktop return control',
);

replaceOptional(
  '{tab==="events"&&<div className={`page pageShell fade-up ${isDesktop?"accent-card":"coach-events-mobile-surface"}`} data-accent="events" id="coach-events-management" style={isDesktop?shellVars("events"):{...shellVars("events"),padding:0,border:0,background:"transparent",boxShadow:"none"}}><CoachEventsInteractiveDashboard',
  '{tab==="events"&&<div className={`page pageShell fade-up ${isDesktop?"accent-card":"coach-events-mobile-surface"}`} data-accent="events" id="coach-events-management" style={isDesktop?shellVars("events"):{...shellVars("events"),padding:0,border:0,background:"transparent",boxShadow:"none"}}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachEventsInteractiveDashboard',
  'Coach Events desktop return control',
);

replaceOptional(
  '{tab==="activity"&&<div className="page pageShell fade-up" data-accent="feed" style={shellVars("feed")}><CoachPageDashboardHeader',
  '{tab==="activity"&&<div className="page pageShell fade-up" data-accent="feed" style={shellVars("feed")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPageDashboardHeader',
  'Coach Activity desktop return control',
);

replaceOptional(
  '{tab==="leaderboards"&&<div className="page pageShell fade-up" data-accent="feed" style={shellVars("feed")}><CoachPageDashboardHeader',
  '{tab==="leaderboards"&&<div className="page pageShell fade-up" data-accent="feed" style={shellVars("feed")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPageDashboardHeader',
  'Coach Leaderboards desktop return control',
);

replaceOptional(
  '{tab==="in-season"&&<div className="page pageShell fade-up" data-accent="in-season" style={shellVars("in-season")}><CoachPageDashboardHeader',
  '{tab==="in-season"&&<div className="page pageShell fade-up" data-accent="in-season" style={shellVars("in-season")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPageDashboardHeader',
  'Coach In Season desktop return control',
);

replaceOptional(
  '{tab==="players"&&!selP&&<div className="page pageShell" data-accent="players" style={shellVars("players")}><CoachPlayersInteractiveDashboard',
  '{tab==="players"&&!selP&&<div className="page pageShell" data-accent="players" style={shellVars("players")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPlayersInteractiveDashboard',
  'Coach Players desktop return control',
);

replaceOptional(
  '{tab==="sc"&&<div className="page pageShell fade-up" data-accent="sc" style={shellVars("sc")}><CoachPageDashboardHeader',
  '{tab==="sc"&&<div className="page pageShell fade-up" data-accent="sc" style={shellVars("sc")}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}<CoachPageDashboardHeader',
  'Coach S&C desktop return control',
);

replaceOptional(
  'actions={[{key:"branding",label:"Team Branding",onClick:openTeamBranding}]} testId="coach-administration-header"',
  'actions={[{key:"branding",label:"Team Branding",onClick:openTeamBranding},...(isDesktop?[{key:"home",label:"Back to Home",onClick:()=>setTab("feed")}]:[])]} testId="coach-administration-header"',
  'Coach Team & Account desktop return action',
);

const classMarker = 'className="shared-dashboard-back-action"';
if (source.includes(classMarker)) {
  if (changed) writeFileSync(appPath, source);
  console.log('Phase 4D shared dashboard back hit-area already applied; desktop return controls preserved.');
  process.exit(0);
}

const contentMarker = '<span aria-hidden="true">←</span>{label}';
const markerIndex = source.indexOf(contentMarker);
if (markerIndex < 0 || source.indexOf(contentMarker, markerIndex + contentMarker.length) >= 0) {
  throw new Error('Phase 4D expected exactly one shared dashboard back-control template marker.');
}

const buttonStart = source.lastIndexOf('<button', markerIndex);
if (buttonStart < 0 || markerIndex - buttonStart > 2200) {
  throw new Error('Phase 4D could not safely resolve the shared dashboard back-control button.');
}

const buttonEnd = source.indexOf('</button>', markerIndex);
if (buttonEnd < 0) {
  throw new Error('Phase 4D could not resolve the end of the shared dashboard back-control button.');
}

let buttonSource = source.slice(buttonStart, buttonEnd + '</button>'.length);
const paddingMarker = 'padding:"9px 14px"';
if (!buttonSource.includes(paddingMarker) || buttonSource.indexOf(paddingMarker) !== buttonSource.lastIndexOf(paddingMarker)) {
  throw new Error('Phase 4D expected one 9px/14px padding contract inside the shared back-control template.');
}

buttonSource = buttonSource.replace('<button', '<button className="shared-dashboard-back-action"');
buttonSource = buttonSource.replace(
  paddingMarker,
  'minHeight:44,padding:"9px 14px",touchAction:"manipulation"',
);

source = source.slice(0, buttonStart) + buttonSource + source.slice(buttonEnd + '</button>'.length);
writeFileSync(appPath, source);
console.log('Applied Phase 4D shared dashboard back hit-area correction with desktop return-control preservation.');
