export const normalizeEmailSafe = (value) => String(value || "").trim().toLowerCase();
const toSafeNumber=(value)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:0;};
export const normalizeCoachRoster = (roster=[]) => (Array.isArray(roster)?roster:[])
  .map((p)=>({email:normalizeEmailSafe(p?.email),name:String(p?.name||"").trim()}))
  .filter((p)=>p.email);
export const normalizeCoachEvents = (events=[]) => (Array.isArray(events)?events:[])
  .map((ev)=>({id:ev?.id,title:String(ev?.title||""),date:String(ev?.date||""),time:String(ev?.time||""),type:String(ev?.type||"run").toLowerCase(),desc:String(ev?.desc||"")}))
  .filter((ev)=>ev.id!=null)
  .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
export const normalizeCoachRsvps = (rsvps=[]) => (Array.isArray(rsvps)?rsvps:[])
  .map((r)=>({eventId:r?.eventId,email:normalizeEmailSafe(r?.email),status:String(r?.status||"").toLowerCase(),teamId:r?.teamId||null,name:String(r?.name||"")}))
  .filter((r)=>r.eventId!=null&&r.email);
export const normalizeCoachScores=(scores=[])=> (Array.isArray(scores)?scores:[]).map((s)=>({email:normalizeEmailSafe(s?.email),date:String(s?.date||""),score:toSafeNumber(s?.score),made:toSafeNumber(s?.made)})).filter((s)=>s.email);
export const calcCoachAttendanceReadiness=({roster=[],events=[],rsvps=[],scores=[],today})=>{const safeRoster=normalizeCoachRoster(roster);const safeEvents=normalizeCoachEvents(events);const safeRsvps=normalizeCoachRsvps(rsvps);const safeScores=normalizeCoachScores(scores);const rosterSize=safeRoster.length;const day=today||new Date().toISOString().slice(0,10);const nextEvent=safeEvents.find((e)=>e.date>=day)||null;const session=nextEvent;const weekStartDate=new Date();weekStartDate.setDate(weekStartDate.getDate()-weekStartDate.getDay());const weekStart=`${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth()+1).padStart(2,"0")}-${String(weekStartDate.getDate()).padStart(2,"0")}`;const weekScores=safeScores.filter((s)=>s.date>=weekStart);const activeTodaySet=new Set(safeScores.filter((s)=>s.date===day).map((s)=>s.email));const activeThisWeekSet=new Set(weekScores.map((s)=>s.email));const attendancePct=rosterSize?Math.max(0,Math.min(100,Math.round((activeThisWeekSet.size/rosterSize)*100))):0;const sessionRsvps=session?safeRsvps.filter((r)=>r.eventId===session.id):[];const rsvpPct=rosterSize?Math.max(0,Math.min(100,Math.round((sessionRsvps.length/rosterSize)*100))):0;return {rosterSize,session,weekScores,activeTodaySet,attendancePct,rsvpPct};};
export const getUnresolvedRsvpCount=(events=[],rsvps=[],roster=[])=>{const safeEvents=normalizeCoachEvents(events);const safeRsvps=normalizeCoachRsvps(rsvps);const rosterSize=normalizeCoachRoster(roster).length;return safeEvents.reduce((acc,ev)=>acc+Math.max(0,rosterSize-safeRsvps.filter((r)=>r.eventId===ev.id).length),0);};
export const getNext7DayEventSummary=({events=[],rsvps=[],roster=[],today})=>{const safeEvents=normalizeCoachEvents(events);const safeRsvps=normalizeCoachRsvps(rsvps);const rosterSize=normalizeCoachRoster(roster).length;const now=today?new Date(`${today}T00:00:00`):new Date();const end=new Date(now);end.setDate(end.getDate()+7);const in7=safeEvents.filter((ev)=>{const d=new Date(`${ev.date}T00:00:00`);return !Number.isNaN(d.getTime())&&d>=now&&d<end;});const unresolved=getUnresolvedRsvpCount(in7,safeRsvps,Array(rosterSize).fill({email:'x'}));return {events:in7,unresolvedCount:unresolved};};
export const deriveCoachAlerts=({unresolvedNext7Count=0,inactivePlayersCount=0,rosterSize=0,rsvpPct=0,sessionTitle="",scheduleGap=false})=>[{title:"Unresolved RSVPs",enabled:unresolvedNext7Count>0,detail:`${unresolvedNext7Count} attendance confirmations still open over the next 7 days.`},{title:"Inactive players",enabled:inactivePlayersCount>0,detail:`${inactivePlayersCount} player${inactivePlayersCount===1?"":"s"} need a check-in this week.`},{title:"Session readiness",enabled:true,detail:sessionTitle?`${rsvpPct}% confirmed for ${sessionTitle}.`:"No team session is scheduled yet."},{title:"Schedule stability",enabled:true,detail:scheduleGap?"Add one more session to keep the 7-day training rhythm stable.":"7-day training cadence is stable."}].filter(a=>a.enabled);
export const deriveCultureReadinessLabels=({attendancePct=0,rsvpPct=0,sessionTitle="",unresolvedNext7Count=0,participationMomentum=0})=>({teamCommitmentLabel:attendancePct>=75&&rsvpPct>=75?"High standard":attendancePct>=60?"Standard is building":"Standard needs reinforcement",readinessLabel:sessionTitle?`${rsvpPct}% readiness`:"Session not set",unresolvedGapsLabel:unresolvedNext7Count===0?"No open attendance gaps":`${unresolvedNext7Count} unresolved RSVPs`,cultureMomentum:participationMomentum>=8?"Rising":"Steady"});

export const deriveCoachInsightSummary = ({ roster = [], scores = [], shotLogs = [], priorities = null, today = new Date().toISOString().slice(0,10) } = {}) => {
  const players = normalizeCoachRoster(roster);
  const day = today;
  const weekStartDate = new Date(`${day}T00:00:00`);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStart = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth()+1).padStart(2,"0")}-${String(weekStartDate.getDate()).padStart(2,"0")}`;
  const activityRows = [...normalizeCoachScores(scores), ...(Array.isArray(shotLogs)?shotLogs:[]).map((s)=>({email:normalizeEmailSafe(s?.email),date:String(s?.date||"")}))].filter((r)=>r.email&&r.date>=weekStart);
  const perPlayer = new Map();
  activityRows.forEach((r)=>perPlayer.set(r.email,(perPlayer.get(r.email)||0)+1));
  const engaged = [...perPlayer.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([email])=>email);
  const losingMomentum = players.filter((p)=>(perPlayer.get(p.email)||0)===0).slice(0,3).map((p)=>p.email);
  const completionRate = players.length?Math.round((perPlayer.size/players.length)*100):0;
  const priorityCompletionRate = priorities?.priorityDrillText ? completionRate : Math.max(0, completionRate-8);
  return {
    engagedAthletes: engaged,
    playersLosingMomentum: losingMomentum,
    teamCompletionTrend: completionRate>=70?"strong":completionRate>=45?"building":"needs intervention",
    topDrillPerformers: engaged,
    priorityCompletionRate,
  };
};
