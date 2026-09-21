import{loadCoachCoreLoopPlayer,saveCoachCoreLoopAction}from"./coachFollowUpService.js";
import{loadPlayerAssignment,savePlayerAssignment}from"./playerAssignmentService.js";
import{COACH_FOLLOW_UP_CONTEXT_KEY as CTX,buildNextAssignmentSuggestion,getCoachResponseContext,parseCoachResponseNote,serializeCoachResponseNote}from"./coachPlayerResponseLoop.js";

const clean=v=>String(v??"").trim(),norm=v=>clean(v).toLowerCase(),json=(v,f)=>{try{return v?JSON.parse(v):f}catch{return f}};
function ctx(drawer){
  const x=globalThis[CTX],store=globalThis.localStorage,raw=json(store?.getItem("sl:session"),{}),s=Array.isArray(raw)?raw[0]:raw,q=clean(document.querySelector('[data-testid="coach-players-filter-rail"] input')?.value),name=clean(drawer.querySelector('[role="dialog"]')?.getAttribute("aria-label")),want=norm(x?.playerIdentity||q||name),players=json(store?.getItem("sl:players"),[]),p=players.find(a=>[a?.email,a?.player_email,a?.playerId,a?.player_id,a?.id,a?.name,a?.displayName].map(norm).includes(want)),ids=[p?.email,p?.player_email,p?.playerId,p?.player_id,p?.id].map(norm).filter(Boolean);
  return{teamId:clean(p?.teamId||p?.team_id||s?.teamId||s?.team_id),playerIdentity:ids[0]||want,playerName:clean(x?.playerName||name||p?.name||p?.displayName||p?.email||"Player")};
}
function retire(){for(const b of document.querySelectorAll("#coach-roster-operations button"))if(clean(b.textContent).replace(/^✓\s*/,"").toUpperCase()==="NUDGE"){b.hidden=b.disabled=true;b.dataset.shotlabLegacyNudgeRetired="true"}}
const html=`<section data-testid="coach-follow-up-ledger" style="display:grid;gap:10px;margin-top:14px;min-width:0">
<div data-result hidden><strong></strong></div><div data-delivery hidden><strong></strong></div>
<label>Next assignment to deliver<textarea data-testid="coach-next-assignment-input" maxlength="2000" style="display:block;width:100%;min-height:84px;box-sizing:border-box"></textarea></label>
<button data-send style="min-height:44px">Deliver next assignment</button>
<label>Private coach note<textarea maxlength="2000" style="display:block;width:100%;min-height:84px;box-sizing:border-box"></textarea></label>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button data-primary style="min-height:44px">Mark for follow-up</button><button data-clear style="min-height:44px">Clear record</button></div>
<p>The player receives only the assignment text and result context. Private coach notes remain coach-only.</p><div role="status"></div></section>`;

