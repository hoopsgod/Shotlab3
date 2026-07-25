import React, { useMemo, useState } from "react";
import "./CoachCommandCenter.css";

const LOGO="/branding/titans-exact-logo.png.PNG";
const initials=(value="")=>String(value).trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"SL";
const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));

function Avatar({item,size=38}){
  const src=item?.avatarUrl||item?.photoUrl||item?.imageUrl||"";
  const label=item?.name||item?.title||"Player";
  return src?<img className="mcAvatar" src={src} alt={`${label} headshot`} style={{width:size,height:size}}/>:<span className="mcAvatar mcAvatar--fallback" aria-label={`${label} headshot placeholder`} style={{width:size,height:size}}>{initials(label)}</span>;
}

function CourtScene(){
  return <div className="mcCourtScene" aria-hidden="true">
    <div className="mcCourtLights"><span/><span/><span/><span/></div>
    <div className="mcBackboard"><i/><b/></div>
    <div className="mcFloor"><div className="mcArc"/><div className="mcLane"/><img src={LOGO} alt=""/></div>
  </div>;
}

const railItems=[
  ["Mission Control","⌘"],["Players","♙"],["Sessions","▣"],["Drills","◎"],["Analytics","▥"],["Events","□"],["Messages","▢"],["More","•••"],
];

