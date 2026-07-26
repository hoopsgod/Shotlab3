import fs from "node:fs";

const appPath = "src/App.jsx";
let source = fs.readFileSync(appPath, "utf8");

const replaceOnce = (anchor, replacement, label) => {
  if (source.includes(replacement)) return;
  if (!source.includes(anchor)) throw new Error(`${label} anchor missing`);
  source = source.replace(anchor, replacement);
};

replaceOnce(
  'import { CoachEventsInteractiveDashboard, CoachPageDashboardHeader, CoachPlayersInteractiveDashboard } from "./components/CoachInteractiveDashboards.jsx";',
  'import { CoachEventsInteractiveDashboard, CoachPageDashboardHeader, CoachPlayersInteractiveDashboard } from "./components/CoachInteractiveDashboards.jsx";\nimport { CoachActivityIntelligencePanel, CoachDrillsOperationalPanel, CoachEventIntelligenceDrawer, CoachLeaderboardOperationalPanel, CoachPlayerIntelligenceDrawer, CoachSeasonComparisonPanel, CoachStrengthOperationalPanel } from "./components/CoachDashboardPhase2.jsx";',
  "phase two component import",
);

replaceOnce(
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";',
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";\nimport { buildActivityIntelligenceRows, buildDrillIntelligenceRows, buildEventIntelligenceModel, buildLeaderboardIntelligenceRows, buildPlayerIntelligenceModel, buildSeasonComparisonModel, buildStrengthIntelligenceRows, filterActivityIntelligenceRows, filterDrillIntelligenceRows, filterLeaderboardIntelligenceRows, filterStrengthIntelligenceRows } from "./lib/coachOperationalIntelligence.js";',
  "phase two selector import",
);

const stateAnchor = 'const[eventFilter,setEventFilter]=useState("all"),[eventSaveError,setEventSaveError]=useState(""),[playerDashboardFilter,setPlayerDashboardFilter]=useState("all"),[playerDashboardQuery,setPlayerDashboardQuery]=useState(""),[eventDashboardStatus,setEventDashboardStatus]=useState("upcoming"),[eventDashboardQuery,setEventDashboardQuery]=useState(""),[coachPageMetric,setCoachPageMetric]=useState("active");';
const stateReplacement = `${stateAnchor}\nconst[playerDrawerKey,setPlayerDrawerKey]=useState(""),[eventDrawerId,setEventDrawerId]=useState(""),[drillIntelligenceScope,setDrillIntelligenceScope]=useState("all"),[drillIntelligenceQuery,setDrillIntelligenceQuery]=useState(""),[strengthIntelligenceScope,setStrengthIntelligenceScope]=useState("all"),[strengthIntelligenceQuery,setStrengthIntelligenceQuery]=useState(""),[leaderboardIntelligenceScope,setLeaderboardIntelligenceScope]=useState("all"),[leaderboardIntelligenceQuery,setLeaderboardIntelligenceQuery]=useState(""),[activityIntelligenceScope,setActivityIntelligenceScope]=useState("all"),[activityIntelligenceQuery,setActivityIntelligenceQuery]=useState("");`;
replaceOnce(stateAnchor, stateReplacement, "phase two state");

replaceOnce(
  'const safeScLogs=useMemo(()=>filterActiveTeamPlayerRows(scLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet),[scLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet]);',
  'const safeScLogs=useMemo(()=>filterActiveTeamPlayerRows(scLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet),[scLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet]);\nconst safeShotLogs=useMemo(()=>filterActiveTeamPlayerRows(shotLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet),[shotLogs,activeTeamPlayerEmailSet,activeTeamPlayerKeySet]);',
  "safe shot logs",
);

