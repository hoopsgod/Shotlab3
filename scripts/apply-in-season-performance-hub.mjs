import { readFileSync, writeFileSync } from "node:fs";

const path = "src/App.jsx";
const sourcePath = path;
let source = readFileSync(sourcePath, "utf8");

const fail = (message) => { throw new Error(`[in-season-performance-hub] ${message}`); };
const count = (needle) => source.split(needle).length - 1;
const replaceOne = (before, after, label) => {
  const found = count(before);
  if (found !== 1) fail(`${label}: expected one anchor, found ${found}`);
  source = source.replace(before, after);
};
const requireContains = (needle, label) => { if (!source.includes(needle)) fail(`${label} missing`); };

if (source.includes('data-testid="in-season-performance-hub-route"')) {
  for (const expected of [
    'import InSeasonPerformanceHub from "./components/InSeasonPerformanceHub.jsx";',
    '"in-season":"/in-season"',
    'updateProgramDrill={updateProgramDrill}',
    'getCoachNavItem("in-season"',
    'getPlayerNavItem("in-season"',
    'customProgramDrillCount>=30',
  ]) requireContains(expected, expected);
  console.log("In-season performance hub already applied.");
  process.exit(0);
}

replaceOne(
  'import PremiumLeaderboardsHub from "./components/PremiumLeaderboardsHub";',
  'import PremiumLeaderboardsHub from "./components/PremiumLeaderboardsHub";\nimport InSeasonPerformanceHub from "./components/InSeasonPerformanceHub.jsx";',
  "InSeasonPerformanceHub import",
);

replaceOne(
  'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",leaderboards:"/leaderboards",profile:"/profile",players:"/players"};',
  'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu","in-season":"/in-season",sc:"/lifting",program:"/events",leaderboards:"/leaderboards",profile:"/profile",players:"/players"};',
  "player route registry",
);
replaceOne(
  'const PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/leaderboards":"leaderboards","/profile":"profile","/players":"players"};',
  'const PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/in-season":"in-season","/lifting":"sc","/events":"program","/leaderboards":"leaderboards","/profile":"profile","/players":"players"};',
  "player reverse route registry",
);

replaceOne(
  'const getPlayerNavItem=(key,overrides={})=>{const item=playerNavItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};',
  'playerNavItems.splice(3,0,{k:"in-season",l:"In Season",group:"program",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="M4 5h4M10 2h4M16 8h4"/></svg>});\nconst getPlayerNavItem=(key,overrides={})=>{const item=playerNavItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};',
  "player nav item",
);
replaceOne(
  'const playerMobileSecondaryItems=[\n  getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"}),',
  'const playerMobileSecondaryItems=[\n  getPlayerNavItem("in-season",{mobileLabel:"In Season",group:"program",description:"Team drills, game stats, and program records"}),\n  getPlayerNavItem("program",{mobileLabel:"Events",description:"Team schedule and RSVPs"}),',
  "player mobile secondary navigation",
);

replaceOne(
  'const updateDrill=async(id,up)=>{if(user?.role!=="coach")return;return persistTrainingCatalog(drills.map(d=>d.id===id?{...d,...up}:d),programDrills)};',
  'const updateDrill=async(id,up)=>{if(user?.role!=="coach")return;return persistTrainingCatalog(drills.map(d=>d.id===id?{...d,...up}:d),programDrills)};\nconst updateProgramDrill=async(id,up)=>{if(user?.role!=="coach")return{ok:false,err:"Not authorized"};return persistTrainingCatalog(drills,programDrills.map(d=>String(d.id)===String(id)?{...d,...up}:d))};',
  "program drill update helper",
);
replaceOne(
  'const addProgramDrill=async(drill)=>{if(user?.role!=="coach")return{ok:false,err:"Not authorized"};if(countCustomProgramDrills(programDrills)>=7)return{ok:false,err:"Program drill limit reached (7 custom drills)."};return persistTrainingCatalog(drills,[...programDrills,{...drill,id:Date.now()}])};',
  'const addProgramDrill=async(drill)=>{if(user?.role!=="coach")return{ok:false,err:"Not authorized"};if(countCustomProgramDrills(programDrills)>=30)return{ok:false,err:"Program drill limit reached (30 custom drills)."};return persistTrainingCatalog(drills,[...programDrills,{...drill,id:Date.now()}])};',
  "custom program drill capacity",
);
source = source.replaceAll('${customProgramDrillCount}/7', '${customProgramDrillCount}/30');
source = source.replaceAll('customProgramDrillCount>=7', 'customProgramDrillCount>=30');
source = source.replace('The 7 demo defaults are seeded automatically. Coaches can still add up to 7 custom program drills for player score tracking and per-drill team leaderboards.', 'The ShotLab defaults are seeded automatically. Coaches can add up to 30 custom program drills for in-season standards, player score tracking, and per-drill leaderboards.');

