import fs from "node:fs";

const appPath=new URL("../src/App.jsx",import.meta.url);
let source=fs.readFileSync(appPath,"utf8");

function mustReplace(label,needle,replacement){
  if(!source.includes(needle)){
    throw new Error(`Player Phase 2 patch failed: missing ${label}`);
  }
  source=source.replace(needle,replacement);
}

mustReplace(
  "phase 2 import anchor",
  'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";',
  'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\nimport { PlayerAtHomeDashboard, PlayerEventsDashboard, PlayerLeaderboardsDashboard, PlayerProfileDashboard, PlayerProgramDashboard, PlayerStrengthDashboard } from "./components/PlayerExperiencePhase2.jsx";'
);

mustReplace(
  "At Home legacy header",
  `{(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">\n    \n    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>\n      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={VOLT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M19 13v6a1 1 0 01-1 1H6a1 1 0 01-1-1v-6"/></svg>\n      <div style={{fontFamily:FD,color:VOLT,fontSize:22,letterSpacing:3}}>AT HOME</div>\n    </div>\n    <div style={{fontFamily:FB,color:MUTED,fontSize:12,marginBottom:24,fontWeight:500}}>Log your daily drills and track shots — all on the honor system.</div>`,
  `{(tab==="log-drill")&&!active&&!showShotStats&&<div className="fade-up">\n    <PlayerAtHomeDashboard\n      today={today}\n      userEmail={u?.email||""}\n      shotLogs={shotLogs}\n      drills={drills}\n      todayScores={todayS}\n      onPrimaryAction={()=>{const next=drills.find((drill)=>!todayS.some((score)=>String(score?.drillId??score?.drill_id??"")===String(drill?.id??"")));if(next)setActive(next);}}\n      onViewStats={()=>setShowShotStats(true)}\n    />`
);

mustReplace(
  "leaderboards surface",
  `{tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">\n    <PremiumLeaderboardsHub viewerRole="player" leaderboardRows={playerLeaderboardRows} leaderboardStatus={homeShotsLeaderboard?.status||"idle"} userEmail={u?.email||""} currentUser={u} programScores={teamProgramScores} programDrills={programDrills} players={playerLeaderboardPlayers} teamId={u?.teamId||""} homeScores={scores} shotLogs={shotLogs} seasonArchives={seasonArchives} />\n  </div>}`,
  `{tab==="leaderboards"&&!active&&<div className={slideClass} key="leaderboards">\n    <PlayerLeaderboardsDashboard rows={playerLeaderboardRows} status={homeShotsLeaderboard?.status||"idle"} userEmail={u?.email||""}>\n      <PremiumLeaderboardsHub viewerRole="player" leaderboardRows={playerLeaderboardRows} leaderboardStatus={homeShotsLeaderboard?.status||"idle"} userEmail={u?.email||""} currentUser={u} programScores={teamProgramScores} programDrills={programDrills} players={playerLeaderboardPlayers} teamId={u?.teamId||""} homeScores={scores} shotLogs={shotLogs} seasonArchives={seasonArchives} />\n    </PlayerLeaderboardsDashboard>\n  </div>}`
);

mustReplace(
  "events surface",
  `{tab==="program"&&<div className={slideClass} key="program"><SectionHero icon={<EventIcon type="star" size={28} color={VOLT}/>} title="PROGRAM EVENTS" subtitle="Official workouts and attendance" accent={VOLT} deco={<EventIcon type="run" size={16} color={VOLT}/>} isCoach={u.isCoach}/><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div>}`,
  `{tab==="program"&&<div className={slideClass} key="program"><PlayerEventsDashboard events={events} rsvps={rsvps} user={u} today={today}><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></PlayerEventsDashboard></div>}`
);

mustReplace(
  "Program legacy header",
  `{tab==="duels"&&!active&&<div className="fade-up">\n    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>\n      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>\n      <div style={{fontFamily:FD,color:CYAN,fontSize:22,letterSpacing:3}}>PROGRAM LOG</div>\n    </div>\n    <div style={{fontFamily:FB,color:CYAN,fontSize:12,marginBottom:24,fontWeight:500,textShadow:\`0 0 18px \${CYAN}18\`}}>Log your coach-assigned program drills and keep the team leaderboard moving.</div>\n\n    <div style={{fontFamily:FB,color:CYAN,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:8,textShadow:\`0 0 16px \${CYAN}18\`}}>PROGRAM DRILLS · {todayProgramScores.length}/{programDrills.length} DONE</div>\n    <div style={{width:"100%",height:4,background:"#242424",borderRadius:2,overflow:"hidden",marginBottom:12}}><div style={{width:\`\${programDrills.length>0?Math.min(100,Math.round(todayProgramScores.length/programDrills.length*100)):0}%\`,height:"100%",background:CYAN,borderRadius:2,transition:"width .25s ease"}}/></div>`,
  `{tab==="duels"&&!active&&<div className="fade-up">\n    <PlayerProgramDashboard\n      programDrills={programDrills}\n      todayProgramScores={todayProgramScores}\n      nextPriorityId={programSessionBlocks?.nextPriority}\n      onPrimaryAction={()=>{const next=programDrills.find((drill)=>String(drill?.id??"")===String(programSessionBlocks?.nextPriority??"")&&!todayProgramScores.some((score)=>String(score?.drillId??score?.drill_id??"")===String(drill?.id??"")))||programDrills.find((drill)=>!todayProgramScores.some((score)=>String(score?.drillId??score?.drill_id??"")===String(drill?.id??"")));if(next)setActive(next);}}\n    />`
);

mustReplace(
  "strength surface",
  `{tab==="sc"&&<div className={slideClass} key="sc"><SectionHero icon={<LiftIcon size={28} color="#A0A0A0"/>} title="STRENGTH & CONDITIONING" subtitle="Log sessions and build consistency" accent="#A0A0A0" deco={<LiftIcon size={16} color="#A0A0A0"/>} isCoach={u.isCoach}/><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></div>}`,
  `{tab==="sc"&&<div className={slideClass} key="sc"><PlayerStrengthDashboard sessions={scSessions} scRsvps={scRsvps} scLogs={scLogs} user={u} today={today}><SCPanel sessions={scSessions} scRsvps={scRsvps} user={u} toggleScRsvp={toggleScRsvp} scLogs={scLogs} addScLog={addScLog} players={players} onCompletionCue={pushCompletionCue}/></PlayerStrengthDashboard></div>}`
);

mustReplace(
  "profile surface",
  `{tab==="profile"&&<div className={slideClass} key="profile"><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></div>}`,
  `{tab==="profile"&&<div className={slideClass} key="profile"><PlayerProfileDashboard user={u} scores={scores} shotLogs={shotLogs} programScores={programScores} rsvps={rsvps} events={events} streak={streak} earnedBadges={earnedBadges}><ProfilePage u={u} scores={scores} shotLogs={shotLogs} drills={drills} programDrills={programDrills} programScores={programScores} rsvps={rsvps} events={events} players={players} scRsvps={scRsvps} challenges={challenges} streak={streak} earnedBadges={earnedBadges} T={T} deleteAccount={deleteAccount} onToggleLeaderboardVisibility={toggleLeaderboardVisibility}/></PlayerProfileDashboard></div>}`
);

fs.writeFileSync(appPath,source);
console.log("Player Experience Phase 2 patch applied.");
