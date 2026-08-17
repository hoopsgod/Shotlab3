import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3n-player-commitments] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');
const marker = 'PlayerCommitmentCenter mode="events"';

const stripRetiredEventsPresentation = (input) => {
  const panelStart = input.indexOf('function EventsPanel({events,rsvps,user,toggleRsvp,scores,drills,onCompletionCue}){');
  if (panelStart < 0) return input;
  let next = input;
  const presentationStart = next.indexOf('\n<div className="accent-card"', panelStart);
  const upcomingStart = presentationStart >= 0 ? next.indexOf('{/* Upcoming */}', presentationStart) : -1;
  if (presentationStart >= 0 && upcomingStart > presentationStart) {
    next = `${next.slice(0, presentationStart)}\n${next.slice(upcomingStart)}`;
  }
  next = next.replace(
    'const[expanded,setExpanded]=useState(null),[rankFx,setRankFx]=useState(false),[lastRank,setLastRank]=useState(null);',
    'const[expanded,setExpanded]=useState(null);',
  );
  next = next.replace('const nextEvent=upcoming[0]||null;\n', '');
  next = next.replace(/const myRsvps=rsvps\.filter\(r=>r\.email===user\.email\)\.length,myTier=getTier\(myRsvps\);useEffect\(\(\)=>\{if\(lastRank===null\)\{setLastRank\(myTier\.name\);return;\}if\(lastRank!==myTier\.name\)\{setRankFx\(true\);setLastRank\(myTier\.name\);const t=setTimeout\(\(\)=>setRankFx\(false\),650\);return \(\)=>clearTimeout\(t\);\}\},\[myTier\.name,lastRank\]\);\n/, '');
  return next;
};

if (source.includes(marker)) {
  source = stripRetiredEventsPresentation(source);
  for (const preserved of [
    'PlayerCommitmentCenter mode="strength"',
    'data-testid="player-events-operational-list"',
    'data-testid="player-strength-operational-panel"',
    '<EventsPanel events={events}',
    '<SCPanel sessions={scSessions}',
    'toggleRsvp={toggleRsvp}',
    'toggleScRsvp={toggleScRsvp}',
    'addScLog={addScLog}',
    '{/* Upcoming */}',
    'handleEventRsvp',
  ]) {
    if (!source.includes(preserved)) fail(`transformed Player Commitments source is missing ${preserved}`);
  }
  writeFileSync(path, source);
  console.log('Phase 3N Player Commitments hierarchy already applied; retired duplicate Events hero/rank presentation removed from the production candidate.');
  process.exit(0);
}

const importAnchor = 'import { PlayerWorkspaceCommandBar, PlayerWorkspaceEmptyState, PlayerWorkspaceFilterRail } from "./components/PlayerOperationalWorkspace.jsx";';
requireOne(source, importAnchor, 'PlayerOperationalWorkspace import');
source = source.replace(
  importAnchor,
  `${importAnchor}\nimport PlayerCommitmentCenter from "./components/PlayerCommitmentCenter.jsx";`,
);

const oldEvents = `  {tab==="program"&&<div className={slideClass} key="program"><PlayerWorkspaceCommandBar model={eventsWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-events-operational-list]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-events-workspace"/><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></div>}`;
requireOne(source, oldEvents, 'Player Events route');
const newEvents = `  {tab==="program"&&<div className={slideClass} key="program"><PlayerCommitmentCenter mode="events" model={eventsWorkspaceModel} items={events} responses={rsvps} user={u} today={today} onAction={handlePlayerWorkspaceAction}><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></PlayerCommitmentCenter></div>}`;
source = source.replace(oldEvents, newEvents);

const oldStrength = `  {tab==="sc"&&<div className={slideClass} key="sc"><PlayerWorkspaceCommandBar model={strengthWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={()=>document.querySelector("[data-testid=player-strength-operational-panel]")?.scrollIntoView({behavior:"smooth",block:"start"})} testId="player-strength-workspace"/><div data-testid="player-strength-operational-panel"><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div></div>}`;
requireOne(source, oldStrength, 'Player Strength route');
const newStrength = `  {tab==="sc"&&<div className={slideClass} key="sc"><PlayerCommitmentCenter mode="strength" model={strengthWorkspaceModel} items={scSessions} responses={scRsvps} logs={scLogs} user={u} today={today} onAction={handlePlayerWorkspaceAction}><div data-testid="player-strength-operational-panel"><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div></PlayerCommitmentCenter></div>}`;
source = source.replace(oldStrength, newStrength);
source = stripRetiredEventsPresentation(source);

for (const preserved of [
  'toggleRsvp={toggleRsvp}',
  'toggleScRsvp={toggleScRsvp}',
  'addScLog={addScLog}',
  'onCompletionCue={pushCompletionCue}',
  'data-testid="player-events-operational-list"',
  'data-testid="player-strength-operational-panel"',
]) {
  if (!source.includes(preserved)) fail(`Player commitment capability removed: ${preserved}`);
}

for (const retired of [
  'PlayerWorkspaceCommandBar model={eventsWorkspaceModel}',
  'PlayerWorkspaceCommandBar model={strengthWorkspaceModel}',
]) {
  if (source.includes(retired)) fail(`specialized commitment route still contains retired generic command bar: ${retired}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3N Player Commitments hierarchy.');
