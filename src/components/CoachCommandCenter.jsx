import React from "react";
import Button from "./ui/Button";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

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
}) {
  const isCompact=variant==="compact";
  const metricBase={
    minHeight:56,
    borderRadius:12,
    border:"1px solid var(--stroke-1)",
    background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
    padding:"10px 10px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
  };

  const quickBtnClass=(isPrimary)=>`btn ${isPrimary?"btn--primary":"btn--secondary"}`;
  const compactClass=(isPrimary)=>`btn btn--sm ${isPrimary?"btn--primary":"btn--secondary"}`;

  if(isCompact){
    return (
      <section style={{padding:"8px 12px 12px"}}>
        <div style={{minHeight:62,border:"1px solid var(--stroke-1)",borderRadius:14,background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.22))",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span aria-hidden="true" style={{width:24,height:24,borderRadius:999,border:"1px solid var(--stroke-1)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",fontSize:13,flexShrink:0}}>⚡</span>
            <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0,whiteSpace:"nowrap"}}>Coach Tools</h2>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <button type="button" onClick={onAddPlayer} aria-label="Add player" className={compactClass(primaryQuickAction==="addPlayer")}>+ Player</button>
            <button type="button" onClick={onAddDrill} aria-label="Add drill" className={compactClass(primaryQuickAction==="addDrill")}>+ Drill</button>
            <button type="button" onClick={onScheduleEvent} aria-label="Schedule event" className={compactClass(primaryQuickAction==="scheduleEvent")}>+ Event</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"12px 12px 14px"}}>
      <div style={{marginTop:2,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8}}>
        <button type="button" onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:"none"}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--accent)"}}>{totalPlayers}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{activeTodayCount}</div>
        </button>

        <button type="button" onClick={onNextEventClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"var(--tracking-default)",color:"var(--text-tertiary)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div style={{marginTop:5,fontFamily:FD,fontSize:16,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{nextEventDateFormatted}</div>
        </button>
      </div>

      <div style={{marginTop:10,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:2}}>
        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={onAddPlayer} className={quickBtnClass(primaryQuickAction==="addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} className={quickBtnClass(primaryQuickAction==="addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} className={quickBtnClass(primaryQuickAction==="scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} className="btn btn--tertiary">+ Log Score</button>
        </div>
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid var(--stroke-1)",borderRadius:14,background:"var(--surface-2)"}}>
        <div className="u-meta-label" style={{fontFamily:FB,fontSize:10,color:"var(--text-2)"}}>TEAM CODE</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:FD,fontSize:25,color:"var(--text-1)",letterSpacing:4,minWidth:114,lineHeight:1}}>{joinCode||"—"}</div>
          <Button onClick={onCopyJoinCode} variant="secondary" className="btn--sm">Copy</Button>
          <Button onClick={onRegenerateJoinCode} variant="tertiary" className="btn--sm">Regenerate</Button>
        </div>
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