const summaryAnchor = 'const coachPageDashboardSummary=useMemo(()=>buildCoachPageDashboardSummary({drills,programDrills,scSessions,scRsvps:safeScRsvps,scLogs:safeScLogs,leaderboardRows:canonicalCoachHomeLeaderboardRows,activityRows:safeScores,seasonArchives}),[drills,programDrills,scSessions,safeScRsvps,safeScLogs,canonicalCoachHomeLeaderboardRows,safeScores,seasonArchives]);';
const phaseTwoDerived = `${summaryAnchor}\nconst previousWeekStart=useMemo(()=>{const value=new Date(\`${'${weekStr}'}T00:00:00\`);value.setDate(value.getDate()-7);return \`${'${value.getFullYear()}'}-${'${String(value.getMonth()+1).padStart(2,"0")}'}-${'${String(value.getDate()).padStart(2,"0")}'}\`;},[weekStr]);\nconst selectedPlayerDashboardRow=useMemo(()=>coachPlayerDashboardRows.find(row=>row.key===playerDrawerKey)||null,[coachPlayerDashboardRows,playerDrawerKey]);\nconst selectedPlayerIntelligence=useMemo(()=>buildPlayerIntelligenceModel({playerRow:selectedPlayerDashboardRow,scores:safeScores,shotLogs:safeShotLogs,rsvps:safeRsvps,events:safeEvents,scRsvps:safeScRsvps,scLogs:safeScLogs,weekStart:weekStr,previousWeekStart,today}),[selectedPlayerDashboardRow,safeScores,safeShotLogs,safeRsvps,safeEvents,safeScRsvps,safeScLogs,weekStr,previousWeekStart,today]);\nconst selectedEventDashboardRow=useMemo(()=>coachEventDashboardRows.find(row=>String(row.event?.id||row.key||"")===String(eventDrawerId||""))||null,[coachEventDashboardRows,eventDrawerId]);\nconst selectedEventIntelligence=useMemo(()=>buildEventIntelligenceModel({eventRow:selectedEventDashboardRow,roster:coachRosterPlayers,rsvps:safeRsvps}),[selectedEventDashboardRow,coachRosterPlayers,safeRsvps]);\nconst coachDrillIntelligenceRows=useMemo(()=>buildDrillIntelligenceRows({drills,programDrills,scores:safeScores,programScores:safeProgramScores}),[drills,programDrills,safeScores,safeProgramScores]);\nconst filteredCoachDrillRows=useMemo(()=>filterDrillIntelligenceRows(coachDrillIntelligenceRows,{scope:drillIntelligenceScope,query:drillIntelligenceQuery}),[coachDrillIntelligenceRows,drillIntelligenceScope,drillIntelligenceQuery]);\nconst visibleHomeDrills=useMemo(()=>filteredCoachDrillRows.filter(row=>row.type==="home").map(row=>row.drill),[filteredCoachDrillRows]);\nconst visibleProgramDrills=useMemo(()=>filteredCoachDrillRows.filter(row=>row.type==="program").map(row=>row.drill),[filteredCoachDrillRows]);\nconst coachStrengthIntelligenceRows=useMemo(()=>buildStrengthIntelligenceRows({sessions:scSessions,rsvps:safeScRsvps,logs:safeScLogs,roster:coachRosterPlayers,today}),[scSessions,safeScRsvps,safeScLogs,coachRosterPlayers,today]);\nconst filteredCoachStrengthRows=useMemo(()=>filterStrengthIntelligenceRows(coachStrengthIntelligenceRows,{scope:strengthIntelligenceScope,query:strengthIntelligenceQuery}),[coachStrengthIntelligenceRows,strengthIntelligenceScope,strengthIntelligenceQuery]);\nconst coachLeaderboardIntelligenceRows=useMemo(()=>buildLeaderboardIntelligenceRows({leaderboardRows:canonicalCoachHomeLeaderboardRows,shotLogs:safeShotLogs,weekStart:weekStr,previousWeekStart}),[canonicalCoachHomeLeaderboardRows,safeShotLogs,weekStr,previousWeekStart]);\nconst filteredCoachLeaderboardIntelligenceRows=useMemo(()=>filterLeaderboardIntelligenceRows(coachLeaderboardIntelligenceRows,{scope:leaderboardIntelligenceScope,query:leaderboardIntelligenceQuery}),[coachLeaderboardIntelligenceRows,leaderboardIntelligenceScope,leaderboardIntelligenceQuery]);\nconst coachActivityIntelligenceRows=useMemo(()=>buildActivityIntelligenceRows({scores:safeScores,shotLogs:safeShotLogs,scLogs:safeScLogs,events:safeEvents,today}),[safeScores,safeShotLogs,safeScLogs,safeEvents,today]);\nconst filteredCoachActivityIntelligenceRows=useMemo(()=>filterActivityIntelligenceRows(coachActivityIntelligenceRows,{scope:activityIntelligenceScope,query:activityIntelligenceQuery}),[coachActivityIntelligenceRows,activityIntelligenceScope,activityIntelligenceQuery]);\nconst coachSeasonComparisonModel=useMemo(()=>buildSeasonComparisonModel({currentRoster:coachRosterPlayers,currentScores:safeScores,currentShotLogs:safeShotLogs,currentEvents:safeEvents,currentRsvps:safeRsvps,currentScSessions:scSessions,currentScLogs:safeScLogs,archives:seasonArchives,selectedArchiveId:selectedSeasonArchiveId}),[coachRosterPlayers,safeScores,safeShotLogs,safeEvents,safeRsvps,scSessions,safeScLogs,seasonArchives,selectedSeasonArchiveId]);\nconst openPlayerIntelligence=useCallback((player={})=>{const candidates=[player.email,player.player_email,player.playerId,player.player_id,player.userId,player.user_id,player.profileId,player.profile_id,player.id].map(normalizeEmail).filter(Boolean);const normalizedName=normalizeEmail(player.name||player.displayName);const row=coachPlayerDashboardRows.find(candidate=>candidates.includes(candidate.key)||candidates.includes(normalizeEmail(candidate.email))||candidates.some(key=>[candidate.player?.email,candidate.player?.player_email,candidate.player?.playerId,candidate.player?.player_id,candidate.player?.userId,candidate.player?.user_id,candidate.player?.profileId,candidate.player?.profile_id,candidate.player?.id].map(normalizeEmail).includes(key))||(normalizedName&&normalizeEmail(candidate.name)===normalizedName));setPlayerDrawerKey(row?.key||candidates[0]||"");},[coachPlayerDashboardRows]);`;
replaceOnce(summaryAnchor, phaseTwoDerived, "phase two derived state");

