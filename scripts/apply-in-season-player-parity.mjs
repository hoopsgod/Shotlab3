import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const APP_PATH = "src/App.jsx";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  return source.replace(before, after);
}

export function applyInSeasonPlayerParity(rawSource) {
  const lineEnding = rawSource.includes("\r\n") ? "\r\n" : "\n";
  let source = rawSource.replace(/\r\n/g, "\n");

  const pathBefore = 'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",leaderboards:"/leaderboards",profile:"/profile",players:"/players"};\nconst PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/leaderboards":"leaderboards","/profile":"profile","/players":"players"};';
  const pathAfter = 'const PLAYER_TAB_PATHS={home:"/",duels:"/program-log","log-drill":"/quick-menu",sc:"/lifting",program:"/events",leaderboards:"/leaderboards","in-season":"/in-season",profile:"/profile",players:"/players"};\nconst PLAYER_PATH_TABS={"/":"home","/duels":"duels","/program-log":"duels","/quick-menu":"log-drill","/lifting":"sc","/events":"program","/leaderboards":"leaderboards","/in-season":"in-season","/profile":"profile","/players":"players"};';
  if (!source.includes('"in-season":"/in-season"')) source = replaceOnce(source, pathBefore, pathAfter, "player In Season path mapping");

  const navBefore = '  {k:"profile",l:"Profile",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},\n];\nconst getPlayerNavItem=';
  const navAfter = '  {k:"in-season",l:"In Season",accentVar:"--accent-events",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3-3 3 2 5-7"/><path d="M15 7h4v4"/></svg>},\n  {k:"profile",l:"Profile",accentVar:"--accent-players",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},\n];\nconst getPlayerNavItem=';
  if (!source.includes('{k:"in-season",l:"In Season"')) source = replaceOnce(source, navBefore, navAfter, "player In Season navigation item");

  const secondaryBefore = '  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},\n  getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"}),';
  const secondaryAfter = '  {k:"leaderboards",l:"Leaderboards",mobileLabel:"Rankings",description:"Current and all-time team rankings",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>},\n  getPlayerNavItem("in-season",{mobileLabel:"In Season",mobileIcon:"chart",group:"performance",description:"Team drill records, school leaderboards, and game stats"}),\n  getPlayerNavItem("team-store",{mobileLabel:"Team Store",description:"Official team apparel and fan gear"}),';
  if (!source.includes('getPlayerNavItem("in-season"')) source = replaceOnce(source, secondaryBefore, secondaryAfter, "player mobile In Season navigation");

  const routeBefore = '  </div>}\n\n  {/* ═════ SHOT STATS sub-screen ═════ */}';
  const routeAfter = '  </div>}\n\n  {tab==="in-season"&&!active&&<div className={slideClass} key="in-season" data-testid="player-in-season-workspace">\n    <InSeasonPerformanceHub role="player" user={u} team={team} programDrills={programDrills} programScores={teamProgramScores} players={playerLeaderboardPlayers} seasonArchives={seasonArchives} addScore={addScore} />\n  </div>}\n\n  {/* ═════ SHOT STATS sub-screen ═════ */}';
  if (!source.includes('data-testid="player-in-season-workspace"')) source = replaceOnce(source, routeBefore, routeAfter, "player In Season workspace mount");

  return source.replace(/\n/g, lineEnding);
}

export function applyInSeasonPlayerParityFile(appPath = path.resolve(process.cwd(), APP_PATH)) {
  const rawSource = readFileSync(appPath, "utf8");
  const nextSource = applyInSeasonPlayerParity(rawSource);
  if (nextSource !== rawSource) writeFileSync(appPath, nextSource);
  return nextSource !== rawSource;
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) {
  try {
    const changed = applyInSeasonPlayerParityFile();
    console.log(changed ? "Applied player In Season parity." : "Player In Season parity already present.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