function mount(host,c){
  host.innerHTML=html;
  const q=s=>host.querySelector(s),panel=q("section"),assignment=q('[data-testid="coach-next-assignment-input"]'),note=q("label:nth-of-type(2) textarea"),send=q("[data-send]"),primary=q("[data-primary]"),clear=q("[data-clear]"),status=q('[role="status"]'),result=q("[data-result]"),deliveryNode=q("[data-delivery]");
  const saveInFlightRef={current:false};let record=null,delivery=null,saving=false,response;
  const setDelivery=v=>delivery=v||null,setSaving=v=>{saving=!!v;const busyProps={"aria-busy": saving};for(const b of[send,primary,clear])b.setAttribute("aria-busy",String(busyProps["aria-busy"]))};
  const responseNow=()=>{response=getCoachResponseContext({playerIdentity:c.playerIdentity,playerName:c.playerName});if(!response)return false;result.hidden=false;result.dataset.testid="coach-result-response-context";result.querySelector("strong").textContent=response.resultDetail||"Training result recorded";if(!clean(assignment.value))assignment.value=buildNextAssignmentSuggestion(response);return true};
  host.__shotlabRefresh=responseNow;responseNow();
  const draw=(msg="")=>{const state=record?.state==="dismissed"?"":record?.state||"";panel.dataset.followUpState=state||"none";primary.textContent=state==="planned"?"Mark follow-up complete":state==="completed"?"Reopen follow-up":"Mark for follow-up";for(const x of[send,primary,assignment,note])x.disabled=saving;clear.disabled=saving||!state;if(delivery){deliveryNode.hidden=false;deliveryNode.dataset.testid="coach-player-assignment-status";deliveryNode.dataset.assignmentState=delivery.state||"";deliveryNode.querySelector("strong").textContent=delivery.state==="completed"?"Player completed":delivery.state==="started"?"Player started":delivery.state==="acknowledged"?"Player acknowledged":"Delivered"}else{deliveryNode.hidden=true;delete deliveryNode.dataset.testid}if(msg)status.textContent=msg};
  const save=async(state,deliver=false)=>{
    if(deliver&&!clean(assignment.value)){status.textContent="Add a next assignment before recording it.";return}
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;setSaving(true);draw("Saving…");
    try{
      const [follow,deliveryResult]=await Promise.all([saveCoachCoreLoopAction({...c,state,note:serializeCoachResponseNote({assignment:assignment.value,privateNote:note.value})}),deliver?savePlayerAssignment({...c,assignmentText:assignment.value,resultDetail:response?.resultDetail||""}):null]);
      record=follow.record||record;
      if (deliveryResult?.ok && deliveryResult.assignment) setDelivery(deliveryResult.assignment);
      const parsed=parseCoachResponseNote(follow.record?.note||"");assignment.value=deliveryResult?.assignment?.assignmentText||parsed.assignment||assignment.value;note.value=parsed.privateNote||note.value;
      draw(deliver?(deliveryResult?.ok?(deliveryResult.message||"Assignment delivered to the player."):(follow.ok?"Private follow-up saved. Player delivery could not be confirmed. Retry when connected.":"Saved locally, but team sync and player delivery could not be confirmed. Retry when connected.")):(follow.message||(follow.ok?"Follow-up record saved.":"Follow-up could not be synced. Retry when connected.")));
    }catch{draw(deliver?"Player delivery could not be confirmed. Retry when connected.":"Follow-up could not be saved. Try again.")}
    finally {saveInFlightRef.current = false;setSaving(false);draw()}
  };
  send.onclick=()=>save("planned",true);primary.onclick=()=>save(record?.state==="planned"?"completed":"planned");clear.onclick=()=>save("dismissed");draw("Loading follow-up record…");
  Promise.all([loadCoachCoreLoopPlayer(c),loadPlayerAssignment(c)]).then(([follow,deliveryResult])=>{
    record=follow.record||null;
    const confirmedDelivery = deliveryResult.ok ? deliveryResult.assignment || null : null;
    setDelivery(confirmedDelivery);responseNow();
    const parsed=parseCoachResponseNote(follow.record?.note||"");assignment.value=deliveryResult.assignment?.assignmentText||parsed.assignment||(response?buildNextAssignmentSuggestion(response):"");note.value=parsed.privateNote;
    draw(record?"Existing follow-up record loaded.":response?"Result loaded. Confirm the next assignment before recording it.":"No follow-up has been recorded.");
  }).catch(()=>draw("Follow-up could not be loaded. Retry when connected."));
}

export function installCoachFollowUpEnhancer(){
  if(typeof window==="undefined"||typeof document==="undefined")return false;if(window.__shotlabCoachFollowUpEnhancer)return true;window.__shotlabCoachFollowUpEnhancer=true;
  let host,drawer,key="",frame;
  const run=()=>{frame=null;retire();const d=document.querySelector('[data-testid="coach-player-intelligence-drawer"]');if(!d){host?.remove();host=drawer=null;key="";return}const c=ctx(d),k=c.teamId+"::"+c.playerIdentity;if(!c.teamId||!c.playerIdentity)return;if(d===drawer&&host?.isConnected&&k===key){host.__shotlabRefresh?.();return}host?.remove();drawer=d;key=k;const dialog=d.querySelector('[role="dialog"]');const body=dialog?.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;if(!body||body===dialog)return;host=document.createElement("div");host.dataset.testid="coach-follow-up-ledger-host";body.appendChild(host);mount(host,c)};
  const schedule=()=>{if(frame==null)frame=requestAnimationFrame(run)};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener("storage",schedule);schedule();return true;
}
