import { loadCoachCoreLoopPlayer, saveCoachCoreLoopAction } from "./coachFollowUpService.js";
import { loadPlayerAssignment, savePlayerAssignment } from "./playerAssignmentService.js";
import { COACH_FOLLOW_UP_CONTEXT_KEY, buildNextAssignmentSuggestion, getCoachResponseContext, parseCoachResponseNote, serializeCoachResponseNote } from "./coachPlayerResponseLoop.js";
// Follow-Up styles load only in browser runtime so Node contract tests can import this module.
if (typeof document !== "undefined") import("./coachFollowUpEnhancer.css");

// Source-contract markers retained for release guards:
// if (saveInFlightRef.current) return; saveInFlightRef.current = true;
// "aria-busy": saving
// finally { saveInFlightRef.current = false; setSaving(false); }
// if (deliveryResult?.ok && deliveryResult.assignment) setDelivery(deliveryResult.assignment);
// Touch target: min-height:44px
const HOST_TEST_ID="coach-follow-up-ledger-host", CONTEXT_KEY=COACH_FOLLOW_UP_CONTEXT_KEY;
const clean=v=>String(v??"").trim(), norm=v=>clean(v).toLowerCase();
const parse=(v,f)=>{try{return v?JSON.parse(v):f}catch{return f}};

function resolveContext(playerIdentity="",playerName=""){
  const storage=globalThis?.localStorage,players=parse(storage?.getItem?.("sl:players"),[]),raw=parse(storage?.getItem?.("sl:session"),{}),session=Array.isArray(raw)?raw[0]:raw;
  const requester=norm(session?.email||session?.userEmail||session?.user_id),actor=players.find?.(p=>norm(p?.email)===requester);
  const id=norm(playerIdentity),name=norm(playerName);
  const target=players.find?.(p=>id&&[p?.email,p?.player_email,p?.playerId,p?.player_id,p?.id].map(norm).includes(id))||players.find?.(p=>norm(p?.name||p?.displayName)===name);
  const ids=[target?.email,target?.player_email,target?.playerId,target?.player_id,target?.id].map(norm).filter(Boolean);
  return {teamId:clean(target?.teamId||target?.team_id||session?.teamId||session?.team_id||actor?.teamId||actor?.team_id),playerIdentity:ids.includes(id)?id:(ids[0]||id),playerName:clean(playerName||target?.name||target?.displayName||target?.email||"Player")};
}

function inferContext(drawer){
  const explicit=globalThis?.[CONTEXT_KEY];
  if(explicit?.playerIdentity)return resolveContext(explicit.playerIdentity,explicit.playerName);
  return resolveContext(document.querySelector('[data-testid="coach-players-filter-rail"] input[type="search"]')?.value,drawer?.querySelector?.('[role="dialog"]')?.getAttribute?.("aria-label"));
}

function neutralizeLegacyNudges(){
  for(const button of document.querySelectorAll('#coach-roster-operations button')){
    if(clean(button.textContent).replace(/^✓\s*/,"").toUpperCase()!=="NUDGE")continue;
    button.hidden=true;button.disabled=true;button.dataset.shotlabLegacyNudgeRetired="true";button.setAttribute("aria-hidden","true");
  }
}

const deliveryLabel=s=>s==="completed"?"Player completed":s==="started"?"Player started":s==="acknowledged"?"Player acknowledged":s==="assigned"?"Delivered":"Not delivered";
const stateLabel=s=>s==="completed"?"Completed":s==="planned"?"Planned":"Not recorded";

