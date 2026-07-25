import fs from "node:fs";

const appPath = "src/App.jsx";
let source = fs.readFileSync(appPath, "utf8");

const replaceOnce = (label, before, after) => {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source = source.replace(before, after);
};

replaceOnce(
  "career component import",
  'import CoachPlayerInviteForm from "./components/CoachPlayerInviteForm.jsx";\n',
  'import CoachPlayerInviteForm from "./components/CoachPlayerInviteForm.jsx";\nimport PlayerCareerHistory from "./components/PlayerCareerHistory.jsx";\n',
);

replaceOnce(
  "player profile invocation",
  '<ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/>',
  '<ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} scLogs={scLogs} seasonArchives={seasonArchives} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/>',
);

replaceOnce(
  "player profile signature",
  'function ProfilePage({u,scores,shotLogs,drills,programDrills=[],programScores:programScoresFromDb=[],rsvps,events=[],players=[],scRsvps,challenges,streak,earnedBadges,T,deleteAccount,onToggleLeaderboardVisibility}){',
  'function ProfilePage({u,scores,shotLogs,drills,programDrills=[],programScores:programScoresFromDb=[],rsvps,events=[],players=[],scRsvps,scLogs=[],seasonArchives=[],challenges,streak,earnedBadges,T,deleteAccount,onToggleLeaderboardVisibility}){',
);

replaceOnce(
  "player self career mount",
  'return <div className="fade-up">\n{u.isCoach&&',
  'return <div className="fade-up">\n<PlayerCareerHistory player={u} teamId={u?.teamId||""} seasonArchives={seasonArchives} scores={scores} programScores={normalizedProgramScores} shotLogs={shotLogs} rsvps={rsvps} scRsvps={scRsvps} scLogs={scLogs} viewerRole="player"/>\n{u.isCoach&&',
);

const coachProfile = '<CoachPlayerDevelopmentProfile player={selP} programDrills={programDrills} programScores={safeProgramScores} scores={safeScores} shotLogs={shotLogs} homeLeaderboardRows={canonicalCoachHomeLeaderboardRows} rsvps={safeRsvps} events={safeEvents} scRsvps={safeScRsvps} scLogs={safeScLogs} teamId={u?.teamId}/>';
replaceOnce(
  "coach career mount",
  coachProfile,
  `${coachProfile}<PlayerCareerHistory player={selP} teamId={u?.teamId||""} seasonArchives={seasonArchives} scores={safeScores} programScores={safeProgramScores} shotLogs={shotLogs} rsvps={safeRsvps} scRsvps={safeScRsvps} scLogs={safeScLogs} viewerRole="coach" onOpenArchive={(archiveId)=>{setSelectedSeasonArchiveId(archiveId);setSelP(null);}}/>`,
);

fs.writeFileSync(appPath, source);
fs.unlinkSync("scripts/apply-player-career-history-integration.mjs");
fs.unlinkSync(".github/workflows/apply-player-career-history-integration.yml");
console.log("Player Career History integration applied safely.");
