import { useState } from "react";

export default function Auth({runtime,onLogin,onRegister,onDemo,onCreateJoinContext,accountNotice="",onClearAccountNotice=()=>{}}){
const {BG,DEMO_COACH,DEMO_PLAYER,DrillIcon,LegalSupportLinks,SLLogo}=runtime;
const[mode,setMode]=useState("login"),[role,setRole]=useState("player"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[inviteCode,setInviteCode]=useState(""),[err,setErr]=useState("");
const roleTracks={
  player:{
    label:"Player setup",
    subtitle:"Connect with your team and carry every training result forward.",
    steps:["Create your player identity","Enter your team code","Start your daily training plan"],
  },
  coach:{
    label:"Coach setup",
    subtitle:"Create your program, invite players, and lead from one command center.",
    steps:["Create your coach identity","Set up your team","Invite your roster"],
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
const focusInput=(event)=>{event.currentTarget.style.borderColor="rgba(95,118,0,.55)";event.currentTarget.style.boxShadow="0 0 0 4px rgba(126,158,30,.10)";};
const blurInput=(event)=>{event.currentTarget.style.borderColor="rgba(17,26,33,.14)";event.currentTarget.style.boxShadow="inset 0 1px 2px rgba(17,26,33,.025)";};
const inp={width:"100%",height:52,padding:"0 15px",background:"#F8F7F2",border:"1px solid rgba(17,26,33,.14)",borderRadius:14,color:"#111A21",fontSize:15,fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontWeight:550,outline:"none",boxShadow:"inset 0 1px 2px rgba(17,26,33,.025)",transition:"border-color .15s ease, box-shadow .15s ease"};
const labelStyle={display:"block",marginBottom:7,color:"#58646D",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"-.005em"};
const segmentButton=(active)=>({flex:1,minHeight:42,borderRadius:11,border:"none",cursor:"pointer",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"-.01em",transition:"all .15s ease",background:active?"#FFFFFF":"transparent",color:active?"#111A21":"#65717A",boxShadow:active?"0 1px 2px rgba(17,26,33,.06),0 6px 16px rgba(17,26,33,.05)":"none"});
return <div data-testid="auth-workspace" style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"flex-start",justifyContent:"center",position:"relative",overflowX:"hidden",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"max(22px, env(safe-area-inset-top, 0px)) 0 max(30px, env(safe-area-inset-bottom, 0px))"}}>
<div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(circle at 84% 4%, rgba(126,158,30,.09), transparent 27rem), linear-gradient(180deg,#FAF9F5 0%,#F3F1EA 70%)"}}/>
<div className="fade-up" style={{position:"relative",zIndex:1,width:"100%",maxWidth:460,padding:"0 18px"}}>
<header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,margin:"0 4px 22px"}}>
  <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
    <div style={{width:48,height:48,borderRadius:15,display:"grid",placeItems:"center",background:"#0D171E",boxShadow:"0 10px 24px rgba(13,23,30,.14)"}}><SLLogo size={30}/></div>
    <div style={{minWidth:0}}>
      <div style={{color:"#111A21",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:20,fontWeight:800,letterSpacing:"-.035em"}}>ShotLab</div>
      <div style={{color:"#65717A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:11,fontWeight:650,marginTop:2}}>Performance development</div>
    </div>
  </div>
  <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 10px",border:"1px solid rgba(17,26,33,.09)",borderRadius:999,background:"rgba(255,255,255,.62)",color:"#617900",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:10,fontWeight:750,letterSpacing:".05em",textTransform:"uppercase"}}><span style={{width:6,height:6,borderRadius:999,background:"#8CAB12"}}/>Team ready</div>
</header>

<section style={{margin:"0 4px 22px"}}>
  <div style={{color:"#617900",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:11,fontWeight:750,letterSpacing:".08em",textTransform:"uppercase"}}>Built for the work between games</div>
  <h1 style={{maxWidth:390,margin:"9px 0 0",color:"#111A21",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:"clamp(38px,10vw,52px)",fontWeight:820,lineHeight:.98,letterSpacing:"-.055em"}}>Train with intent.<br/>Lead with clarity.</h1>
  <p style={{maxWidth:400,margin:"14px 0 0",color:"#4F5D67",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:15,lineHeight:1.5,letterSpacing:"-.012em"}}>One focused workspace for player development, team accountability, and measurable progress.</p>
</section>

<div className="auth-card-enter" style={{background:"rgba(255,255,255,.92)",borderRadius:26,padding:"24px 22px",border:"1px solid rgba(17,26,33,.09)",boxShadow:"0 2px 4px rgba(17,26,33,.04),0 24px 70px rgba(17,26,33,.10)",WebkitBackdropFilter:"blur(20px)",backdropFilter:"blur(20px)"}}>
{accountNotice&&<div role="status" style={{background:"rgba(126,158,30,.09)",border:"1px solid rgba(126,158,30,.22)",borderRadius:14,padding:"12px 14px",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",color:"#334006",fontSize:13,lineHeight:1.45,marginBottom:16}}>{accountNotice}</div>}
<div role="tablist" aria-label="Authentication mode" style={{display:"flex",background:"#F0EEE7",borderRadius:14,padding:3,marginBottom:24,border:"1px solid rgba(17,26,33,.07)"}}>
{["login","register"].map(m=><button key={m} type="button" role="tab" aria-selected={mode===m} onClick={()=>{setMode(m);setErr("")}} style={segmentButton(mode===m)}>{m==="login"?"Sign in":"Create account"}</button>)}
</div>

{mode==="register"&&<>
  <div style={{marginBottom:20}}>
    <h2 style={{color:"#111A21",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:25,fontWeight:780,lineHeight:1.05,letterSpacing:"-.035em",margin:0}}>Build your ShotLab identity</h2>
    <p style={{color:"#65717A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:13,lineHeight:1.45,margin:"7px 0 0"}}>Your team history and progress stay connected to this account.</p>
  </div>
  <div role="radiogroup" aria-label="Account type" style={{display:"flex",background:"#F8F7F2",borderRadius:13,padding:3,marginBottom:18,border:"1px solid rgba(17,26,33,.09)"}}>
    {["player","coach"].map(r=><button key={r} type="button" role="radio" aria-checked={role===r} onClick={()=>setRole(r)} style={segmentButton(role===r)}>{r==="player"?"Player":"Coach"}</button>)}
  </div>
  <div style={{marginBottom:18,padding:"14px",borderRadius:16,border:"1px solid rgba(17,26,33,.08)",background:"#F8F7F2"}}>
    <div style={{color:"#617900",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:10,fontWeight:750,letterSpacing:".08em",textTransform:"uppercase"}}>{activeTrack.label}</div>
    <div style={{color:"#26323A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:13,lineHeight:1.42,marginTop:6}}>{activeTrack.subtitle}</div>
    <div style={{marginTop:10,display:"grid",gap:7}}>{activeTrack.steps.map((step,index)=><div key={step} style={{display:"flex",alignItems:"center",gap:8,color:"#66727A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:11.5}}><span style={{width:20,height:20,borderRadius:7,display:"grid",placeItems:"center",background:"rgba(126,158,30,.11)",color:"#617900",fontSize:10,fontWeight:800}}>{index+1}</span><span>{step}</span></div>)}</div>
  </div>
  <label style={labelStyle}>Your name</label>
  <input type="text" value={name} onChange={e=>{setName(e.target.value);setErr("")}} placeholder="First Last" style={{...inp,marginBottom:15}} onFocus={focusInput} onBlur={blurInput}/>
  {role==="player"&&<><label style={labelStyle}>Team join code</label><input type="text" value={inviteCode} onChange={e=>{setInviteCode(e.target.value.toUpperCase());setErr("")}} placeholder="Enter coach invite code" style={{...inp,marginBottom:15,textTransform:"uppercase",letterSpacing:".08em"}} onFocus={focusInput} onBlur={blurInput}/></>}
</>}

{mode==="login"&&<div style={{marginBottom:20}}><h2 style={{color:"#111A21",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",fontSize:25,fontWeight:780,lineHeight:1.05,letterSpacing:"-.035em",margin:0}}>Welcome back</h2><p style={{color:"#65717A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:13,lineHeight:1.45,margin:"7px 0 0"}}>Return to your team command center and training plan.</p></div>}

<label style={labelStyle}>Email</label>
<input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder="you@example.com" style={{...inp,marginBottom:15}} onFocus={focusInput} onBlur={blurInput}/>
<label style={labelStyle}>Password</label>
<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?doLogin():doRegister())} placeholder={mode==="register"?"Minimum 4 characters":"••••••••"} style={{...inp,marginBottom:err?9:20}} onFocus={focusInput} onBlur={blurInput}/>
{err&&<p role="alert" style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",color:"#C33B49",fontSize:13,margin:"0 0 14px",lineHeight:1.4}}>{err}</p>}
<button type="button" className="btn-v cta-primary" onClick={mode==="login"?doLogin:doRegister}>{mode==="login"?"Sign in":"Create account"}<span aria-hidden="true">→</span></button>

{mode==="login"&&<>
  <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",margin:"18px 0 14px"}}><div style={{height:1,background:"rgba(17,26,33,.08)",flex:1}}/><span style={{color:"#65717A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:11,fontWeight:650}}>Explore the app</span><div style={{height:1,background:"rgba(17,26,33,.08)",flex:1}}/></div>
  <div className="auth-demo-enter" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,opacity:1}}>
    <button type="button" onClick={()=>doDemo("player")} className="btn-v" style={{minHeight:48,padding:"0 12px",background:"#F8F7F2",color:"#26323A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:12.5,fontWeight:720,border:"1px solid rgba(17,26,33,.10)",borderRadius:14,cursor:"pointer"}}>Player demo</button>
    <button type="button" onClick={()=>doDemo("coach")} className="btn-v" style={{minHeight:48,padding:"0 12px",background:"#0D171E",color:"#F5F8F9",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:12.5,fontWeight:720,border:"1px solid #0D171E",borderRadius:14,cursor:"pointer",boxShadow:"0 8px 22px rgba(13,23,30,.12)"}}>Coach demo</button>
  </div>
</>}

<button type="button" style={{width:"100%",padding:0,border:0,background:"transparent",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",color:"#65717A",textAlign:"center",fontSize:12.5,marginTop:18,cursor:"pointer"}} onClick={()=>{setMode(mode==="login"?"register":"login");setErr("")}}>{mode==="login"?"New to ShotLab? ":"Already have an account? "}<span style={{color:"#526500",fontWeight:750}}>{mode==="login"?"Create an account":"Sign in"}</span></button>
{mode==="register"&&<p style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",color:"#65717A",textAlign:"center",fontSize:10.5,marginTop:12,lineHeight:1.5}}>By creating an account, you agree to the <a href="/terms" style={{color:"#526500",textDecoration:"none",fontWeight:700}}>Terms</a> and acknowledge the <a href="/privacy" style={{color:"#526500",textDecoration:"none",fontWeight:700}}>Privacy Policy</a>.</p>}
<LegalSupportLinks/>
</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:18,color:"#65717A",fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",fontSize:10.5}}><DrillIcon type="ft" size={18}/><span>Private team data · Progress that carries forward</span></div>
</div>
</div>;
}