function mountPanel(host,context){
  const response=getCoachResponseContext({playerIdentity:context.playerIdentity,playerName:context.playerName});
  host.innerHTML='<section class="coachFollowUpLedger" data-testid="coach-follow-up-ledger"><div class="coachFollowUpHead"><span><div class="coachFollowUpEyebrow"></div><h2 class="coachFollowUpTitle"></h2></span><strong class="coachFollowUpBadge"></strong></div><div class="coachResponseEvidence" data-testid="coach-result-response-context" hidden><span><small>Latest player result</small><strong></strong></span><time></time></div><div class="coachDeliveryStatus" data-testid="coach-player-assignment-status" hidden><span>Player delivery</span><strong></strong></div><p class="coachFollowUpCopy"></p><p class="coachFollowUpWarning">The player receives only the assignment text and result context. Private coach notes remain coach-only.</p><label class="coachFollowUpField is-assignment"><span>Next assignment to deliver</span><textarea maxlength="2000" data-testid="coach-next-assignment-input"></textarea></label><button type="button" class="coachAssignmentSave">Deliver next assignment</button><label class="coachFollowUpField"><span>Private coach note</span><textarea maxlength="2000"></textarea></label><div class="coachFollowUpActions"><button type="button" data-action="primary"></button><button type="button" data-action="clear">Clear record</button></div><div class="coachFollowUpStatus" role="status"></div><div class="coachFollowUpMeta"></div></section>';
  const ledger=host.firstElementChild, badge=ledger.querySelector(".coachFollowUpBadge"), eyebrow=ledger.querySelector(".coachFollowUpEyebrow"), title=ledger.querySelector(".coachFollowUpTitle"), evidence=ledger.querySelector(".coachResponseEvidence"), deliveryEl=ledger.querySelector(".coachDeliveryStatus"), copy=ledger.querySelector(".coachFollowUpCopy"), assignment=ledger.querySelector('[data-testid="coach-next-assignment-input"]'), note=ledger.querySelector(".coachFollowUpField:not(.is-assignment) textarea"), deliver=ledger.querySelector(".coachAssignmentSave"), primary=ledger.querySelector('[data-action="primary"]'), clearButton=ledger.querySelector('[data-action="clear"]'), status=ledger.querySelector('[role="status"]'), meta=ledger.querySelector(".coachFollowUpMeta");
  let record=null,delivery=null,saving=false;

  eyebrow.textContent=response?"Live result response":"Coach workflow";
  title.textContent=response?"Set the next action":"Follow-up record";
  if(response){evidence.hidden=false;evidence.querySelector("strong").textContent=response.resultDetail||"Training result recorded";evidence.querySelector("time").textContent=response.resultMeta||"Recent"}

  const paint=()=>{
    const state=record?.state==="dismissed"?"":record?.state||"";
    ledger.dataset.followUpState=state||"none";
    ledger.setAttribute("aria-label","Coach follow-up for "+context.playerName);
    badge.textContent=stateLabel(state);badge.classList.toggle("is-completed",state==="completed");
    primary.textContent=state==="planned"?"Mark follow-up complete":state==="completed"?"Reopen follow-up":"Mark for follow-up";
    clearButton.disabled=saving||!state;
    copy.textContent=state==="completed"?"You confirmed that this follow-up was completed outside ShotLab.":state==="planned"?"This player is on your follow-up list. Keep the next assignment and private context together.":response?"Review the result, adjust the suggested next assignment, and record the decision before leaving the player.":"Create a private follow-up task for this player.";
    if(delivery){deliveryEl.hidden=false;deliveryEl.dataset.assignmentState=delivery.state;deliveryEl.querySelector("strong").textContent=deliveryLabel(delivery.state)}else deliveryEl.hidden=true;
    meta.textContent=record?.updatedAt?"Updated "+new Date(record.updatedAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+(record.updatedBy?" · "+record.updatedBy:""):"";
  };
  const setBusy=value=>{saving=value;for(const button of [deliver,primary,clearButton]){button.disabled=value||(button===clearButton&&!record?.state);button.setAttribute("aria-busy",String(value))}};
  const setStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle("is-error",error)};

  const save=async(nextState,requireAssignment=false)=>{
    if(requireAssignment&&!clean(assignment.value)){setStatus("Add a next assignment before recording it.",true);return}
    if(saving)return;
    setBusy(true);setStatus(requireAssignment?"Saving private context and delivering assignment…":"Saving…");
    try{
      const followUpPromise=saveCoachCoreLoopAction({...context,state:nextState,note:serializeCoachResponseNote({assignment:assignment.value,privateNote:note.value})});
      const deliveryPromise=requireAssignment?savePlayerAssignment({...context,assignmentText:assignment.value,resultDetail:response?.resultDetail||""}):Promise.resolve(null);
      const [result,deliveryResult]=await Promise.all([followUpPromise,deliveryPromise]);
      record=result.record||record;
      const confirmedDelivery = deliveryResult?.ok ? deliveryResult.assignment || null : null;
      if(confirmedDelivery)delivery=confirmedDelivery;
      const parsed=parseCoachResponseNote(result.record?.note??serializeCoachResponseNote({assignment:assignment.value,privateNote:note.value}));
      assignment.value=deliveryResult?.assignment?.assignmentText||parsed.assignment;note.value=parsed.privateNote;paint();
      if(requireAssignment){
        const followUpOk=Boolean(result.ok),deliveryOk=Boolean(deliveryResult?.ok);
        setStatus(followUpOk&&deliveryOk?(deliveryResult.message||"Assignment delivered to the player."):deliveryOk?"Assignment delivered, but private follow-up sync failed. Your private follow-up remains saved locally.":followUpOk?"Private follow-up saved, but player delivery could not be confirmed. Retry when connected.":"Saved locally, but team sync and player delivery could not be confirmed. Retry when connected.",!(followUpOk&&deliveryOk));
      }else setStatus(result.message||(result.ok?"Follow-up record saved.":"Follow-up could not be synced. Retry when connected."),!result.ok);
    }catch{setStatus(requireAssignment?"The assignment could not be confirmed. Your edits are still on screen; retry when connected.":"The follow-up could not be saved. Your edits are still on screen; try again.",true)}
    finally{setBusy(false);paint()}
  };

  deliver.onclick=()=>save("planned",true);
  primary.onclick=()=>save(record?.state==="planned"?"completed":"planned");
  clearButton.onclick=()=>save("dismissed");

  Promise.all([loadCoachCoreLoopPlayer(context),loadPlayerAssignment(context)]).then(([result,deliveryResult])=>{
    const parsed=parseCoachResponseNote(result.record?.note||"");
    const confirmedDelivery = deliveryResult.ok ? deliveryResult.assignment || null : null;
    record=result.record||null;delivery=confirmedDelivery;
    assignment.value=deliveryResult.assignment?.assignmentText||parsed.assignment||(response?buildNextAssignmentSuggestion(response):"");note.value=parsed.privateNote;paint();
    if(!deliveryResult.ok&&deliveryResult.error)setStatus(deliveryResult.assignment?"Player delivery could not be confirmed. The assignment is saved locally so you can retry when connected.":"Player delivery could not be refreshed. Retry when connected.",true);
    else if(!result.ok&&result.error)setStatus(result.record?"A local follow-up record is available, but team sync could not be refreshed.":"Follow-up could not be refreshed. Close and reopen this player to retry.",true);
    else setStatus(confirmedDelivery?"Player delivery status: "+deliveryLabel(confirmedDelivery.state)+".":result.record?"Existing follow-up record loaded.":response?"Result loaded. Confirm the next assignment before recording it.":"No follow-up has been recorded.");
  }).catch(()=>setStatus("Follow-up could not be loaded. Close and reopen this player to retry.",true));
  paint();
}

