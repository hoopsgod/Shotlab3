import { useState } from "react";

export default function Auth({runtime,onLogin,onRegister,onDemo,onCreateJoinContext,accountNotice="",onClearAccountNotice=()=>{}}){
const {BG,BORDER_CLR,CARD_BG,CourtBG,DEMO_COACH,DEMO_PLAYER,DrillIcon,FB,FD,GlowOrb,LIGHT,LegalSupportLinks,MUTED,ORANGE,SLLogo,TOKENS,VOLT}=runtime;
const[mode,setMode]=useState("login"),[role,setRole]=useState("player"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[inviteCode,setInviteCode]=useState(""),[err,setErr]=useState("");
const roleTracks={
  player:{
    label:"Player onboarding",
    subtitle:"Link with your coach and carry your progress history forward.",
    steps:["Create player identity","Enter team code","Unlock daily progression + momentum"],
  },
  coach:{
    label:"Coach onboarding",
    subtitle:"Create your team identity, own roster standards, and guide every player path.",
    steps:["Create coach identity","Launch team HQ","Invite and manage player memberships"],
  },
};
const activeTrack=roleTracks[role]||roleTracks.player;
const doLogin=async()=>{
onClearAccountNotice();
const e=email.trim().toLowerCase();if(!e){setErr("Enter your email");return}
if(!password){setErr("Enter your password");return}
const id=e.includes("@")?e:e+"@shotlab.app";
const r=await onLogin(id,password);
if(!r.ok)setErr(r.err);
};
const doRegister=async()=>{
onClearAccountNotice();
const e=email.trim().toLowerCase();if(!e){setErr("Enter your email");return}
if(!name.trim()){setErr("Enter your name");return}
if(!password||password.length<4){setErr("Password must be at least 4 characters");return}
const id=e.includes("@")?e:e+"@shotlab.app";
if(role==="player"&&inviteCode.trim()){
const invite=await onCreateJoinContext(inviteCode,id);
if(!invite?.ok){setErr(invite?.err||"Team code is invalid or expired.");return}
}
const r=await onRegister(id,password,name.trim(),role);
if(!r.ok)setErr(r.err);
if(r?.pendingConfirmation){setMode("login");setPassword("");setErr(r.message||"Account created. Check your email to confirm your account, then log in.");}
};
const doDemo=async(kind="player")=>{
onClearAccountNotice();
const acct=kind==="coach"?DEMO_COACH:DEMO_PLAYER;
setErr("");
setEmail(acct.email);
setPassword(acct.password);
const demo=await onDemo(kind);
if(!demo.ok)setErr(demo.err||"Unable to start demo.");
};
const inp={width:"100%",height:52,padding:"0 16px",background:"#141414",border:"1px solid #333333",borderRadius:12,color:LIGHT,fontSize:14,fontFamily:FB,fontWeight:500,outline:"none",transition:"border-color .15s ease, box-shadow .15s ease"};
return <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"flex-start",justifyContent:"center",position:"relative",overflowX:"hidden",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"max(18px, env(safe-area-inset-top, 0px)) 0 max(24px, env(safe-area-inset-bottom, 0px))"}}>
<CourtBG opacity={.024}/><GlowOrb color={VOLT} top="15%" left="50%" size={400}/><GlowOrb color={ORANGE} top="85%" left="30%" size={250}/>
<div className="fade-up" style={{position:"relative",zIndex:1,width:"100%",maxWidth:400,padding:"0 24px"}}>
<div style={{textAlign:"center",marginBottom:28,position:"relative"}}>
<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:.08,pointerEvents:"none"}}><SLLogo size={140}/></div>
<div className="auth-ball-enter" style={{display:"inline-flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}><div className="ball-spin"><DrillIcon type="ft" size={60}/></div><div className="auth-shadow-enter" style={{width:40,height:6,marginTop:8,background:"rgba(0,0,0,0.4)",borderRadius:"50%"}}/></div>
</div>
<h1 style={{fontFamily:FD,fontSize:72,color:LIGHT,textAlign:"center",margin:0,lineHeight:.85,letterSpacing:4}}>SHOT<span style={{color:VOLT}}>LAB</span></h1>
<p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:13,letterSpacing:5,margin:"8px 0 0",fontWeight:500}}>OFFSEASON DEVELOPMENT PROGRAM</p>
<div style={{display:"flex",alignItems:"center",gap:12,margin:"32px auto",maxWidth:200}}><div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${VOLT}44)`}}/><div style={{width:6,height:6,borderRadius:"50%",background:VOLT,opacity:.6}}/><div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${VOLT}44)`}}/></div>
<div className="auth-card-enter" style={{background:`linear-gradient(180deg,${CARD_BG},#141414)`,borderRadius:24,padding:"36px 28px",border:`1px solid ${BORDER_CLR}`}}>
{accountNotice&&<div role="status" style={{background:"rgba(200,255,0,0.10)",border:`1px solid ${VOLT}44`,borderRadius:12,padding:"12px 14px",fontFamily:FB,color:LIGHT,fontSize:12,lineHeight:1.45,marginBottom:16}}>{accountNotice}</div>}
{/* Login / Register toggle */}
<div style={{display:"flex",background:"#1E1E1E",borderRadius:12,padding:2,marginBottom:24,border:"1px solid #242424"}}>
{["login","register"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("")}} style={{flex:1,height:44,borderRadius:10,border:"none",cursor:"pointer",fontFamily:FD,fontSize:16,letterSpacing:3,textTransform:"uppercase",transition:"all .15s ease",background:mode===m?VOLT:"transparent",color:mode===m?"#000000":"#555555",fontWeight:mode===m?700:600}}>{m==="login"?"SIGN IN":"REGISTER"}</button>)}
</div>

    {mode==="register"&&<>
      <h2 style={{fontFamily:FD,color:LIGHT,fontSize:24,textAlign:"center",margin:"0 0 4px",letterSpacing:2}}>CREATE ACCOUNT</h2>
      <p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:13,margin:"0 0 22px"}}>Start a persistent ShotLab identity for your team</p>
      <div style={{marginBottom:18,padding:"12px 12px 10px",borderRadius:12,border:`1px solid ${BORDER_CLR}`,background:"rgba(255,255,255,0.02)"}}>
        <div style={{fontFamily:FB,color:VOLT,fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{activeTrack.label}</div>
        <div style={{fontFamily:FB,color:LIGHT,fontSize:12,lineHeight:1.4,marginTop:5}}>{activeTrack.subtitle}</div>
        <div style={{marginTop:8,display:"grid",gap:4}}>
          {activeTrack.steps.map((step,index)=><div key={step} style={{fontFamily:FB,color:TOKENS.TEXT_MUTED,fontSize:10,display:"flex",gap:6}}><span style={{color:VOLT,fontWeight:700}}>{index+1}.</span><span>{step}</span></div>)}
        </div>
      </div>
      {/* Role selector */}
      <div style={{display:"flex",background:BG,borderRadius:10,padding:3,marginBottom:20,border:`1px solid ${BORDER_CLR}`}}>
        {["player","coach"].map(r=><button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase",transition:"all .25s",background:role===r?VOLT+"15":"transparent",color:role===r?VOLT:"#555555"}}>{r}</button>)}
      </div>
      <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>YOUR NAME</label>
      <input type="text" value={name} onChange={e=>{setName(e.target.value);setErr("")}} placeholder="First Last" style={{...inp,marginBottom:14}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
      {role==="player"&&<>
        <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>TEAM JOIN CODE</label>
        <input type="text" value={inviteCode} onChange={e=>{setInviteCode(e.target.value.toUpperCase());setErr("")}} placeholder="ENTER COACH INVITE CODE" style={{...inp,marginBottom:14,textTransform:"uppercase",letterSpacing:2}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>
      </>}
    </>}

    {mode==="login"&&<>
      <h2 style={{fontFamily:FB,color:LIGHT,fontSize:28,fontWeight:900,textAlign:"center",margin:"0 0 4px",letterSpacing:1.5,textTransform:"uppercase"}}>WELCOME BACK</h2>
      <p style={{fontFamily:FB,color:"#A0A0A0",textAlign:"center",fontSize:13,fontWeight:400,margin:"0 0 22px"}}>Return to your team command center and player progression</p>
    </>}

    <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>EMAIL</label>
    <input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder="you@example.com" style={{...inp,marginBottom:14}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>

    <label style={{fontFamily:FB,color:"#A0A0A0",fontSize:10,fontWeight:700,letterSpacing:3,display:"block",marginBottom:6}}>PASSWORD</label>
    <input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder={mode==="register"?"Min 4 characters":"••••••••"} style={{...inp,marginBottom:err?8:20}} onFocus={e=>{e.target.style.borderColor=VOLT;e.target.style.boxShadow="0 0 0 3px rgba(200,255,0,0.08)"}} onBlur={e=>{e.target.style.borderColor="#333333";e.target.style.boxShadow="none"}}/>

    {err&&<p style={{fontFamily:FB,color:"#FF4545",fontSize:12,margin:"0 0 14px"}}>{err}</p>}

    <button className="btn-v cta-primary" onClick={mode==="login"?doLogin:doRegister} style={{}}>
      {mode==="login"?"SIGN IN":"CREATE ACCOUNT"} &#8594;
    </button>
    {mode==="login"&&<><div style={{display:"flex",alignItems:"center",gap:10,width:"100%",margin:"8px 0 12px"}}><div style={{height:1,background:"#242424",flex:1}}/><div style={{width:4,height:4,borderRadius:"50%",background:"#555555"}}/><div style={{height:1,background:"#242424",flex:1}}/></div><div className="auth-demo-enter" style={{display:"flex",gap:12,justifyContent:"center",marginTop:0,opacity:0}}>
      <button onClick={()=>doDemo("player")} className="btn-v" style={{height:44,padding:"0 20px",background:"#213217",color:"#E6FFD0",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:"0.08em",border:"1px solid #78FF4D",boxShadow:"0 0 0 1px rgba(120,255,77,0.2), 0 8px 20px rgba(72,168,44,0.25)",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Player</button>
      <button onClick={()=>doDemo("coach")} className="btn-v" style={{height:44,padding:"0 20px",background:"#213217",color:"#E6FFD0",fontFamily:FB,fontSize:12,fontWeight:700,letterSpacing:"0.08em",border:"1px solid #78FF4D",boxShadow:"0 0 0 1px rgba(120,255,77,0.2), 0 8px 20px rgba(72,168,44,0.25)",borderRadius:10,cursor:"pointer",textTransform:"uppercase"}}>Demo Coach</button>
    </div></>}

    <p style={{fontFamily:FB,color:MUTED,textAlign:"center",fontSize:12,marginTop:16,cursor:"pointer"}} onClick={()=>{setMode(mode==="login"?"register":"login");setErr("")}}>
      {mode==="login"?"Don't have an account? ":"Already have an account? "}
      <span style={{color:VOLT,fontWeight:700}}>{mode==="login"?"Register":"Sign In"}</span>
    </p>
    {mode==="register"&&<p style={{fontFamily:FB,color:MUTED+"88",textAlign:"center",fontSize:10,marginTop:12,lineHeight:1.5}}>By creating an account, you agree to the <a href="/terms" style={{color:VOLT,textDecoration:"none",fontWeight:700}}>Terms</a> and acknowledge the <a href="/privacy" style={{color:VOLT,textDecoration:"none",fontWeight:700}}>Privacy Policy</a>. You can request account deletion or a data export from the legal links below.</p>}
    <LegalSupportLinks/>
  </div>
</div>

  </div>;
}