replaceOnce(
  'onOpenEvent={setExpEv}',
  'onOpenEvent={setEventDrawerId}',
  "event insight drawer action",
);

replaceOnce(
  '<CoachPageDashboardHeader eyebrow="Development operations" title="Drills Dashboard" summary="Manage the training library, program standards, and player execution pathways."',
  '<CoachPageDashboardHeader eyebrow="Development operations" title="Drills Dashboard" summary="Manage the training library, program standards, and player execution pathways."',
  "drill header existence",
);

const drillHeaderEnd = 'testId="coach-page-dashboard-drills"/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Drill Management" s={`${drills.length} active`} identity/>';
replaceOnce(
  drillHeaderEnd,
  'testId="coach-page-dashboard-drills"/><CoachDrillsOperationalPanel rows={coachDrillIntelligenceRows} scope={drillIntelligenceScope} query={drillIntelligenceQuery} onScopeChange={setDrillIntelligenceScope} onQueryChange={setDrillIntelligenceQuery} onOpenDrill={(drill)=>{setEditD(drill);setEName(drill.name);setEDesc(drill.desc||"");setEInstr(drill.instructions||"");setEMax(hasDrillMax(drill)?String(drill.max):"");setEIcon(drill.icon||"ft");}}/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Drill Management" s={`${visibleHomeDrills.length} visible`} identity/>',
  "drill operational panel",
);
replaceOnce('programDrills.map(pd=>', 'visibleProgramDrills.map(pd=>', "program drill filtering");
replaceOnce('{drills.map(d=>', '{visibleHomeDrills.map(d=>', "home drill filtering");

const activityAnchor = '<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/><div className="accent-card"';
replaceOnce(
  activityAnchor,
  '<CoachActivityIntelligencePanel rows={filteredCoachActivityIntelligenceRows} scope={activityIntelligenceScope} query={activityIntelligenceQuery} onScopeChange={setActivityIntelligenceScope} onQueryChange={setActivityIntelligenceQuery} onOpenItem={(item)=>{if(item.type==="event")setEventDrawerId(item.source?.id||"");else openPlayerIntelligence(item.source||{});}}/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/><div className="accent-card"',
  "activity intelligence panel",
);

