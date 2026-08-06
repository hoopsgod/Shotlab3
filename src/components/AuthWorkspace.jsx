import { useState } from "react";
import styles from "./AuthWorkspace.module.css";

export default function Auth({runtime,onLogin,onRegister,onDemo,onCreateJoinContext,accountNotice="",onClearAccountNotice=()=>{}}){
const {BG,BORDER_CLR,CARD_BG,CourtBG,DEMO_COACH,DEMO_PLAYER,DrillIcon,FB,FD,GlowOrb,LIGHT,LegalSupportLinks,MUTED,ORANGE,SLLogo,TOKENS,VOLT}=runtime;
void BG;void BORDER_CLR;void CARD_BG;void CourtBG;void DrillIcon;void FB;void FD;void GlowOrb;void LIGHT;void MUTED;void ORANGE;void TOKENS;void VOLT;
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
const submit=()=>mode==="login"?doLogin():doRegister();
const switchMode=(next)=>{setMode(next);setErr("");};
return <main className={styles.shell} data-testid="auth-workspace">
  <div className={styles.layout}>
    <section className={styles.brandPanel} aria-label="ShotLab introduction">
      <div className={styles.brandLockup}>
        <span className={styles.logoFrame}><SLLogo size={52}/></span>
        <span>
          <h1 className={styles.wordmark}>SHOT<span className={styles.wordmarkAccent}>LAB</span></h1>
          <span className={styles.productLabel}>Basketball Performance OS</span>
        </span>
      </div>
      <div className={styles.heroCopy}>
        <div className={styles.heroEyebrow}>Train with intent</div>
        <h2 className={styles.heroTitle}>One standard for every rep.</h2>
        <p className={styles.heroText}>A focused development system for coaches who lead the program and players who own the work.</p>
        <div className={styles.proofRow} aria-label="ShotLab product strengths">
          <div className={styles.proofItem}><strong>Daily clarity</strong><span>One next action, not dashboard noise.</span></div>
          <div className={styles.proofItem}><strong>Shared standards</strong><span>Coach direction and player progress stay aligned.</span></div>
          <div className={styles.proofItem}><strong>Career memory</strong><span>Every verified result builds the athlete story.</span></div>
        </div>
      </div>
    </section>

    <section className={styles.card} aria-labelledby="auth-card-title">
      <header className={styles.cardHeader}>
        <div className={styles.cardEyebrow}>{mode==="login"?"Welcome back":"Create your ShotLab identity"}</div>
        <h2 className={styles.cardTitle} id="auth-card-title">{mode==="login"?"Enter your program":"Start your development system"}</h2>
        <p className={styles.cardSubtitle}>{mode==="login"?"Return to your team command center and player progression.":"Set up the account that will carry your team or player history forward."}</p>
      </header>

      {accountNotice&&<div className={styles.notice} role="status">{accountNotice}</div>}
      {err&&<div className={styles.error} role="alert">{err}</div>}

      <div className={styles.segmented} aria-label="Authentication mode">
        {["login","register"].map((item)=><button
          key={item}
          type="button"
          className={`${styles.segmentButton} ${mode===item?styles.segmentButtonActive:""}`}
          aria-pressed={mode===item}
          onClick={()=>switchMode(item)}
        >{item==="login"?"Sign in":"Register"}</button>)}
      </div>

      <div className={styles.form}>
        {mode==="register"&&<>
          <div className={styles.track}>
            <div className={styles.trackLabel}>{activeTrack.label}</div>
            <div className={styles.trackText}>{activeTrack.subtitle}</div>
            <div className={styles.trackSteps}>{activeTrack.steps.map((step,index)=><div className={styles.trackStep} key={step}><strong>{index+1}.</strong><span>{step}</span></div>)}</div>
          </div>
          <div className={styles.roleSelector} aria-label="Account role">
            {["player","coach"].map((item)=><button
              type="button"
              key={item}
              className={`${styles.roleButton} ${role===item?styles.roleButtonActive:""}`}
              aria-pressed={role===item}
              onClick={()=>setRole(item)}
            >{item==="player"?"Player":"Coach"}</button>)}
          </div>
          <label className={styles.field}>
            <span className={styles.label}>Your name</span>
            <input className={styles.input} type="text" value={name} onChange={event=>{setName(event.target.value);setErr("")}} placeholder="First Last" autoComplete="name"/>
          </label>
          {role==="player"&&<label className={styles.field}>
            <span className={styles.label}>Team join code</span>
            <input className={styles.input} type="text" value={inviteCode} onChange={event=>{setInviteCode(event.target.value.toUpperCase());setErr("")}} placeholder="Enter coach invite code" autoCapitalize="characters"/>
          </label>}
        </>}

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input className={styles.input} type="email" autoComplete="email" value={email} onChange={event=>{setEmail(event.target.value);setErr("")}} onKeyDown={event=>event.key==="Enter"&&submit()} placeholder="you@example.com"/>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input className={styles.input} type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={event=>{setPassword(event.target.value);setErr("")}} onKeyDown={event=>event.key==="Enter"&&submit()} placeholder={mode==="register"?"Minimum 4 characters":"Your password"}/>
        </label>

        <button className={`${styles.primaryButton} btn-v cta-primary`} type="button" onClick={submit}>{mode==="login"?"Sign in to ShotLab":"Create account"}<span aria-hidden="true">→</span></button>

        {mode==="login"&&<>
          <div className={styles.divider}>Explore the demo</div>
          <div className={styles.demoRow}>
            <button className={`${styles.demoButton} btn-v`} type="button" onClick={()=>doDemo("player")}>Demo Player</button>
            <button className={`${styles.demoButton} btn-v`} type="button" onClick={()=>doDemo("coach")}>Demo Coach</button>
          </div>
        </>}

        <p className={styles.switchMode}>{mode==="login"?"New to ShotLab? ":"Already have an account? "}<button type="button" onClick={()=>switchMode(mode==="login"?"register":"login")}>{mode==="login"?"Register":"Sign in"}</button></p>
        {mode==="register"&&<p className={styles.legalCopy}>By creating an account, you agree to the <a href="/terms">Terms</a> and acknowledge the <a href="/privacy">Privacy Policy</a>. You can request account deletion or a data export from the legal links below.</p>}
        <LegalSupportLinks/>
      </div>
    </section>
  </div>
</main>;
}
