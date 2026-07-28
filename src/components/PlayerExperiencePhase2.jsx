import "./PlayerExperiencePhase2.css";

const normalizeEmail=(value)=>String(value||"").trim().toLowerCase();
const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,Number(value)||0));
const sameId=(left,right)=>String(left??"")===String(right??"");
const hasStatus=(value,accepted)=>accepted.includes(String(value||"").trim().toLowerCase());

const getEventId=(item)=>item?.eventId??item?.event_id??item?.id;
const getSessionId=(item)=>item?.sessionId??item?.session_id??item?.id;
const getPlayerEmail=(item)=>normalizeEmail(item?.email||item?.playerEmail||item?.player_email||item?.playerId||item?.player_id);
const getScoreDrillId=(item)=>item?.drillId??item?.drill_id;

function formatNumber(value){
  return new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Number(value)||0);
}

function progressPercent(value,total){
  const safeTotal=Math.max(0,Number(total)||0);
  if(!safeTotal)return 0;
  return clamp(Math.round((Math.max(0,Number(value)||0)/safeTotal)*100));
}

function MetricCard({label,value,detail}){
  return <div className="player-phase2__metric">
    <span className="player-phase2__metric-label">{label}</span>
    <strong className="player-phase2__metric-value">{value}</strong>
    <span className="player-phase2__metric-detail">{detail}</span>
  </div>;
}

function ProgressRail({value,total,label}){
  const pct=progressPercent(value,total);
  return <div className="player-phase2__progress" aria-label={`${label}: ${value} of ${total}`}>
    <div className="player-phase2__progress-copy">
      <span>{label}</span>
      <strong>{pct}%</strong>
    </div>
    <div className="player-phase2__progress-track"><span style={{width:`${pct}%`}}/></div>
  </div>;
}