const leaderboardAnchor = '<PremiumLeaderboardsHub viewerRole="coach"';
replaceOnce(
  leaderboardAnchor,
  '<CoachLeaderboardOperationalPanel rows={filteredCoachLeaderboardIntelligenceRows} scope={leaderboardIntelligenceScope} query={leaderboardIntelligenceQuery} onScopeChange={setLeaderboardIntelligenceScope} onQueryChange={setLeaderboardIntelligenceQuery} onOpenPlayer={openPlayerIntelligence}/><PremiumLeaderboardsHub viewerRole="coach"',
  "leaderboard operational panel",
);

replaceOnce('onSelectPlayer={setSelP}', 'onSelectPlayer={openPlayerIntelligence}', "roster player drawer");
replaceOnce('onClick={()=>setSelP(p)} role="button"', 'onClick={()=>openPlayerIntelligence(p)} role="button"', "player detail row click");
replaceOnce('if(e.key==="Enter"||e.key===" ")setSelP(p);', 'if(e.key==="Enter"||e.key===" ")openPlayerIntelligence(p);', "player detail row keyboard");

const seasonArchiveAnchor = '{tab==="players"&&!selP&&<div id="coach-season-tools"';
replaceOnce(
  seasonArchiveAnchor,
  '<CoachSeasonComparisonPanel model={coachSeasonComparisonModel} selectedArchiveId={selectedSeasonArchiveId} onArchiveChange={setSelectedSeasonArchiveId} onOpenArchive={(id)=>{setSelectedSeasonArchiveId(id||"");setTimeout(()=>document.getElementById("coach-season-tools")?.scrollIntoView({behavior:"smooth",block:"start"}),80);}}/>{tab==="players"&&!selP&&<div id="coach-season-tools"',
  "season comparison panel",
);

const strengthHeaderEnd = 'testId="coach-page-dashboard-strength"/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="S&C SESSIONS" s={`${scSessions.length} TOTAL`} identity/>';
replaceOnce(
  strengthHeaderEnd,
  'testId="coach-page-dashboard-strength"/><CoachStrengthOperationalPanel rows={coachStrengthIntelligenceRows} scope={strengthIntelligenceScope} query={strengthIntelligenceQuery} onScopeChange={setStrengthIntelligenceScope} onQueryChange={setStrengthIntelligenceQuery} onOpenSession={(session)=>{setStrengthIntelligenceQuery(session.sport||session.title||"");setStrengthIntelligenceScope("all");}}/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="S&C SESSIONS" s={`${filteredCoachStrengthRows.length} VISIBLE`} identity/>',
  "strength operational panel",
);
replaceOnce(
  '{scSessions.sort((a,b)=>a.date.localeCompare(b.date)).map(s=>{',
  '{filteredCoachStrengthRows.map(({session:s})=>{',
  "strength session filtering",
);

const mobileNavAnchor = '{!isDesktop&&<MobileNavigation primaryItems={coachMobilePrimaryItems}';
replaceOnce(
  mobileNavAnchor,
  '<CoachPlayerIntelligenceDrawer model={selectedPlayerIntelligence} onClose={()=>setPlayerDrawerKey("")} onOpenFullProfile={()=>{if(selectedPlayerDashboardRow?.player){setSelP(selectedPlayerDashboardRow.player);setPlayerDrawerKey("");}}} onShowActivity={()=>{setActivityIntelligenceQuery(selectedPlayerIntelligence?.name||selectedPlayerIntelligence?.email||"");setActivityIntelligenceScope("all");setTab("feed");setPlayerDrawerKey("");}}/><CoachEventIntelligenceDrawer model={selectedEventIntelligence} onClose={()=>setEventDrawerId("")} onManageAttendance={()=>{if(selectedEventIntelligence?.id){setExpEv(selectedEventIntelligence.id);setTab("events");setEventDrawerId("");}}} onOpenSchedule={()=>{setTab("events");setEventDrawerId("");}}/>{!isDesktop&&<MobileNavigation primaryItems={coachMobilePrimaryItems}',
  "phase two drawers",
);

fs.writeFileSync(appPath, source);
console.log("Applied Coach Dashboard Phase 2 integration.");