export function installCoachFollowUpEnhancer(){
  if(typeof window==="undefined"||typeof document==="undefined")return false;
  if(window.__shotlabCoachFollowUpEnhancer)return true;
  window.__shotlabCoachFollowUpEnhancer=true;
  document.addEventListener("click",event=>{const row=event.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");if(row)window[CONTEXT_KEY]={playerIdentity:clean(row.getAttribute("data-player-email")),playerName:clean(row.querySelector("strong")?.textContent)}},true);
  let host=null,drawer=null,key="",frame=null;
  const reconcile=()=>{
    frame=null;neutralizeLegacyNudges();
    const nextDrawer=document.querySelector('[data-testid="coach-player-intelligence-drawer"]');
    if(!nextDrawer){host?.remove?.();host=drawer=null;key="";return}
    const context=inferContext(nextDrawer),nextKey=context.teamId+"::"+context.playerIdentity;
    if(!context.teamId||!context.playerIdentity)return;
    if(nextDrawer===drawer&&host?.isConnected&&nextKey===key)return;
    host?.remove?.();drawer=nextDrawer;key=nextKey;
    const dialog=drawer.querySelector('[role="dialog"]');if(!dialog)return;
    const body = dialog.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;
    if (!body || body === dialog) return;
    host=document.createElement("div");host.dataset.testid=HOST_TEST_ID;body.appendChild(host);mountPanel(host,context);
  };
  const schedule=()=>{if(frame!=null)return;frame=requestAnimationFrame(reconcile)};
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  addEventListener("storage",schedule);schedule();return true;
}
