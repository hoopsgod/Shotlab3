import React, { useMemo, useState } from "react";
import "./CoachCommandCenter.css";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults.js";

const pct=(value,total)=>total>0?Math.round((Math.max(0,Number(value)||0)/total)*100):0;
const initials=(value="")=>String(value).split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"SL";

function Avatar({item,size=42}){
  const src=item?.avatarUrl||item?.photoUrl||item?.imageUrl||"";
  const label=item?.name||item?.title||"Player";
  return src?<img className="mcAvatar" src={src} alt={`${label} headshot`} style={{width:size,height:size}}/>:<span className="mcAvatar mcAvatar--fallback" aria-label={`${label} headshot placeholder`} style={{width:size,height:size}}>{initials(label)}</span>;
}

function CourtArtwork({logoUrl}){
  return <div className="mcCourtScene" aria-hidden="true">
    <div className="mcCourtLights"><span/><span/><span/><span/></div>
    <div className="mcBackboard"><i/><b/></div>
    <div className="mcFloor">
      <span className="mcSideline mcSideline--a"/><span className="mcSideline mcSideline--b"/>
      <span className="mcArc"/><span className="mcLane"/>
      <img src={logoUrl} alt=""/>
    </div>
  </div>;
}

const sideItems=[
  ["Mission Control","▦"],["Players","♙"],["Sessions","▣"],["Drills","◎"],["Analytics","▥"],["Events","□"],["Messages","▱"],["More","•••"],
];

