import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3n-player-commitments] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');
const marker = 'PlayerCommitmentCenter mode="events"';
const promotedEvents = '<PlayerCommitmentCenter mode="events" model={eventsWorkspaceModel} items={events} responses={rsvps} user={u} today={today} onAction={handlePlayerWorkspaceAction} toggleRsvp={toggleRsvp} onCompletionCue={pushCompletionCue}/>';

const promoteSourceOwnedEvents = (input) => {
  let next = input;
  const legacyRoute = '<PlayerCommitmentCenter mode="events" model={eventsWorkspaceModel} items={events} responses={rsvps} user={u} today={today} onAction={handlePlayerWorkspaceAction}><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></PlayerCommitmentCenter>';
  if (next.includes(legacyRoute)) next = next.replace(legacyRoute, promotedEvents);
  else if (!next.includes(promotedEvents)) fail('source-owned Player Events route contract was not found');

  const panelStart = next.indexOf('function EventsPanel({events,rsvps,user,toggleRsvp,scores,drills,onCompletionCue}){');
  if (panelStart >= 0) {
    const strengthStart = next.indexOf('function SCPanel(', panelStart);
    if (strengthStart < 0) fail('could not locate SCPanel boundary after retired EventsPanel');
    const eventsSectionStart = next.lastIndexOf('// ═══════════════════════════════════════', panelStart);
    const strengthSectionStart = next.lastIndexOf('// ═══════════════════════════════════════', strengthStart);
    if (eventsSectionStart < 0 || strengthSectionStart <= eventsSectionStart) fail('could not locate stable Player panel section boundaries');
    next = `${next.slice(0, eventsSectionStart)}${next.slice(strengthSectionStart)}`;
  }
  return next;
};

if (source.includes(marker)) {
  source = promoteSourceOwnedEvents(source);
  for (const preserved of [
    'PlayerCommitmentCenter mode="strength"',
    'data-testid="player-strength-operational-panel"',
    '<SCPanel sessions={scSessions}',
    'toggleRsvp={toggleRsvp}',
    'onCompletionCue={pushCompletionCue}',
    'toggleScRsvp={toggleScRsvp}',
    'addScLog={addScLog}',
  ]) if (!source.includes(preserved)) fail(`transformed Player Commitments source is missing ${preserved}`);
  if (source.includes('function EventsPanel(') || source.includes('player-events-operational-list')) fail('retired duplicate Player Events presentation remains');
  writeFileSync(path, source);
  console.log('Phase 3N Player Commitments hierarchy already applied; premium Player Events now owns schedule, detail, and RSVP presentation.');
  process.exit(0);
}

const importAnchor = 'import { PlayerWorkspaceCommandBar, PlayerWorkspaceEmptyState, PlayerWorkspaceFilterRail } from "./components/PlayerOperationalWorkspace.jsx";';
requireOne(source, importAnchor, 'PlayerOperationalWorkspace import');
source = source.replace(importAnchor, `${importAnchor}\nimport PlayerCommitmentCenter from "./components/PlayerCommitmentCenter.jsx";`);

const oldEvents = `  {tab==="program"&&<div className={slideClass} key="program"><PlayerWorkspaceCommandBar model={eventsWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-events-operational-list]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-events-workspace"/><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></div>}`;
requireOne(source, oldEvents, 'Player Events route');
source = source.replace(oldEvents, `  {tab==="program"&&<div className={slideClass} key="program">${promotedEvents}</div>}`);

const oldStrength = `  {tab==="sc"&&<div className={slideClass} key="sc"><PlayerWorkspaceCommandBar model={strengthWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-strength-operational-panel]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-strength-workspace"/><div data-testid="player-strength-operational-panel"><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div></div>}`;
requireOne(source, oldStrength, 'Player Strength route');
const newStrength = `  {tab==="sc"&&<div className={slideClass} key="sc"><PlayerCommitmentCenter mode="strength" model={strengthWorkspaceModel} items={scSessions} responses={scRsvps} logs={scLogs} user={u} today={today} onAction={handlePlayerWorkspaceAction}><div data-testid="player-strength-operational-panel"><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div></PlayerCommitmentCenter></div>}`;
source = source.replace(oldStrength, newStrength);
source = promoteSourceOwnedEvents(source);

for (const preserved of ['toggleRsvp={toggleRsvp}','onCompletionCue={pushCompletionCue}','toggleScRsvp={toggleScRsvp}','addScLog={addScLog}','data-testid="player-strength-operational-panel"']) {
  if (!source.includes(preserved)) fail(`Player commitment capability removed: ${preserved}`);
}
for (const retired of ['PlayerWorkspaceCommandBar model={eventsWorkspaceModel}','PlayerWorkspaceCommandBar model={strengthWorkspaceModel}','function EventsPanel(','player-events-operational-list']) {
  if (source.includes(retired)) fail(`retired Player commitment presentation remains: ${retired}`);
}
writeFileSync(path, source);
console.log('Applied Phase 3N Player Commitments hierarchy with source-owned Player Events.');