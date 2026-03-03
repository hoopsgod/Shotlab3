import React, { useEffect, useId, useState } from "react";

const STORAGE_KEY="shotlab-coach-tools-open";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachToolsPanel({ children }) {
  const panelId=useId();
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    try{
      const saved=window.localStorage.getItem(STORAGE_KEY);
      if(saved!==null){
        setOpen(saved==="1");
      }
    }catch{}
  },[]);

  useEffect(()=>{
    try{
      window.localStorage.setItem(STORAGE_KEY,open?"1":"0");
    }catch{}
  },[open]);

  return (
    <section style={{marginBottom:14,borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",background:"linear-gradient(160deg, rgba(18,18,18,0.92), rgba(10,10,10,0.94))",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.03)"}}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={()=>setOpen(v=>!v)}
        style={{height:48,width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"0 14px",border:"none",borderRadius:14,background:"transparent",cursor:"pointer",color:"rgba(255,255,255,0.75)",fontFamily:FB,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",fontSize:11}}
      >
        <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
          <span aria-hidden="true" style={{width:22,height:22,borderRadius:999,border:"1px solid rgba(200,255,0,0.35)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#C8FF00",fontSize:12}}>🏀</span>
          COACH TOOLS
        </span>
        <span aria-hidden="true" style={{display:"inline-flex",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 220ms ease",color:"rgba(200,255,0,0.9)"}}>⌄</span>
      </button>

      <div id={panelId} style={{maxHeight:open?900:0,opacity:open?1:0,overflow:"hidden",transition:"max-height 260ms ease, opacity 200ms ease",borderTop:open?"1px solid rgba(255,255,255,0.08)":"1px solid transparent"}}>
        {children}
      </div>
    </section>
  );
}