replaceOne(
  'function Coach({u,team,regenerateJoinCode,addRosterPlayer,removeRosterPlayer,archiveRosterPlayer,deleteTeamLocalRosterPlayerData,archiveSeason,seasonArchives=[],playerProfiles,drills,programDrills,scores,programScores=[],players,addCoachProgramScore,updateDrill,addDrill,removeDrill,addProgramDrill,removeProgramDrill,events,rsvps,addEvent,removeEvent,removeRsvp,addRsvp,scSessions,scRsvps,scLogs=[],addScSession,removeScSession,shotLogs,coachHomeLeaderboardRows=[],coachPriorities,onSaveCoachPriorities,logout,deleteAccount,openTeamBranding,coachTextSize="standard",accountCapabilities, demoSettingsBusy=false,onLoadDemoData,onClearDemoData,homeShotsLeaderboard,refreshHomeShotsLeaderboard}){',
  'function Coach({u,team,regenerateJoinCode,addRosterPlayer,removeRosterPlayer,archiveRosterPlayer,deleteTeamLocalRosterPlayerData,archiveSeason,seasonArchives=[],playerProfiles,drills,programDrills,scores,programScores=[],players,addCoachProgramScore,updateDrill,addDrill,removeDrill,addProgramDrill,updateProgramDrill,removeProgramDrill,events,rsvps,addEvent,removeEvent,removeRsvp,addRsvp,scSessions,scRsvps,scLogs=[],addScSession,removeScSession,shotLogs,coachHomeLeaderboardRows=[],coachPriorities,onSaveCoachPriorities,logout,deleteAccount,openTeamBranding,coachTextSize="standard",accountCapabilities, demoSettingsBusy=false,onLoadDemoData,onClearDemoData,homeShotsLeaderboard,refreshHomeShotsLeaderboard}){',
  "Coach program drill update prop",
);
replaceOne(
  'const coachTabs=["feed","drills","events","sc","players","activity"];',
  'const coachTabs=["feed","drills","in-season","events","sc","players","activity"];',
  "coach tab registry",
);
replaceOne(
  'const getCoachNavItem=(key,overrides={})=>{const item=navItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};',
  'navItems.splice(2,0,{k:"in-season",l:"In Season",group:"program",accentVar:"--accent-drills",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="M4 5h4M10 2h4M16 8h4"/></svg>});\nconst getCoachNavItem=(key,overrides={})=>{const item=navItems.find(candidate=>candidate.k===key);return item?{...item,...overrides}:null;};',
  "coach nav item",
);
replaceOne(
  '  getCoachNavItem("drills",{mobileLabel:"Drills",description:"Drill library and assignments"}),',
  '  getCoachNavItem("drills",{mobileLabel:"Drills",description:"Drill library and assignments"}),\n  getCoachNavItem("in-season",{mobileLabel:"In Season",group:"program",description:"Team drills, verified scores, and game-stat imports"}),',
  "coach mobile secondary navigation",
);
replaceOne(
  'data-accent={u.isCoach&&["feed","drills","events","sc","players","activity"].includes(tab)?(tab==="activity"?"feed":tab):"feed"}',
  'data-accent={u.isCoach&&["feed","drills","in-season","events","sc","players","activity"].includes(tab)?(tab==="activity"?"feed":tab==="in-season"?"drills":tab):"feed"}',
  "coach in-season accent",
);

replaceOne(
  '  {tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">',
  '  {tab==="in-season"&&!active&&<div className={slideClass} key="in-season" data-testid="in-season-performance-hub-route"><InSeasonPerformanceHub role="player" user={u} team={team} programDrills={programDrills} programScores={programScores} players={players} seasonArchives={seasonArchives} addScore={addScore}/></div>}\n\n  {tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">',
  "player In Season route",
);

replaceOne(
  '  {/** DRILLS */}',
  '  {/* IN SEASON PERFORMANCE HUB */}\n  {tab==="in-season"&&<div className="page pageShell fade-up" data-accent="drills" style={shellVars("drills")} data-testid="coach-in-season-performance-hub-route"><DashboardReturnButton onClick={()=>setTab("feed")} /><InSeasonPerformanceHub role="coach" user={u} team={team} programDrills={programDrills} programScores={safeProgramScores} players={coachRosterPlayers} seasonArchives={seasonArchives} addProgramDrill={addProgramDrill} updateProgramDrill={updateProgramDrill} removeProgramDrill={removeProgramDrill} onOpenCoachScoreEntry={()=>setShowProgramScoreEntry(true)}/></div>}\n\n  {/** DRILLS */}',
  "coach In Season route",
);

replaceOne(
  'addProgramDrill={addProgramDrill} removeProgramDrill={removeProgramDrill}',
  'addProgramDrill={addProgramDrill} updateProgramDrill={updateProgramDrill} removeProgramDrill={removeProgramDrill}',
  "AppInner Coach updateProgramDrill prop",
);

for (const expected of [
  'data-testid="in-season-performance-hub-route"',
  'data-testid="coach-in-season-performance-hub-route"',
  'updateProgramDrill={updateProgramDrill}',
  'getCoachNavItem("in-season"',
  'getPlayerNavItem("in-season"',
  'customProgramDrillCount>=30',
]) requireContains(expected, expected);

writeFileSync(sourcePath, source);
console.log("Applied In Season performance hub route integration.");
