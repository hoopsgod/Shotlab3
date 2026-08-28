import { useTeamBranding } from "../context/TeamBrandingContext";
import TOKENS from "../theme/appTokens";

const LIGHT = TOKENS.TEXT_PRIMARY;
const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";

export function SLLogo({size=60,glow=false,opacity:op=1,style:sx}){const {tokens}=useTeamBranding();const logoAccent=tokens?.colors?.logoAccent||"var(--team-brand-logo-accent,var(--accent))";return <img src="./shotlab-brand-logo.png" alt="SL" width={size} height={size} style={{display:"block",objectFit:"contain",opacity:op,borderRadius:size*.18,...(glow?{filter:`drop-shadow(0 0 ${size*.15}px ${logoAccent})`}:{}),...sx}}/>}

export function BrandWordmark({size=30,small}){
const {branding,tokens}=useTeamBranding();
const logoAccent=tokens?.colors?.logoAccent||"var(--team-brand-logo-accent,var(--accent))";
const logoHeight=Math.max(32,Math.round(size*(small?2.75:2.25)));
if(branding?.logoUrl){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minWidth:0,maxWidth:"100%",width:"100%"}}>
    <img src={branding.logoUrl} alt={`${branding?.teamName||"Team"} logo`} style={{height:logoHeight,maxHeight:"98%",maxWidth:"100%",objectFit:"contain"}}/>
  </div>;
}
if(branding?.logoMarkUrl){
  return <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
    <img src={branding.logoMarkUrl} alt="Team logo mark" style={{height:logoHeight*0.9,width:logoHeight*0.9,objectFit:"contain"}}/>
    <div style={{fontFamily:FD,fontSize:size,lineHeight:.85,letterSpacing:small?1.5:3,fontWeight:900,whiteSpace:"nowrap"}}><span style={{color:LIGHT}}>SHOT</span><span style={{color:logoAccent}}>LAB</span></div>
  </div>;
}
return <div style={{fontFamily:FD,fontSize:size,lineHeight:.85,letterSpacing:small?1.5:3,fontWeight:900,whiteSpace:"nowrap"}}><span style={{color:LIGHT}}>SHOT</span><span style={{color:logoAccent}}>LAB</span></div>
}

export function BrandBackdrop(){return <><div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200, 255, 0, 0.04) 0%, transparent 100%)",pointerEvents:"none",zIndex:0}}/><div style={{position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-35%)",opacity:.03,pointerEvents:"none",zIndex:0,width:180}}><SLLogo size={180}/></div></>}
