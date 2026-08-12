import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase3r-player-progress-intelligence] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = "src/App.jsx";
let source = readFileSync(path, "utf8");
const marker = '<PlayerProgressStory userName={u.name}';

if (source.includes(marker)) {
  for (const preserved of [
    'data-testid="player-profile-workspace"',
    'testId="player-progress-full-profile"',
    '<ProfilePage u={u}',
    'onToggleLeaderboardVisibility={toggleLeaderboardVisibility}',
    'switchTab("log-drill")',
    'HTMLDetailsElement',
    'player-profile-readout',
    'DRILL TREND READOUT',
    'Drill momentum is {interpretedTrends.momentum}.',
    'Strength: {[...drills,...programDrills].find(',
  ]) if (!source.includes(preserved)) fail(`transformed profile route is missing ${preserved}`);
  console.log("Phase 3R Player Progress Story already applied.");
  process.exit(0);
}

if (!source.includes('data-testid="player-profile-readout"')) fail("Phase 3F Profile intelligence must be applied before Phase 3R.");

const importAnchor = 'import PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";\n';
requireOne(source, importAnchor, "PlayerCareerHistory import");
source = source.replace(importAnchor, `${importAnchor}import PlayerProgressStory from "./components/PlayerProgressStory.jsx";\n`);

const rawReadoutEyebrow = '>PLAYER READOUT</div>';
requireOne(source, rawReadoutEyebrow, "Phase 3F readout eyebrow");
source = source.replace(rawReadoutEyebrow, '>DRILL TREND READOUT</div>');

const rawMomentumReadout = '>Momentum is {interpretedTrends.momentum}.</div>';
requireOne(source, rawMomentumReadout, "Phase 3F momentum readout");
source = source.replace(rawMomentumReadout, '>Drill momentum is {interpretedTrends.momentum}.</div>');

const rawStrengthReadout = '<span>Strength: {interpretedTrends.strongestDrill}</span>';
requireOne(source, rawStrengthReadout, "Phase 3F strength readout");
const friendlyStrengthReadout = '<span>Strength: {[...drills,...programDrills].find((drill)=>String(drill?.id||drill?.drillId||drill?.drill_id||"")===String(interpretedTrends.strongestDrill))?.name||interpretedTrends.strongestDrill}</span>';
source = source.replace(rawStrengthReadout, friendlyStrengthReadout);

const routeAnchor = '{tab==="profile"&&<div className={slideClass} key="profile"><PlayerWorkspaceCommandBar model={profileWorkspaceModel} onAction={handlePlayerWorkspaceAction} onMetric={(metric)=>handlePlayerWorkspaceAction(metric?.action||{target:"profile"})} testId="player-profile-workspace"/><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scSessions={scSessions} scRsvps={scRsvps} scLogs={scLogs} seasonArchives={seasonArchives} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></div>}';
requireOne(source, routeAnchor, "Player Profile route");
const routeReplacement = `{tab==="profile"&&<div className={slideClass+" player-progress-story-route"} key="profile" data-testid="player-profile-workspace">
  <PlayerProgressStory userName={u.name} userEmail={u.email} teamId={u.teamId} shotLogs={shotLogs} scores={scores} programScores={programScores} drills={drills} programDrills={programDrills} streak={streak} coachPriorities={coachPriorities} today={today} onStartTraining={()=>switchTab("log-drill")} onOpenFullProfile={()=>{const details=document.querySelector('[data-testid="player-progress-full-profile"]');if(details instanceof HTMLDetailsElement)details.open=true;window.setTimeout(()=>document.querySelector('[data-testid="player-profile-readout"]')?.scrollIntoView({behavior:"smooth",block:"start"}),0)}}/>
  <ProgressiveDisclosure title="Full progress profile" summary="Report card, performance intelligence, drill development, history, and privacy" testId="player-progress-full-profile">
    <ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scSessions={scSessions} scRsvps={scRsvps} scLogs={scLogs} seasonArchives={seasonArchives} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/>
  </ProgressiveDisclosure>
</div>}`;
source = source.replace(routeAnchor, routeReplacement);

for (const preserved of [
  '<PlayerProgressStory userName={u.name}',
  'className={slideClass+" player-progress-story-route"}',
  'data-testid="player-profile-workspace"',
  'testId="player-progress-full-profile"',
  '<ProfilePage u={u}',
  'onToggleLeaderboardVisibility={toggleLeaderboardVisibility}',
  'switchTab("log-drill")',
  'details instanceof HTMLDetailsElement',
  'details.open=true',
  'DRILL TREND READOUT',
  'Drill momentum is {interpretedTrends.momentum}.',
  'Strength: {[...drills,...programDrills].find(',
  'player-profile-readout',
  'player-profile-performance-intelligence',
  'player-profile-drill-development',
]) if (!source.includes(preserved)) fail(`Player progress capability removed: ${preserved}`);

writeFileSync(path, source);
console.log("Applied Phase 3R Player Progress Story hierarchy.");