function SurfaceShell({surface,eyebrow,title,description,status,accent="lime",progress,metrics=[],primaryAction,secondaryAction,children}){
  return <section className={`player-phase2 player-phase2--${accent}`} data-testid={`player-phase2-${surface}`}>
    <div className="player-phase2__hero">
      <div className="player-phase2__hero-glow" aria-hidden="true"/>
      <div className="player-phase2__hero-copy">
        <span className="player-phase2__eyebrow">{eyebrow}</span>
        <div className="player-phase2__title-row">
          <h2>{title}</h2>
          <span className="player-phase2__status">{status}</span>
        </div>
        <p>{description}</p>
      </div>
      {progress&&<ProgressRail {...progress}/>} 
      <div className="player-phase2__metrics">
        {metrics.map((metric)=><MetricCard key={metric.label} {...metric}/>) }
      </div>
      <div className="player-phase2__actions">
        {primaryAction&&<button type="button" className="player-phase2__primary" onClick={primaryAction.onClick} disabled={primaryAction.disabled} data-testid={`player-phase2-${surface}-primary-action`}>
          <span>{primaryAction.label}</span><span aria-hidden="true">→</span>
        </button>}
        {secondaryAction&&<button type="button" className="player-phase2__secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
      </div>
    </div>
    {children&&<div className="player-phase2__workspace" id={`player-${surface}-workspace`}>{children}</div>}
  </section>;
}

export function PlayerAtHomeDashboard({today,userEmail,shotLogs=[],drills=[],todayScores=[],onPrimaryAction,onViewStats}){
  const email=normalizeEmail(userEmail);
  const makesToday=shotLogs.filter((log)=>getPlayerEmail(log)===email&&String(log?.date||"")===String(today||"")).reduce((sum,log)=>sum+(Number(log?.made)||0),0);
  const completedIds=new Set(todayScores.map(getScoreDrillId).map(String));
  const nextDrill=drills.find((drill)=>!completedIds.has(String(drill?.id)));
  const completeCount=Math.min(drills.length,completedIds.size);
  return <SurfaceShell
    surface="at-home"
    eyebrow="Independent training"
    title="At Home Command Deck"
    description="Log volume, clear the next drill, and leave the page with measurable progress."
    status={nextDrill?`Next · ${nextDrill.name}`:"Daily block complete"}
    progress={{value:completeCount,total:drills.length,label:"Daily drill completion"}}
    metrics={[
      {label:"Makes today",value:formatNumber(makesToday),detail:"Logged volume"},
      {label:"Drills done",value:`${completeCount}/${drills.length}`,detail:"Daily sequence"},
      {label:"Remaining",value:Math.max(0,drills.length-completeCount),detail:"Actions left"},
    ]}
    primaryAction={{label:nextDrill?`Start ${nextDrill.name}`:"Daily work complete",onClick:onPrimaryAction,disabled:!nextDrill}}
    secondaryAction={{label:"View shot intelligence",onClick:onViewStats}}
  />;
}

export function PlayerProgramDashboard({programDrills=[],todayProgramScores=[],nextPriorityId,onPrimaryAction}){
  const completedIds=new Set(todayProgramScores.map(getScoreDrillId).map(String));
  const nextDrill=programDrills.find((drill)=>sameId(drill?.id,nextPriorityId)&&!completedIds.has(String(drill?.id)))||programDrills.find((drill)=>!completedIds.has(String(drill?.id)));
  const completeCount=Math.min(programDrills.length,completedIds.size);
  return <SurfaceShell
    surface="program"
    eyebrow="Coach-assigned work"
    title="Program Execution Board"
    description="Work the assigned sequence, protect score integrity, and move the team leaderboard."
    status={nextDrill?`Priority · ${nextDrill.name}`:"Program block complete"}
    accent="cyan"
    progress={{value:completeCount,total:programDrills.length,label:"Program completion"}}
    metrics={[
      {label:"Completed",value:`${completeCount}/${programDrills.length}`,detail:"Assigned drills"},
      {label:"Priority",value:nextDrill?"Active":"Clear",detail:nextDrill?.name||"No drill waiting"},
      {label:"Team impact",value:completeCount?"Live":"Pending",detail:"Leaderboard status"},
    ]}
    primaryAction={{label:nextDrill?`Open ${nextDrill.name}`:"Program complete",onClick:onPrimaryAction,disabled:!nextDrill}}
  />;
}

export function PlayerEventsDashboard({events=[],rsvps=[],user,today,children}){
  const email=normalizeEmail(user?.email);
  const upcoming=events.filter((event)=>!event?.date||String(event.date)>=String(today||"")).sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
  const responses=upcoming.map((event)=>rsvps.find((rsvp)=>sameId(getEventId(rsvp),getEventId(event))&&getPlayerEmail(rsvp)===email));
  const confirmed=responses.filter((rsvp)=>hasStatus(rsvp?.status,["yes","going","confirmed"])).length;
  const unresolved=responses.filter((rsvp)=>!rsvp).length;
  const nextEvent=upcoming[0];
  return <SurfaceShell
    surface="events"
    eyebrow="Team calendar"
    title="Event Readiness Board"
    description="Resolve attendance, see what is next, and remove schedule uncertainty before it becomes a team problem."
    status={nextEvent?`Next · ${nextEvent.title||nextEvent.type||"Team event"}`:"Schedule clear"}
    accent="orange"
    progress={{value:confirmed,total:upcoming.length,label:"Confirmed attendance"}}
    metrics={[
      {label:"Upcoming",value:upcoming.length,detail:"Team events"},
      {label:"Confirmed",value:confirmed,detail:"Going"},
      {label:"Needs action",value:unresolved,detail:"Unresolved RSVPs"},
    ]}
    primaryAction={{label:unresolved?"Resolve RSVPs":"Review schedule",onClick:()=>document.getElementById("player-events-workspace")?.scrollIntoView({behavior:"smooth",block:"start"})}}
  >{children}</SurfaceShell>;
}

export function PlayerStrengthDashboard({sessions=[],scRsvps=[],scLogs=[],user,today,children}){
  const email=normalizeEmail(user?.email);
  const upcoming=sessions.filter((session)=>!session?.date||String(session.date)>=String(today||"")).sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
  const confirmed=upcoming.filter((session)=>scRsvps.some((rsvp)=>sameId(getSessionId(rsvp),getSessionId(session))&&getPlayerEmail(rsvp)===email&&hasStatus(rsvp?.status,["yes","going","confirmed"]))).length;
  const completed=scLogs.filter((log)=>getPlayerEmail(log)===email).length;
  const nextSession=upcoming[0];
  return <SurfaceShell
    surface="strength"
    eyebrow="Physical development"
    title="Strength Readiness Board"
    description="Track attendance, complete the next lift, and keep physical development visible."
    status={nextSession?`Next · ${nextSession.title||nextSession.name||"Team lift"}`:"No lift scheduled"}
    accent="silver"
    progress={{value:confirmed,total:upcoming.length,label:"Upcoming sessions confirmed"}}
    metrics={[
      {label:"Upcoming",value:upcoming.length,detail:"Scheduled lifts"},
      {label:"Confirmed",value:confirmed,detail:"Attendance set"},
      {label:"Logged",value:completed,detail:"Completed sessions"},
    ]}
    primaryAction={{label:upcoming.length?"Open lifting plan":"Review lifting history",onClick:()=>document.getElementById("player-strength-workspace")?.scrollIntoView({behavior:"smooth",block:"start"})}}
  >{children}</SurfaceShell>;
}

export function PlayerLeaderboardsDashboard({rows=[],status,userEmail,children}){
  const email=normalizeEmail(userEmail);
  const rank=rows.findIndex((row)=>normalizeEmail(row?.email||row?.playerEmail||row?.player_email)===email)+1;
  const leader=rows[0];
  const current=rank>0?rows[rank-1]:null;
  const currentValue=Number(current?.total??current?.makes??current?.score??0)||0;
  const leaderValue=Number(leader?.total??leader?.makes??leader?.score??0)||0;
  const gap=rank>0?Math.max(0,leaderValue-currentValue):0;
  return <SurfaceShell
    surface="leaderboards"
    eyebrow="Competitive intelligence"
    title="Ranking Command Board"
    description="See the standard, understand the gap, and turn rankings into the next training decision."
    status={status==="loading"?"Updating rankings":rank>0?`Current rank · #${rank}`:"Log work to enter"}
    accent="purple"
    progress={{value:rank>0?Math.max(1,rows.length-rank+1):0,total:Math.max(1,rows.length),label:"Leaderboard position"}}
    metrics={[
      {label:"Your rank",value:rank>0?`#${rank}`:"—",detail:`${rows.length} ranked players`},
      {label:"Your total",value:formatNumber(currentValue),detail:"Tracked output"},
      {label:"Gap to lead",value:formatNumber(gap),detail:rank===1?"You set the pace":"Makes to close"},
    ]}
    primaryAction={{label:"Inspect rankings",onClick:()=>document.getElementById("player-leaderboards-workspace")?.scrollIntoView({behavior:"smooth",block:"start"})}}
  >{children}</SurfaceShell>;
}

export function PlayerProfileDashboard({user,scores=[],shotLogs=[],programScores=[],rsvps=[],events=[],streak=0,earnedBadges=[],children}){
  const email=normalizeEmail(user?.email);
  const playerScores=scores.filter((score)=>getPlayerEmail(score)===email);
  const playerProgramScores=programScores.filter((score)=>getPlayerEmail(score)===email);
  const totalMakes=shotLogs.filter((log)=>getPlayerEmail(log)===email).reduce((sum,log)=>sum+(Number(log?.made)||0),0);
  const attendedIds=new Set(rsvps.filter((rsvp)=>getPlayerEmail(rsvp)===email&&hasStatus(rsvp?.status,["yes","going","confirmed","attended"])).map(getEventId).map(String));
  const attended=events.filter((event)=>attendedIds.has(String(getEventId(event)))).length;
  const resumeScore=clamp((Math.min(streak,14)/14)*35+(Math.min(totalMakes,1000)/1000)*35+(Math.min(playerScores.length+playerProgramScores.length,20)/20)*20+(Math.min(attended,5)/5)*10);
  return <SurfaceShell
    surface="profile"
    eyebrow="Development record"
    title="Player Resume Dashboard"
    description="Your profile should show evidence of work, not just account settings."
    status={`${Math.round(resumeScore)}% profile signal`}
    accent="blue"
    progress={{value:Math.round(resumeScore),total:100,label:"Development resume strength"}}
    metrics={[
      {label:"Total makes",value:formatNumber(totalMakes),detail:"At-home volume"},
      {label:"Streak",value:`${Number(streak)||0}D`,detail:"Current consistency"},
      {label:"Badges",value:earnedBadges.length,detail:"Milestones earned"},
    ]}
    primaryAction={{label:"Review full resume",onClick:()=>document.getElementById("player-profile-workspace")?.scrollIntoView({behavior:"smooth",block:"start"})}}
  >{children}</SurfaceShell>;
}
