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
    minHeight:66,
    borderRadius:12,
    border:"1px solid var(--stroke-1)",
    background:"var(--surface-2)",
    padding:"10px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
  };

  if(isCompact){
    return (
      <section style={{padding:"8px 12px 12px"}}>
                <div style={{minHeight:62,border:"1px solid var(--stroke-1)",borderRadius:14,background:"var(--surface-2)",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span aria-hidden="true" style={{width:24,height:24,borderRadius:999,border:"1px solid var(--stroke-1)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",fontSize:13,flexShrink:0}}>⚡</span>
            <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0,whiteSpace:"nowrap"}}>Coach Tools</h2>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <Button type="button" onClick={onAddPlayer} aria-label="Add player" variant={primaryQuickAction==="addPlayer" ? "primary" : "tertiary"} className="cc-tools-btn cc-action-btn" size="md">Add player</Button>
            <Button type="button" onClick={onAddDrill} aria-label="Add drill" variant={primaryQuickAction==="addDrill" ? "primary" : "tertiary"} className="cc-tools-btn cc-action-btn" size="md">Add drill</Button>
            <Button type="button" onClick={onScheduleEvent} aria-label="Schedule event" variant={primaryQuickAction==="scheduleEvent" ? "primary" : "tertiary"} className="cc-tools-btn cc-action-btn" size="md">Schedule event</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{padding:"10px 12px 12px"}}>
            <div style={{marginTop:2,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="u-allcaps-long" style={{fontFamily:FD,fontSize:13,color:"var(--text-secondary)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8}}>
        <button type="button" onClick={onPlayersClick} className="cc-action-btn" style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:"none"}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--accent)"}}>{totalPlayers}</div>
          <div style={{marginTop:3,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>{highlightPlayersAttention?"Needs check-ins":"On track"}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} className="cc-action-btn" style={metricBase}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{activeTodayCount}</div>
          <div style={{marginTop:3,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>Session logs</div>
        </button>

        <button type="button" onClick={onNextEventClick} className="cc-action-btn" style={metricBase}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:"0.02em",color:"var(--text-2)",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div style={{marginTop:5,fontFamily:FD,fontSize:16,fontWeight:900,lineHeight:1,color:"var(--text-1)"}}>{nextEventDateFormatted}</div>
          <div style={{marginTop:3,fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.3}}>Timeline</div>
        </button>
      </div>

      <div style={{marginTop:9,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:2}}>
        <div style={{display:"flex",gap:8}}>
          <Button type="button" onClick={onAddPlayer} className="cc-action-btn" variant={primaryQuickAction==="addPlayer" ? "primary" : "secondary"} size="lg">Add player</Button>
          <Button type="button" onClick={onAddDrill} className="cc-action-btn" variant={primaryQuickAction==="addDrill" ? "primary" : "secondary"} size="lg">Add drill</Button>
          <Button type="button" onClick={onScheduleEvent} className="cc-action-btn" variant={primaryQuickAction==="scheduleEvent" ? "primary" : "secondary"} size="lg">Schedule event</Button>
          <Button type="button" onClick={onLogScore} className="cc-action-btn" variant="tertiary" size="lg">Log score</Button>
        </div>
      </div>

      <div style={{margin:"10px 0 4px",padding:"10px",border:"1px solid var(--stroke-1)",borderRadius:14,background:"var(--surface-2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div>
            <div style={{fontFamily:FB,fontSize:11,color:"var(--text-2)",fontWeight:700,letterSpacing:"0.02em"}}>Team code</div>
            <div style={{fontFamily:FB,fontSize:10,color:"var(--text-2)",letterSpacing:"0.01em",lineHeight:1.35,marginTop:2}}>Share with players to join roster</div>
          </div>
          <div style={{fontFamily:FD,fontSize:"clamp(20px, 5vw, 24px)",color:"var(--text-1)",letterSpacing:4,lineHeight:1,maxWidth:"52%",overflow:"hidden",textOverflow:"ellipsis"}}>{joinCode||"—"}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginTop:10}}>
          <Button onClick={onCopyJoinCode} className="cc-action-btn" variant="tertiary" size="md">Copy code</Button>
          <Button onClick={onRegenerateJoinCode} className="cc-action-btn" variant="tertiary" size="md">Regenerate</Button>
        </div>
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