export default function CoachCommandCenter({
  variant="full",totalPlayers,activeTodayCount,nextEventDateFormatted,highlightPlayersAttention,
  onPlayersClick,onActiveTodayClick,onNextEventClick,onAddPlayer,onAddDrill,onScheduleEvent,onLogScore,
  joinCode,onCopyJoinCode,onRegenerateJoinCode,codeErr,attentionItems=[],activityItems=[],
  teamName="Thomas Titans",coachName="Demo Coach",teamLogoUrl=DEFAULT_BRANDING.logoUrl,coachAvatarUrl="",
}){
  const [copied,setCopied]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const isCompact=variant==="compact";
  const rosterSize=Math.max(0,Number(totalPlayers)||0);
  const activeCount=Math.max(0,Number(activeTodayCount)||0);
  const activeRate=pct(activeCount,rosterSize);
  const missionReadiness=Math.max(0,Math.min(100,nextEventDateFormatted?Math.round((activeRate+70)/2):activeRate));
  const resolvedAttention=attentionItems.length?attentionItems:(highlightPlayersAttention?[{title:"Ryan",detail:"Inactive 3 days",tone:"danger",onClick:onPlayersClick},{title:"Avery",detail:"No RSVP",tone:"warn",onClick:onPlayersClick}]:[]);
  const resolvedActivity=activityItems.length?activityItems:[
    {title:"Emma",detail:"Personal Record · 5 min ago",meta:"250",tone:"success"},
    {title:"Jayden",detail:"Completed Lift A · 18 min ago",meta:"✓",tone:"success"},
    {title:"Avery",detail:"RSVP’d to Practice · 24 min ago",meta:"✓",tone:"success"},
    {title:"Mia",detail:"Joined shooting session · 1 hr ago",meta:"↗",tone:"success"},
  ];
  const actionCount=resolvedAttention.length+(nextEventDateFormatted?0:1);
  const statusTitle=nextEventDateFormatted?`Practice in ${nextEventDateFormatted}`:"No session scheduled";
  const confirmed=Math.max(0,rosterSize-resolvedAttention.length);
  const quickActions=useMemo(()=>[
    {label:"Add Player",onClick:onAddPlayer,icon:"♙+"},{label:"Create Session",onClick:onScheduleEvent,icon:"▣+"},
    {label:"Build Mission",onClick:onAddDrill,icon:"◎"},{label:"Log Score",onClick:onLogScore,icon:"▤"},
    {label:"Message Team",onClick:onPlayersClick,icon:"▱"},{label:"View Analytics",onClick:onActiveTodayClick,icon:"▥"},
  ],[onAddDrill,onAddPlayer,onLogScore,onPlayersClick,onActiveTodayClick,onScheduleEvent]);

  if(isCompact)return <section className="missionControlCompact" data-testid="coach-command-center-compact"><div><span>Mission Control</span><strong>{statusTitle}</strong></div><button onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>{nextEventDateFormatted?"Open":"Schedule"}</button></section>;

  return <div className="mcShell">
    <aside className="mcRail" aria-label="Coach dashboard navigation">
      <img className="mcRailLogo" src={teamLogoUrl} alt={`${teamName} logo`}/>
      <nav>{sideItems.map(([label,icon],index)=><button key={label} className={index===0?"is-active":""} onClick={label==="Players"?onPlayersClick:label==="Sessions"||label==="Events"?onNextEventClick:undefined}><i>{icon}</i><span>{label}</span></button>)}</nav>
      <div className="mcCoachIdentity"><span>Coach</span><strong>{coachName}</strong><Avatar item={{name:coachName,avatarUrl:coachAvatarUrl}} size={46}/></div>
    </aside>

    <section className="missionControl" data-testid="coach-command-center-full">
      <header className="mcHeader"><div><h1>Mission <em>Control</em></h1><span className="mcHeaderSub">Coach Dashboard</span></div><div className="mcHeaderRight"><button className="mcTeamSelect">{teamName}<span>⌄</span></button><button className="mcBell" aria-label={`${actionCount} notifications`}>♢<b>{actionCount}</b></button><small>{new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})} &nbsp;•&nbsp; {new Date().toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</small></div></header>

      <section className="mcHero" data-testid="coach-primary-objective">
        <CourtArtwork logoUrl={teamLogoUrl}/><div className="mcHeroShade"/>
        <div className="mcHeroContent"><span className="mcEyebrow">Today’s status</span><h2>{statusTitle}</h2><p><strong>{confirmed}</strong> / {rosterSize||0} players confirmed</p><div className="mcHeroStats"><button onClick={onPlayersClick}><i>♙</i><strong>{resolvedAttention.length}</strong><span>Need attention</span></button><button onClick={onActiveTodayClick}><i>✓</i><strong>{missionReadiness}%</strong><span>Mission readiness</span></button></div><button className="mcPrimary" onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>{nextEventDateFormatted?"Start Practice":"Create Session"}<span>→</span></button></div>
      </section>

      <div className="mcTopGrid">
        <section className="mcPanel mcPulse" data-testid="coach-primary-metrics"><div className="mcPanelHead"><span>Team Pulse</span></div><svg className="mcSpark" viewBox="0 0 260 90" preserveAspectRatio="none"><path d="M0 64 C22 64 26 48 45 50 S67 31 83 48 S104 20 121 32 S147 17 164 40 S192 15 211 31 S236 22 260 15"/></svg><div className="mcPulseStats"><div><strong>{Math.max(activeRate,85)}%</strong><span>Active this week</span></div><div><strong>{missionReadiness}%</strong><span>Mission readiness</span></div><div><strong>92%</strong><span>Weekly volume</span></div></div><button className="mcTextLink" onClick={onActiveTodayClick}>View full pulse ›</button></section>
        <section className="mcPanel mcAttention"><div className="mcPanelHead"><span>Needs Attention</span><b>{resolvedAttention.length}</b></div><div className="mcList">{resolvedAttention.length?resolvedAttention.slice(0,3).map((item,index)=><button key={`${item.title}-${index}`} onClick={item.onClick||onPlayersClick}><i className={`mcDot ${item.tone||"warn"}`}/><Avatar item={item}/><span><strong>{item.name||item.title}</strong><small>{item.detail||"Review player status"}</small></span><em>›</em></button>):<div className="mcEmpty">No urgent player follow-up.</div>}</div><button className="mcTextLink" onClick={onPlayersClick}>View all players ›</button></section>
        <section className="mcPanel mcProgress"><div className="mcPanelHead"><span>Mission Progress</span></div><div className="mcRing" style={{"--progress":`${missionReadiness*3.6}deg`}}><div><strong>{missionReadiness}%</strong><span>Team Progress</span></div></div><p>{activeCount} / {rosterSize||0}<small>Team makes this week</small></p><button className="mcTextLink" onClick={onActiveTodayClick}>View details ›</button></section>
      </div>

      <div className="mcBottomGrid">
        <section className="mcPanel mcUpcoming"><div className="mcPanelHead"><span>Upcoming Session</span></div><h3>Team Practice <small>Main Gym</small></h3><div className="mcSessionMeta"><span>▣<b>Today</b><small>3:30 PM - 5:00 PM</small></span><span>♙<b>{confirmed}</b><small>Confirmed</small></span><span>▤<b>{resolvedAttention.length}</b><small>Pending</small></span></div><div className="mcSessionFocus"><small>Focus</small><strong>Game Speed Shooting</strong><p>Catch, shoot, move. Compete.</p></div><div className="mcDualActions"><button className="mcPrimary" onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>View Plan</button><button onClick={onScheduleEvent}>Edit Session</button></div></section>
        <section className="mcPanel mcActivity"><div className="mcPanelHead"><span>Recent Activity</span><small>View all</small></div><div className="mcTimeline">{resolvedActivity.slice(0,4).map((item,index)=><div key={`${item.title}-${index}`}><i/><Avatar item={item} size={40}/><span><strong>{item.name||item.title}</strong><small>{item.detail}</small></span><b>{item.meta||"✓"}</b></div>)}</div></section>
      </div>

      <section className="mcPanel mcQuick"><div className="mcPanelHead"><span>Coach Quick Actions</span></div><div className="mcQuickGrid">{quickActions.map(action=><button key={action.label} onClick={action.onClick}><i>{action.icon}</i><span>{action.label}</span></button>)}</div></section>

      <div className="mcToolsRow"><button onClick={()=>setToolsOpen(value=>!value)} aria-expanded={toolsOpen}>{toolsOpen?"Hide team tools":"Team tools"} {toolsOpen?"−":"+"}</button></div>
      {toolsOpen?<section className="mcPanel mcTools" data-testid="coach-secondary-tools"><div><span>Team code</span><strong>{joinCode||"—"}</strong>{codeErr?<small>{codeErr}</small>:null}</div><div><button onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{copied?"Copied":"Copy code"}</button><button onClick={onRegenerateJoinCode}>New code</button></div><span data-testid="coach-team-code-bar"/></section>:null}
    </section>
  </div>;
}
