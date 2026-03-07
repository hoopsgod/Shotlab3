const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

const alphaFromHex=(hex,alpha)=>{
  const clean=String(hex||"").replace("#","");
  if(clean.length!==6)return `rgba(200,255,26,${alpha})`;
  const num=Number.parseInt(clean,16);
  if(Number.isNaN(num))return `rgba(200,255,26,${alpha})`;
  const r=(num>>16)&255,g=(num>>8)&255,b=num&255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function TeamLogo({ logoUrl, teamName, size=64, primaryColor="#C8FF1A", badgeStyle="round" }) {
  const radius=badgeStyle==="shield"?18:badgeStyle==="rectangle"?10:999;
  return (
    <div
      style={{
        width:size,
        height:size,
        borderRadius:radius,
        padding:badgeStyle==="rectangle"?8:6,
        background:`linear-gradient(145deg, ${alphaFromHex(primaryColor,0.28)}, rgba(10,10,10,0.9))`,
        border:`1px solid ${alphaFromHex(primaryColor,0.46)}`,
        boxShadow:`0 0 0 2px ${alphaFromHex(primaryColor,0.1)}, 0 8px 18px rgba(0,0,0,0.34)`,
        display:"grid",
        placeItems:"center",
        overflow:"hidden",
        flexShrink:0,
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={`${teamName||"Team"} logo`} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
      ) : (
        <div style={{fontFamily:FD,color:primaryColor,fontSize:Math.max(16,Math.floor(size*0.32)),letterSpacing:1.2}}>{(teamName||"SL").slice(0,2).toUpperCase()}</div>
      )}
    </div>
  );
}

export function TeamIdentity({ branding, teamName, mascotName, motto, mode="bold", compact=false, subtitle, showLogo=true }) {
  const size=compact?48:mode==="bold"?72:58;
  return (
    <div style={{display:"flex",alignItems:"center",gap:compact?10:14,minWidth:0,position:"relative"}}>
      {showLogo ? <div style={{position:"relative"}}>
        <div style={{position:"absolute",inset:"-10px",borderRadius:"50%",background:`radial-gradient(circle, ${alphaFromHex(branding.primaryColor,0.12)} 0%, transparent 70%)`,filter:"blur(4px)"}}/>
        <TeamLogo logoUrl={branding.logoUrl} teamName={teamName} size={size} primaryColor={branding.primaryColor} badgeStyle={branding.badgeStyle}/>
      </div> : null}
      <div style={{minWidth:0}}>
        <div style={{fontFamily:FB,color:"var(--text-3)",fontSize:8,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>Team</div>
        <div style={{fontFamily:FD,color:"#fff",fontSize:compact?20:26,letterSpacing:1.8,lineHeight:1.02,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(branding.useTeamNameInHeader===false?"ShotLab":(teamName||"ShotLab Team")).toUpperCase()}</div>
        <div style={{display:"flex",gap:6,alignItems:"center",marginTop:4,flexWrap:"wrap"}}>
          {(mascotName||subtitle)?<span style={{fontFamily:FB,fontSize:10,color:"var(--text-2)",textTransform:"uppercase",letterSpacing:1.1,fontWeight:600}}>{mascotName||subtitle}</span>:null}
          {motto?<span style={{fontFamily:FB,fontSize:10,color:alphaFromHex(branding.secondaryColor,0.95),textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>“{motto}”</span>:null}
        </div>
      </div>
    </div>
  );
}

export function TeamWatermark({ logoUrl, primaryColor="#C8FF1A", opacity=0.07, size=220 }) {
  if(!logoUrl)return null;
  return (
    <div aria-hidden style={{position:"absolute",right:-28,top:-28,width:size,height:size,opacity:Math.min(opacity,0.045),pointerEvents:"none",filter:"grayscale(0.55)"}}>
      <img src={logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"contain",mixBlendMode:"screen",filter:`drop-shadow(0 0 12px ${alphaFromHex(primaryColor,0.16)})`}}/>
    </div>
  );
}

export function TeamBrandPreview({ branding, teamName }) {
  const modes=["subtle","balanced","bold"];
  return <div style={{display:"grid",gap:10}}>{modes.map(mode=><div key={mode} style={{position:"relative",padding:12,borderRadius:14,border:`1px solid ${alphaFromHex(branding.primaryColor,0.36)}`,background:`linear-gradient(130deg, ${alphaFromHex(branding.primaryColor,mode==="bold"?0.18:0.1)}, rgba(12,17,22,0.95))`}}>
    <TeamWatermark logoUrl={branding.showWatermark?branding.logoUrl:""} primaryColor={branding.primaryColor} opacity={mode==="bold"?0.09:0.05} size={140}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,position:"relative",zIndex:1}}>
      <span style={{fontFamily:FB,color:"var(--text-2)",fontSize:9,textTransform:"uppercase",letterSpacing:1.2}}>{mode} preview</span>
      <span style={{height:3,width:36,borderRadius:999,background:branding.primaryColor}}/>
    </div>
    <div style={{position:"relative",zIndex:1}}><TeamIdentity branding={branding} teamName={teamName} compact={mode==="subtle"} mode={mode}/></div>
  </div>)}</div>;
}
