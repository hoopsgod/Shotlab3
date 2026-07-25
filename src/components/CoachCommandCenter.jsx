import React, { useMemo, useState } from "react";
import "./CoachCommandCenter.css";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const pct=(value,total)=>total>0?Math.round((Math.max(0,Number(value)||0)/total)*100):0;
const initials=(value="")=>String(value).split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"SL";

function Avatar({item,size=42}){
  const src=item?.avatarUrl||item?.photoUrl||item?.imageUrl||"";
  const label=item?.name||item?.title||"Player";
  return src?<img className="mcAvatar" src={src} alt={`${label} headshot`} style={{width:size,height:size}}/>:<span className="mcAvatar mcAvatar--fallback" aria-label={`${label} headshot placeholder`} style={{width:size,height:size}}>{initials(label)}</span>;
}

function CourtArtwork(){
  return <svg className="mcCourt" viewBox="0 0 760 380" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="courtGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c8ff00" stopOpacity=".62"/><stop offset="1" stopColor="#c8ff00" stopOpacity=".04"/></linearGradient></defs>
    <rect width="760" height="380" fill="#070b0c"/>
    <path d="M0 70H760M0 132H760M0 194H760M0 256H760M0 318H760" stroke="#c8ff00" strokeOpacity=".08"/>
    <path d="M80 0V380M180 0V380M280 0V380M380 0V380M480 0V380M580 0V380M680 0V380" stroke="#c8ff00" strokeOpacity=".05"/>
    <path d="M465 42h110v75H465zM520 117v82M485 199h70M520 199v63" fill="none" stroke="#c8ff00" strokeWidth="4" strokeOpacity=".72"/>
    <ellipse cx="520" cy="204" rx="28" ry="8" fill="none" stroke="#c8ff00" strokeWidth="4"/>
    <path d="M160 380c34-96 113-157 220-157s186 61 220 157M380 223v157M224 286h312M295 380v-94h170v94" fill="none" stroke="url(#courtGlow)" strokeWidth="3"/>
    <g transform="translate(300 266) rotate(-8)"><circle cx="80" cy="52" r="50" fill="#0b0f10" stroke="#c8ff00" strokeOpacity=".38" strokeWidth="3"/><path d="M30 52h100M80 2c-18 18-27 35-27 50s9 32 27 50M80 2c18 18 27 35 27 50s-9 32-27 50" fill="none" stroke="#c8ff00" strokeOpacity=".3" strokeWidth="3"/><text x="80" y="59" textAnchor="middle" fill="#c8ff00" fontFamily="Impact, sans-serif" fontSize="18" letterSpacing="2">SHOTLAB</text></g>
  </svg>;
}

