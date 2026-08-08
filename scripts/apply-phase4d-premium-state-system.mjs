import { readFileSync, writeFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase4d-premium-state-system] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected one anchor, found ${count}`);
};

const appPath = "src/App.jsx";
let app = readFileSync(appPath, "utf8");

if (!app.includes('import ShotLabStatePanel from "./components/ShotLabStatePanel.jsx";')) {
  const importAnchor = 'import PlayerDailyCommandCenter from "./components/PlayerDailyCommandCenter.jsx";\n';
  requireOne(app, importAnchor, "PlayerDailyCommandCenter import");
  app = app.replace(importAnchor, `${importAnchor}import ShotLabStatePanel from "./components/ShotLabStatePanel.jsx";\n`);
}

if (!app.includes('data-testid="startup-loading-state"')) {
  const loadingAnchor = 'if(!ready)return <><Styles/><div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,position:"relative",overflow:"hidden"}}><CourtBG opacity={.015}/><div style={{position:"relative",zIndex:1,textAlign:"center"}}><SLLogo size={72} glow/><div style={{fontFamily:FD,fontSize:14,color:VOLT,letterSpacing:6,marginTop:16,animation:"pulse 1.5s infinite"}}>LOADING</div></div></div></>;';
  requireOne(app, loadingAnchor, "legacy startup loading state");
  app = app.replace(loadingAnchor, 'if(!ready)return <><Styles/><main className="phase4dBootState" data-testid="startup-state-shell"><div className="phase4dBootStateInner"><div className="phase4dBootBrand"><SLLogo size={42} glow/><div className="phase4dBootBrandCopy"><div className="phase4dBootBrandTitle">ShotLab</div><div className="phase4dBootBrandDetail">Performance development</div></div></div><ShotLabStatePanel state="loading" eyebrow="Secure team sync" title="Preparing your command center" detail="Loading your team, training plan, and performance history." testId="startup-loading-state"/></div></main></>;');
}

if (!app.includes('data-testid="startup-error-state"')) {
  const errorAnchor = 'if(startupError)return <><Styles/><div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:520,background:CARD_BG,border:`1px solid rgba(255,69,69,0.45)`,borderRadius:16,padding:20}}><div style={{fontFamily:FD,color:"#FF8B8B",fontSize:20,letterSpacing:2,marginBottom:8}}>STARTUP ERROR</div><div style={{fontFamily:FB,color:"#FFB5B5",fontSize:13,lineHeight:1.55}}>{startupError}</div><div style={{fontFamily:FB,color:MUTED,fontSize:11,marginTop:12}}>Check deployment environment variables and network access, then reload.</div><button onClick={()=>window.location.reload()} className="btn-v cta-primary" style={{marginTop:14}}>RELOAD</button></div></div></>;';
  requireOne(app, errorAnchor, "legacy startup error state");
  app = app.replace(errorAnchor, 'if(startupError)return <><Styles/><main className="phase4dBootState" data-testid="startup-state-shell"><div className="phase4dBootStateInner"><div className="phase4dBootBrand"><SLLogo size={42} glow/><div className="phase4dBootBrandCopy"><div className="phase4dBootBrandTitle">ShotLab</div><div className="phase4dBootBrandDetail">Performance development</div></div></div><ShotLabStatePanel state="error" eyebrow="Connection recovery" title="ShotLab could not finish loading" detail={startupError} actionLabel="Reload ShotLab" onAction={()=>window.location.reload()} testId="startup-error-state"/></div></main></>;');
}

writeFileSync(appPath, app);

const authPath = "src/components/AuthWorkspace.jsx";
let auth = readFileSync(authPath, "utf8");
if (!auth.includes('import ShotLabStatePanel from "./ShotLabStatePanel.jsx";')) {
  const importAnchor = 'import { useState } from "react";\n';
  requireOne(auth, importAnchor, "Auth useState import");
  auth = auth.replace(importAnchor, `${importAnchor}import ShotLabStatePanel from "./ShotLabStatePanel.jsx";\n`);
}
if (!auth.includes('data-testid="auth-success-state"')) {
  const noticeAnchor = '{accountNotice&&<div role="status" style={{background:"rgba(126,158,30,.09)",border:"1px solid rgba(126,158,30,.22)",borderRadius:14,padding:"12px 14px",fontFamily:"-apple-system,BlinkMacSystemFont,\'SF Pro Text\',\'Segoe UI\',sans-serif",color:"#334006",fontSize:13,lineHeight:1.45,marginBottom:16}}>{accountNotice}</div>}';
  requireOne(auth, noticeAnchor, "Auth account notice");
  auth = auth.replace(noticeAnchor, '{accountNotice&&<div style={{marginBottom:16}}><ShotLabStatePanel state="success" eyebrow="Account update" title="Request complete" detail={accountNotice} compact surface="light" testId="auth-success-state"/></div>}');
}
if (!auth.includes('data-testid="auth-error-state"')) {
  const errorAnchor = '{err&&<p role="alert" style={{fontFamily:"-apple-system,BlinkMacSystemFont,\'SF Pro Text\',\'Segoe UI\',sans-serif",color:"#C33B49",fontSize:13,margin:"0 0 14px",lineHeight:1.4}}>{err}</p>}';
  requireOne(auth, errorAnchor, "Auth inline error");
  auth = auth.replace(errorAnchor, '{err&&<div style={{margin:"0 0 14px"}}><ShotLabStatePanel state="error" eyebrow="Check your details" title="We could not continue" detail={err} compact surface="light" testId="auth-error-state"/></div>}');
}
writeFileSync(authPath, auth);

const leaderboard = readFileSync("src/components/CompactLeaderboardPreviewCard.jsx", "utf8");
for (const expected of [
  'import ShotLabStatePanel from "./ShotLabStatePanel.jsx";',
  'testId={`leaderboard-${displayState}-state`}',
  'state={recoveryState}',
]) if (!leaderboard.includes(expected)) fail(`leaderboard state integration missing: ${expected}`);

const workspace = readFileSync("src/components/PlayerOperationalWorkspace.jsx", "utf8");
for (const expected of [
  'import ShotLabStatePanel from "./ShotLabStatePanel.jsx";',
  'state={actionLabel ? "first-use" : "empty"}',
  'testId="player-workspace-empty-state"',
]) if (!workspace.includes(expected)) fail(`Player workspace state integration missing: ${expected}`);

const indexPath = "index.html";
let index = readFileSync(indexPath, "utf8");
if (!index.includes('shotlab-phase4d-state-reconciliation')) {
  const anchor = '  <link id="shotlab-phase4c-interaction-material-motion" rel="stylesheet" href="/shotlab-phase4c-interaction-material-motion.css" />';
  requireOne(index, anchor, "Phase 4C stylesheet link");
  index = index.replace(anchor, `${anchor}\n  <link id="shotlab-phase4d-state-reconciliation" rel="stylesheet" href="/shotlab-phase4d-state-reconciliation.css" />`);
  writeFileSync(indexPath, index);
}

console.log("Applied Phase 4D premium state system and final reconciliation.");