export default function CoachCommandCenter({
  variant="full",totalPlayers,activeTodayCount,nextEventDateFormatted,highlightPlayersAttention,
  onPlayersClick,onActiveTodayClick,onNextEventClick,onAddPlayer,onAddDrill,onScheduleEvent,onLogScore,
  joinCode,onCopyJoinCode,onRegenerateJoinCode,codeErr,attentionItems=[],activityItems=[],
}){
  const [copied,setCopied]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const rosterSize=Math.max(0,Number(totalPlayers)||0);
  const activeCount=Math.max(0,Number(activeTodayCount)||0);
  const activeRate=rosterSize?Math.round(activeCount/rosterSize*100):0;
  const hasScheduledSession=Boolean(nextEventDateFormatted&&String(nextEventDateFormatted).trim()&&!/^(none|—|not set)$/i.test(String(nextEventDateFormatted).trim()));
  const resolvedAttention=attentionItems.length?attentionItems:(highlightPlayersAttention?[{name:"Roster follow-up",detail:"Inactive or unresolved player items",tone:"danger",onClick:onPlayersClick}]:[]);
  const readiness=clamp(hasScheduledSession?Math.round((activeRate+70)/2):activeRate,0,100);
  const confirmed=Math.max(0,rosterSize-resolvedAttention.length);
  const statusTitle=hasScheduledSession?`Practice ${nextEventDateFormatted}`:"No practice scheduled";
  const actionLabel=hasScheduledSession?"View practice":"Create practice";
  const action=hasScheduledSession?onNextEventClick:onScheduleEvent;
  const dateLabel=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  const timeLabel=new Date().toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  const resolvedActivity=activityItems.length?activityItems:[
    activeCount?{name:`${activeCount} athlete${activeCount===1?"":"s"}`,detail:"Active today",meta:"✓"}:null,
    hasScheduledSession?{name:"Team practice",detail:String(nextEventDateFormatted),meta:"✓"}:null,
  ].filter(Boolean);
  const quickActions=useMemo(()=>[
    {label:"Add Player",icon:"♙",onClick:onAddPlayer},{label:"Create Session",icon:"▣",onClick:onScheduleEvent},
    {label:"Build Mission",icon:"◎",onClick:onAddDrill},{label:"Log Score",icon:"▤",onClick:onLogScore},
    {label:"Message Team",icon:"▢",onClick:onPlayersClick},{label:"View Analytics",icon:"▥",onClick:onActiveTodayClick},
  ],[onActiveTodayClick,onAddDrill,onAddPlayer,onLogScore,onPlayersClick,onScheduleEvent]);

  if(variant==="compact")return <section className="missionControlCompact" data-testid="coach-command-center-compact"><div><span>Mission Control</span><strong>{statusTitle}</strong></div><button type="button" onClick={action}>{hasScheduledSession?"Open":"Schedule"}</button></section>;

  return <div className="mcShell" data-testid="coach-command-center-full">
    <aside className="mcRail" aria-label="Coach navigation">
      <img className="mcRailLogo" src={LOGO} alt="Thomas Titans"/>
      <nav>{railItems.map(([label,icon],index)=><button key={label} type="button" className={index===0?"is-active":""} onClick={index===1?onPlayersClick:index===2||index===5?onNextEventClick:undefined}><i>{icon}</i><span>{label}</span></button>)}</nav>
      <div className="mcCoachIdentity"><span>Coach</span><strong>Demo Coach</strong><Avatar item={{name:"Demo Coach"}} size={40}/></div>
    </aside>

    <main className="missionControl">
      <header className="mcHeader">
        <div><h1>Mission <em>Control</em></h1><span className="mcHeaderSub">Coach Dashboard</span></div>
        <div className="mcHeaderRight"><button type="button" className="mcTeamSelect">Thomas Titans <span>⌄</span></button><button type="button" className="mcBell" aria-label={`${resolvedAttention.length} notifications`}>♢<b>{resolvedAttention.length}</b></button><small>{dateLabel} &nbsp;•&nbsp; {timeLabel}</small></div>
      </header>

      <section className="mcHero" data-testid="coach-primary-objective">
        <CourtScene/><div className="mcHeroShade"/>
        <div className="mcHeroContent"><span className="mcEyebrow">Today’s status</span><h2>{statusTitle}</h2><p><strong>{confirmed}</strong> / {rosterSize||0} players confirmed</p><div className="mcHeroStats"><button type="button" onClick={onPlayersClick}><i>♙</i><strong>{resolvedAttention.length}</strong><span>Need attention</span></button><button type="button" onClick={onActiveTodayClick}><i>✓</i><strong>{readiness}%</strong><span>Mission readiness</span></button></div><button type="button" className="mcPrimary" onClick={action}>{actionLabel}<span>→</span></button></div>
      </section>

      <div className="mcTopGrid">
        <section className="mcPanel mcPulse" data-testid="coach-primary-metrics"><div className="mcPanelHead"><span>Team Pulse</span></div><svg className="mcSpark" viewBox="0 0 320 100" preserveAspectRatio="none"><path d="M0 76 C30 76,40 58,65 60 S95 42,115 62 S150 28,172 42 S205 28,225 58 S260 34,280 45 S305 24,320 20"/></svg><div className="mcPulseStats"><div><strong>{Math.max(activeRate,85)}%</strong><span>Active this week</span></div><div><strong>{readiness}%</strong><span>Mission readiness</span></div><div><strong>92%</strong><span>Weekly volume</span></div></div><button type="button" className="mcTextLink" onClick={onActiveTodayClick}>View full pulse ›</button></section>

        <section className="mcPanel mcAttention"><div className="mcPanelHead"><span>Needs Attention</span><b>{resolvedAttention.length}</b></div><div className="mcList">{resolvedAttention.length?resolvedAttention.slice(0,3).map((item,index)=><button type="button" key={`${item.name||item.title}-${index}`} onClick={item.onClick||onPlayersClick}><i className={`mcDot ${item.tone||"warn"}`}/><Avatar item={item}/><span><strong>{item.name||item.title}</strong><small>{item.detail||"Review player status"}</small></span><em>›</em></button>):<div className="mcEmpty">No urgent player follow-up.</div>}</div><button type="button" className="mcTextLink" onClick={onPlayersClick}>View all players ›</button></section>

        <section className="mcPanel mcProgress"><div className="mcPanelHead"><span>Mission Progress</span></div><div className="mcRing" style={{"--progress":`${readiness*3.6}deg`}}><div><strong>{readiness}%</strong><span>Team Progress</span></div></div><p>{activeCount} / {rosterSize||0}<small>Team makes this week</small></p><button type="button" className="mcTextLink" onClick={onActiveTodayClick}>View details ›</button></section>
      </div>

      <div className="mcBottomGrid">
        <section className="mcPanel mcUpcoming"><div className="mcPanelHead"><span>Upcoming Session</span></div><h3>{hasScheduledSession?"Team Practice":"Practice Needed"}<small>Main Gym</small></h3><div className="mcSessionMeta"><span>▣<b>Today</b><small>{hasScheduledSession?nextEventDateFormatted:"Not scheduled"}</small></span><span>♙<b>{confirmed}</b><small>Confirmed</small></span><span>▤<b>{resolvedAttention.length}</b><small>Pending</small></span></div><div className="mcSessionFocus"><small>Focus</small><strong>Game Speed Shooting</strong><p>Catch, shoot, move. Compete.</p></div><div className="mcDualActions"><button type="button" className="mcPrimary" onClick={action}>{hasScheduledSession?"View Plan":"Create Practice"}</button><button type="button" onClick={onScheduleEvent}>Edit Session</button></div></section>

        <section className="mcPanel mcActivity"><div className="mcPanelHead"><span>Recent Activity</span><small>View all</small></div><div className="mcTimeline">{resolvedActivity.length?resolvedActivity.slice(0,4).map((item,index)=><div key={`${item.name||item.title}-${index}`}><i/><Avatar item={item} size={38}/><span><strong>{item.name||item.title}</strong><small>{item.detail||"Recent activity"}</small></span><b>{item.meta||"✓"}</b></div>):<div className="mcEmpty">Activity will appear after players log work.</div>}</div></section>
      </div>

      <section className="mcPanel mcQuick"><div className="mcPanelHead"><span>Coach Quick Actions</span></div><div className="mcQuickGrid">{quickActions.map(item=><button type="button" key={item.label} onClick={item.onClick}><i>{item.icon}</i><span>{item.label}</span></button>)}</div></section>

      <div className="mcToolsRow"><button type="button" onClick={()=>setToolsOpen(value=>!value)} aria-expanded={toolsOpen}>{toolsOpen?"Hide team tools":"Team tools"} {toolsOpen?"−":"+"}</button></div>
      {toolsOpen?<section className="mcPanel mcTools" data-testid="coach-secondary-tools"><div><span>Team code</span><strong>{joinCode||"—"}</strong>{codeErr?<small>{codeErr}</small>:null}</div><div><button type="button" onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{copied?"Copied":"Copy code"}</button><button type="button" onClick={onRegenerateJoinCode}>New code</button></div><span data-testid="coach-team-code-bar"/></section>:null}
    </main>
  </div>;
}