export default function CoachCommandCenter({
  variant="full",totalPlayers,activeTodayCount,nextEventDateFormatted,highlightPlayersAttention,
  onPlayersClick,onActiveTodayClick,onNextEventClick,onAddPlayer,onAddDrill,onScheduleEvent,onLogScore,
  joinCode,onCopyJoinCode,onRegenerateJoinCode,codeErr,attentionItems=[],activityItems=[],
}){
  const [copied,setCopied]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const isCompact=variant==="compact";
  const rosterSize=Math.max(0,Number(totalPlayers)||0);
  const activeCount=Math.max(0,Number(activeTodayCount)||0);
  const activeRate=pct(activeCount,rosterSize);
  const missionReadiness=Math.max(0,Math.min(100,nextEventDateFormatted?Math.round((activeRate+70)/2):activeRate));
  const resolvedAttention=attentionItems.length?attentionItems:(highlightPlayersAttention?[{title:"Roster follow-up",detail:"Inactive or unresolved player items",tone:"danger",onClick:onPlayersClick}]:[]);
  const resolvedActivity=activityItems.length?activityItems:[
    activeCount>0?{title:`${activeCount} athlete${activeCount===1?"":"s"} active`,detail:"Today",tone:"success"}:null,
    nextEventDateFormatted?{title:"Session scheduled",detail:nextEventDateFormatted,tone:"success"}:null,
  ].filter(Boolean);
  const actionCount=resolvedAttention.length+(nextEventDateFormatted?0:1);
  const statusTitle=nextEventDateFormatted?`Next session ${nextEventDateFormatted}`:"No session scheduled";
  const statusDetail=nextEventDateFormatted?`${Math.max(0,rosterSize-resolvedAttention.length)} / ${rosterSize||0} players currently clear`:`Create the next session and set the team focus.`;
  const quickActions=useMemo(()=>[
    {label:"Add Player",onClick:onAddPlayer,icon:"＋"},{label:"Create Session",onClick:onScheduleEvent,icon:"▣"},
    {label:"Build Mission",onClick:onAddDrill,icon:"◎"},{label:"Log Score",onClick:onLogScore,icon:"✓"},
    {label:"View Players",onClick:onPlayersClick,icon:"◉"},{label:"Open Events",onClick:onNextEventClick,icon:"□"},
  ],[onAddDrill,onAddPlayer,onLogScore,onNextEventClick,onPlayersClick,onScheduleEvent]);

  if(isCompact)return <section className="missionControlCompact" data-testid="coach-command-center-compact"><div><span>Mission Control</span><strong>{statusTitle}</strong></div><button onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>{nextEventDateFormatted?"Open":"Schedule"}</button></section>;

  return <section className="missionControl" data-testid="coach-command-center-full">
    <header className="mcHeader"><div><span className="mcEyebrow">Coach Dashboard</span><h1>Mission <em>Control</em></h1></div><div className="mcHeaderStatus"><span>{new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><b>{actionCount}</b></div></header>

    <section className="mcHero" data-testid="coach-primary-objective">
      <CourtArtwork/>
      <div className="mcHeroOverlay"/>
      <div className="mcHeroContent">
        <span className="mcEyebrow">Today’s status</span>
        <h2>{statusTitle}</h2>
        <p>{statusDetail}</p>
        <div className="mcHeroStats"><button onClick={onPlayersClick}><strong>{resolvedAttention.length}</strong><span>Need attention</span></button><button onClick={onActiveTodayClick}><strong>{missionReadiness}%</strong><span>Mission readiness</span></button></div>
        <button className="mcPrimary" onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>{nextEventDateFormatted?"View Session":"Create Session"}<span>→</span></button>
      </div>
    </section>

    <div className="mcGrid">
      <section className="mcPanel mcPulse" data-testid="coach-primary-metrics"><div className="mcPanelHead"><span>Team Pulse</span><small>Live</small></div><div className="mcPulseLine"><span/><span/><span/><span/><span/></div><div className="mcPulseStats"><div><strong>{activeRate}%</strong><span>Active today</span></div><div><strong>{missionReadiness}%</strong><span>Mission ready</span></div><div><strong>{rosterSize}</strong><span>Roster</span></div></div></section>

      <section className="mcPanel mcAttention"><div className="mcPanelHead"><span>Needs Attention</span><b>{resolvedAttention.length}</b></div><div className="mcList">{resolvedAttention.length?resolvedAttention.slice(0,3).map((item,index)=><button key={`${item.title}-${index}`} onClick={item.onClick||onPlayersClick}><i className={`mcDot ${item.tone||"warn"}`}/><Avatar item={item}/><span><strong>{item.name||item.title}</strong><small>{item.detail||"Review player status"}</small></span><em>›</em></button>):<div className="mcEmpty">No urgent player follow-up.</div>}</div><button className="mcTextLink" onClick={onPlayersClick}>View all players →</button></section>

      <section className="mcPanel mcProgress"><div className="mcPanelHead"><span>Mission Progress</span></div><div className="mcRing" style={{"--progress":`${missionReadiness*3.6}deg`}}><div><strong>{missionReadiness}%</strong><span>Team progress</span></div></div><p>{activeCount} / {rosterSize||0} active today</p><button className="mcTextLink" onClick={onActiveTodayClick}>View details →</button></section>

      <section className="mcPanel mcUpcoming"><div className="mcPanelHead"><span>Upcoming Session</span></div><h3>{nextEventDateFormatted?"Team Session":"Schedule Needed"}</h3><div className="mcSessionMeta"><span>◷ {nextEventDateFormatted||"Not scheduled"}</span><span>◉ {rosterSize} players</span></div><div className="mcSessionFocus"><small>Focus</small><strong>{nextEventDateFormatted?"Game Speed Shooting":"Set the next development focus"}</strong><p>Catch, shoot, move. Compete.</p></div><div className="mcDualActions"><button className="mcPrimary" onClick={nextEventDateFormatted?onNextEventClick:onScheduleEvent}>{nextEventDateFormatted?"View Plan":"Create Session"}</button><button onClick={onScheduleEvent}>Edit</button></div></section>

      <section className="mcPanel mcActivity"><div className="mcPanelHead"><span>Recent Activity</span><small>View all</small></div><div className="mcTimeline">{resolvedActivity.length?resolvedActivity.slice(0,4).map((item,index)=><div key={`${item.title}-${index}`}><i/><Avatar item={item} size={40}/><span><strong>{item.name||item.title}</strong><small>{item.detail||"Recent"}</small></span><b>{item.meta||"✓"}</b></div>):<div className="mcEmpty">Activity will appear after players begin logging work.</div>}</div></section>
    </div>

    <section className="mcPanel mcQuick"><div className="mcPanelHead"><span>Coach Quick Actions</span></div><div className="mcQuickGrid">{quickActions.map(action=><button key={action.label} onClick={action.onClick}><i>{action.icon}</i><span>{action.label}</span></button>)}</div></section>

    <div className="mcToolsRow"><button onClick={()=>setToolsOpen(value=>!value)} aria-expanded={toolsOpen}>{toolsOpen?"Hide team tools":"Team tools"} {toolsOpen?"−":"+"}</button></div>
    {toolsOpen?<section className="mcPanel mcTools" data-testid="coach-secondary-tools"><div><span>Team code</span><strong>{joinCode||"—"}</strong>{codeErr?<small>{codeErr}</small>:null}</div><div><button onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{copied?"Copied":"Copy code"}</button><button onClick={onRegenerateJoinCode}>New code</button></div><span data-testid="coach-team-code-bar"/></section>:null}
  </section>;
}
