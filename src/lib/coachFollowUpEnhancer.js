import React,{useEffect,useMemo,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{loadCoachCoreLoopPlayer,saveCoachCoreLoopAction}from"./coachFollowUpService.js";
import{loadPlayerAssignment,savePlayerAssignment}from"./playerAssignmentService.js";
import{COACH_FOLLOW_UP_CONTEXT_KEY,buildNextAssignmentSuggestion,getCoachResponseContext,parseCoachResponseNote,serializeCoachResponseNote}from"./coachPlayerResponseLoop.js";
if(typeof document!=="undefined")import("./coachFollowUpEnhancer.css");

// Touch target authority lives in CoachActivationPath.css: min-height:44px
const CONTEXT_KEY=COACH_FOLLOW_UP_CONTEXT_KEY,clean=v=>String(v??"").trim(),norm=v=>clean(v).toLowerCase();
const json=(v,f)=>{try{return v?JSON.parse(v):f}catch{return f}};
function context(id="",name=""){
 const store=globalThis?.localStorage,players=json(store?.getItem?.("sl:players"),[]),raw=json(store?.getItem?.("sl:session"),{}),session=Array.isArray(raw)?raw[0]:raw;
 const wanted=norm(id),named=norm(name),target=players.find(p=>wanted&&[p.email,p.player_email,p.playerId,p.player_id,p.id].map(norm).includes(wanted))||players.find(p=>norm(p.name||p.displayName)===named);
 const ids=[target?.email,target?.player_email,target?.playerId,target?.player_id,target?.id].map(norm).filter(Boolean);
 return{teamId:clean(target?.teamId||target?.team_id||session?.teamId||session?.team_id),playerIdentity:ids.includes(wanted)?wanted:ids[0]||wanted,playerName:clean(name||target?.name||target?.displayName||target?.email||"Player")};
}
function drawerContext(drawer){
 const explicit=globalThis?.[CONTEXT_KEY];
 if(explicit?.playerIdentity)return context(explicit.playerIdentity,explicit.playerName);
 return context(clean(document.querySelector('[data-testid="coach-players-filter-rail"] input[type="search"]')?.value),clean(drawer?.querySelector?.('[role="dialog"]')?.getAttribute?.("aria-label")));
}
function retireNudges(){
 document.querySelectorAll("#coach-roster-operations button").forEach(b=>{if(clean(b.textContent).replace(/^✓\s*/,"").toUpperCase()==="NUDGE"){b.hidden=true;b.disabled=true;b.dataset.shotlabLegacyNudgeRetired="true";b.setAttribute("aria-hidden","true")}});
}
const deliveryLabel=s=>s==="completed"?"Player completed":s==="started"?"Player started":s==="acknowledged"?"Player acknowledged":s==="assigned"?"Delivered":"Not delivered";
const stateLabel=s=>s==="completed"?"Completed":s==="planned"?"Planned":"Not recorded";
function CoachFollowUpPanel({context:c}){
 const responseContext=useMemo(()=>getCoachResponseContext({playerIdentity:c.playerIdentity,playerName:c.playerName}),[c.playerIdentity,c.playerName]);
 const[record,setRecord]=useState(null),[delivery,setDelivery]=useState(null),[assignment,setAssignment]=useState(""),[note,setNote]=useState(""),[status,setStatus]=useState("Loading follow-up record…"),[error,setError]=useState(false),[saving,setSaving]=useState(false);
 const saveInFlightRef=useRef(false);
 useEffect(()=>{let live=true;Promise.all([loadCoachCoreLoopPlayer(c),loadPlayerAssignment(c)]).then(([result,deliveryResult])=>{
  if(!live)return;const parsed=parseCoachResponseNote(result.record?.note||"");const confirmedDelivery = deliveryResult.ok ? deliveryResult.assignment || null : null;
  setRecord(result.record||null);setDelivery(confirmedDelivery);setAssignment(deliveryResult.assignment?.assignmentText||parsed.assignment||(responseContext?buildNextAssignmentSuggestion(responseContext):""));setNote(parsed.privateNote);
  const bad=!result.ok||!deliveryResult.ok;setError(bad);setStatus(!deliveryResult.ok?"Player delivery could not be confirmed. Retry when connected.":!result.ok?"Follow-up could not be refreshed. Retry when connected.":confirmedDelivery?`Player delivery status: ${deliveryLabel(confirmedDelivery.state)}.`:responseContext?"Result loaded. Confirm the next assignment.":"No follow-up has been recorded.");
 }).catch(()=>{if(live){setError(true);setStatus("Follow-up could not be loaded. Retry when connected.")}});return()=>{live=false}},[c.teamId,c.playerIdentity,responseContext?.openedAt]);
 const save=async(nextState,{requireAssignment=false}={})=>{
  if(requireAssignment&&!clean(assignment)){setError(true);setStatus("Add a next assignment before recording it.");return}
  if (saveInFlightRef.current) return;
  saveInFlightRef.current = true;setSaving(true);setError(false);setStatus("Saving…");
  try{
   const [result,deliveryResult]=await Promise.all([saveCoachCoreLoopAction({...c,state:nextState,note:serializeCoachResponseNote({assignment,privateNote:note})}),requireAssignment?savePlayerAssignment({...c,assignmentText:assignment,resultDetail:responseContext?.resultDetail||""}):Promise.resolve(null)]);
   setRecord(result.record||record);if (deliveryResult?.ok && deliveryResult.assignment) setDelivery(deliveryResult.assignment);
   const parsed=parseCoachResponseNote(result.record?.note??serializeCoachResponseNote({assignment,privateNote:note}));setAssignment(deliveryResult?.assignment?.assignmentText||parsed.assignment);setNote(parsed.privateNote);
   const followUpOk=Boolean(result.ok),deliveryOk=!requireAssignment||Boolean(deliveryResult?.ok);setError(!followUpOk||!deliveryOk);
   setStatus(requireAssignment?(followUpOk&&deliveryOk?(deliveryResult.message||"Assignment delivered to the player."):followUpOk?"Private follow-up saved, but Player delivery could not be confirmed. Retry when connected.":deliveryOk?"Assignment delivered, but private follow-up sync failed.":"Saved locally, but team sync and player delivery could not be confirmed. Retry when connected."):(result.message||(result.ok?"Follow-up record saved.":"Follow-up could not be synced. Retry when connected.")));
  }catch{setError(true);setStatus("The follow-up could not be saved. Your edits are still on screen; try again.")}
  finally {saveInFlightRef.current = false;setSaving(false)}
 };
 const state=record?.state==="dismissed"?"":record?.state||"",primary=state==="planned"?"completed":"planned";
 return React.createElement("section",{className:"coachFollowUpLedger","data-testid":"coach-follow-up-ledger","data-follow-up-state":state||"none","aria-label":`Coach follow-up for ${c.playerName}`},
  React.createElement("div",{className:"coachFollowUpHead"},React.createElement("div",null,React.createElement("small",{className:"coachFollowUpEyebrow"},responseContext?"Live result response":"Coach workflow"),React.createElement("h2",{className:"coachFollowUpTitle"},responseContext?"Set the next action":"Follow-up record")),React.createElement("strong",{className:"coachFollowUpBadge"},stateLabel(state))),
  responseContext&&React.createElement("div",{className:"coachResponseEvidence","data-testid":"coach-result-response-context"},React.createElement("small",null,"Latest player result"),React.createElement("strong",null,responseContext.resultDetail||"Training result recorded")),
  delivery&&React.createElement("div",{className:"coachDeliveryStatus","data-testid":"coach-player-assignment-status","data-assignment-state":delivery.state},React.createElement("span",null,"Player delivery"),React.createElement("strong",null,deliveryLabel(delivery.state))),
  React.createElement("p",{className:"coachFollowUpWarning"},"The player receives only the assignment text and result context. Private coach notes remain coach-only."),
  React.createElement("label",{className:"coachFollowUpField is-assignment"},React.createElement("span",null,"Next assignment to deliver"),React.createElement("textarea",{value:assignment,maxLength:2000,onChange:e=>setAssignment(e.target.value),disabled:saving,"data-testid":"coach-next-assignment-input"})),
  React.createElement("button",{type:"button",className:"coachAssignmentSave",onClick:()=>save("planned",{requireAssignment:true}),disabled:saving,"aria-busy": saving},"Deliver next assignment"),
  React.createElement("label",{className:"coachFollowUpField"},React.createElement("span",null,"Private coach note"),React.createElement("textarea",{value:note,maxLength:2000,onChange:e=>setNote(e.target.value),disabled:saving})),
  React.createElement("div",{className:"coachFollowUpActions"},React.createElement("button",{type:"button",onClick:()=>save(primary),disabled:saving,"aria-busy": saving},state==="planned"?"Mark follow-up complete":state==="completed"?"Reopen follow-up":"Mark for follow-up"),React.createElement("button",{type:"button",onClick:()=>save("dismissed"),disabled:saving||!state,"aria-busy": saving},"Clear record")),
  React.createElement("div",{className:`coachFollowUpStatus ${error?"is-error":""}`,role:"status"},status));
}
export function installCoachFollowUpEnhancer(){
 if(typeof window==="undefined"||typeof document==="undefined")return false;if(window.__shotlabCoachFollowUpEnhancer)return true;window.__shotlabCoachFollowUpEnhancer=true;
 document.addEventListener("click",e=>{const row=e.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");if(row)window[CONTEXT_KEY]={playerIdentity:clean(row.getAttribute("data-player-email")),playerName:clean(row.querySelector("strong")?.textContent)}},true);
 let host,root,drawer,key="",frame;
 const reconcile=()=>{frame=null;retireNudges();const next=document.querySelector('[data-testid="coach-player-intelligence-drawer"]');if(!next){root?.unmount?.();host?.remove?.();host=root=drawer=null;key="";return}const c=drawerContext(next),nextKey=`${c.teamId}::${c.playerIdentity}`;if(!c.teamId||!c.playerIdentity||(next===drawer&&host?.isConnected&&nextKey===key))return;root?.unmount?.();host?.remove?.();drawer=next;key=nextKey;const dialog=drawer.querySelector('[role="dialog"]');if(!dialog)return;const body = dialog.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;if (!body || body === dialog) return;host=document.createElement("div");host.dataset.testid="coach-follow-up-ledger-host";body.appendChild(host);root=createRoot(host);root.render(React.createElement(CoachFollowUpPanel,{context:c}))};
 const schedule=()=>{if(frame==null)frame=window.requestAnimationFrame(reconcile)};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener("storage",schedule);schedule();return true;
}
