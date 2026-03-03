import React from "react";

const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";

export default function CoachCommandCenter({
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
  const metricBase={
    minHeight:56,
    borderRadius:12,
    border:"1px solid rgba(200,255,0,0.2)",
    background:"linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
    padding:"10px 10px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    cursor:"pointer",
    textAlign:"left",
  };

  const quickBtn=(isPrimary)=>({
    height:42,
    minWidth:130,
    borderRadius:999,
    border:`1px solid ${isPrimary?"rgba(200,255,0,0.75)":"rgba(200,255,0,0.30)"}`,
    background:isPrimary?"#C8FF00":"rgba(10, 10, 10, 0.72)",
    color:isPrimary?"#0B0A09":"#C8FF00",
    fontFamily:FB,
    fontSize:13,
    fontWeight:700,
    letterSpacing:"0.05em",
    textTransform:"uppercase",
    padding:"0 16px",
    cursor:"pointer",
    boxShadow:isPrimary?"0 4px 14px rgba(200,255,0,0.28)":"none",
    whiteSpace:"nowrap",
  });

  return (
    <section style={{padding:"12px 12px 14px"}}>
      <div style={{marginTop:2,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 style={{fontFamily:FD,fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.15em",color:"rgba(255,255,255,0.82)",margin:0}}>
          Coach Command Center
        </h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:8}}>
        <button type="button" onClick={onPlayersClick} style={{...metricBase,border:highlightPlayersAttention?"1px solid rgba(255,69,69,0.45)":metricBase.border,boxShadow:highlightPlayersAttention?"0 0 0 1px rgba(255,69,69,0.25), 0 0 14px rgba(255,69,69,0.15)":"none"}}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.68)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Players</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"#C8FF00"}}>{totalPlayers}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.68)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Active Today</div>
          <div style={{marginTop:4,fontFamily:FD,fontSize:23,fontWeight:900,lineHeight:1,color:"#C8FF00"}}>{activeTodayCount}</div>
        </button>

        <button type="button" onClick={onNextEventClick} style={metricBase}>
          <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.68)",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>Next Event</div>
          <div style={{marginTop:5,fontFamily:FD,fontSize:16,fontWeight:900,lineHeight:1,color:"#C8FF00"}}>{nextEventDateFormatted}</div>
        </button>
      </div>

      <div style={{marginTop:10,overflowX:"auto",whiteSpace:"nowrap",paddingBottom:2}}>
        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={onAddPlayer} style={quickBtn(primaryQuickAction==="addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} style={quickBtn(primaryQuickAction==="addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} style={quickBtn(primaryQuickAction==="scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} style={quickBtn(false)}>+ Log Score</button>
        </div>
      </div>

      <div style={{margin:"10px 0 4px",padding:"14px 14px",border:"1px solid rgba(200,255,0,0.20)",borderRadius:14,background:"linear-gradient(120deg, rgba(200,255,0,0.09) 0%, rgba(200,255,0,0.03) 35%, rgba(20,20,20,0.9) 100%)"}}>
        <div style={{fontFamily:FB,fontSize:10,letterSpacing:2,color:"#C8FF00",fontWeight:700}}>TEAM CODE</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:FD,fontSize:25,color:"#FFFFFF",letterSpacing:4,minWidth:114,lineHeight:1}}>{joinCode||"—"}</div>
          <button onClick={onCopyJoinCode} style={{padding:"8px 12px",fontSize:10,border:"1px solid #242424",background:"#141414",color:"#FFFFFF",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:1}}>COPY</button>
          <button onClick={onRegenerateJoinCode} style={{padding:"8px 12px",fontSize:10,border:"1px solid #242424",background:"#141414",color:"#FFFFFF",borderRadius:10,cursor:"pointer",fontWeight:700,letterSpacing:1}}>REGENERATE</button>
        </div>
        {codeErr&&<div style={{color:"#FF4545",fontSize:11,marginTop:6}}>{codeErr}</div>}
      </div>
    </section>
  );
}
