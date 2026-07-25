import React, { useMemo, useState } from "react";
import "./CoachCommandCenter.css";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

const pct=(value,total)=>total>0?Math.round((Math.max(0,Number(value)||0)/total)*100):0;

const utilityButtonStyle={
  flex:"0 0 auto",
  minHeight:40,
  padding:"0 12px",
  borderRadius:10,
  border:"1px solid var(--stroke-1)",
  background:"rgba(255,255,255,0.022)",
  color:"var(--text-2)",
  fontFamily:FB,
  fontSize:10,
  fontWeight:800,
  letterSpacing:"0.04em",
  textTransform:"uppercase",
  cursor:"pointer",
  whiteSpace:"nowrap",
};

export default function CoachCommandCenter({
  variant="full",
  totalPlayers,
  activeTodayCount,
  nextEventDateFormatted,
  highlightPlayersAttention,
  primaryQuickAction,
  onPlayersClick,
  onActiveTodayClick,
  onNextEventClick,
  onAddPlayer,
  onAddDrill,
  onScheduleEvent,
  onLogScore,
  joinCode,
  onCopyJoinCode,
  onRegenerateJoinCode,
  codeErr,
  attentionItems=[],
}) {
  const [copied,setCopied]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const isCompact=variant==="compact";
  const quickActions=useMemo(()=>[
    {key:"addPlayer",label:"Add Player",onClick:onAddPlayer},
    {key:"addDrill",label:"Add Drill",onClick:onAddDrill},
    {key:"scheduleEvent",label:"Create Event",onClick:onScheduleEvent},
    {key:"logScore",label:"Log Score",onClick:onLogScore},
  ],[onAddDrill,onAddPlayer,onLogScore,onScheduleEvent]);

  const rosterSize=Math.max(0,Number(totalPlayers)||0);
  const activeCount=Math.max(0,Number(activeTodayCount)||0);
  const activeRate=pct(activeCount,rosterSize);
  const resolvedAttention=attentionItems.length?attentionItems:(highlightPlayersAttention?[{title:"Athletes need follow-up",detail:"Review inactive or unresolved player items",meta:"Players",onClick:onPlayersClick}]:[]);
  const actionCount=resolvedAttention.length+(nextEventDateFormatted?0:1);
  const briefTitle=actionCount>0?`${actionCount} action${actionCount===1?"":"s"} need your attention`:"Your program is ready for today";
  const briefDetail=resolvedAttention[0]?.detail||(!nextEventDateFormatted?"No upcoming team session is scheduled.":`${activeCount} of ${rosterSize} athletes are active today.`);
  const briefAction=resolvedAttention[0]?.onClick?{label:"Review actions",onClick:resolvedAttention[0].onClick}:(!nextEventDateFormatted?{label:"Schedule session",onClick:onScheduleEvent}:{label:"Open players",onClick:onPlayersClick});

  if(isCompact){
    return <section className="coachTodayBrief coachTodayBrief--compact" data-testid="coach-command-center-compact">
      <div><div className="coachTodayBrief__eyebrow">Today</div><div className="coachTodayBrief__compactTitle">{briefTitle}</div></div>
      <button type="button" onClick={briefAction.onClick} className="coachTodayBrief__primaryButton">{briefAction.label}</button>
    </section>;
  }

  return <section className="coachTodayBrief" data-testid="coach-command-center-full">
    <div data-testid="coach-primary-objective" className="coachTodayBrief__hero">
      <div className="coachTodayBrief__copy">
        <div className="coachTodayBrief__eyebrow">Today’s coaching brief</div>
        <h2>{briefTitle}</h2>
        <p>{briefDetail}</p>
        {resolvedAttention.length>0?<div className="coachTodayBrief__attentionPreview">
          {resolvedAttention.slice(0,2).map((item,index)=><button type="button" key={`${item.title}-${index}`} onClick={item.onClick||onPlayersClick}>
            <span className="coachTodayBrief__dot" aria-hidden="true"/>
            <span><strong>{item.title}</strong>{item.detail?<small>{item.detail}</small>:null}</span>
            <span className="coachTodayBrief__chevron">›</span>
          </button>)}
        </div>:null}
      </div>
      <button type="button" onClick={briefAction.onClick} className="coachTodayBrief__primaryButton">{briefAction.label}</button>
    </div>

    <div data-testid="coach-primary-metrics" className="coachTodayBrief__metrics">
      <button type="button" onClick={onActiveTodayClick}><strong>{activeCount}/{rosterSize||0}</strong><span>Active today</span><small>{activeRate}% of roster</small></button>
      <button type="button" onClick={onNextEventClick}><strong>{nextEventDateFormatted||"—"}</strong><span>Next session</span><small>{nextEventDateFormatted?"Scheduled":"Not set"}</small></button>
      <button type="button" onClick={onPlayersClick}><strong>{highlightPlayersAttention?"Review":"Ready"}</strong><span>Roster status</span><small>{highlightPlayersAttention?"Follow-up needed":"No urgent flags"}</small></button>
    </div>

    <div className="coachTodayBrief__toolsToggleRow">
      <button type="button" onClick={()=>setToolsOpen(value=>!value)} aria-expanded={toolsOpen} className="coachTodayBrief__toolsToggle">{toolsOpen?"Hide coach tools":"Coach tools"} <span aria-hidden="true">{toolsOpen?"−":"+"}</span></button>
    </div>

    {toolsOpen?<div className="coachTodayBrief__toolsPanel fade-up">
      <div data-testid="coach-secondary-tools" role="group" aria-label="Coach utility actions" className="coachTodayBrief__actions">
        {quickActions.map(action=><button key={action.key} type="button" onClick={action.onClick} style={utilityButtonStyle}>{action.label}</button>)}
      </div>
      <div data-testid="coach-team-code-bar" className="coachTodayBrief__teamCode">
        <div><span>Team code</span><strong>{joinCode||"—"}</strong>{codeErr?<small>{codeErr}</small>:null}</div>
        <div className="coachTodayBrief__teamCodeActions">
          <button type="button" onClick={()=>{onCopyJoinCode?.();setCopied(true);setTimeout(()=>setCopied(false),1600);}} style={{...utilityButtonStyle,border:"1px solid var(--accent)",color:"var(--accent)"}}>{copied?"Copied":"Copy"}</button>
          <button type="button" onClick={onRegenerateJoinCode} style={utilityButtonStyle}>New code</button>
        </div>
      </div>
    </div>:null}
  </section>;
}
