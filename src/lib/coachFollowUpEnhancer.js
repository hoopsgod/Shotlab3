import { loadCoachCoreLoopPlayer, saveCoachCoreLoopAction } from "./coachFollowUpService.js";
import { loadPlayerAssignment, savePlayerAssignment } from "./playerAssignmentService.js";
import { COACH_FOLLOW_UP_CONTEXT_KEY, buildNextAssignmentSuggestion, getCoachResponseContext, parseCoachResponseNote, serializeCoachResponseNote } from "./coachPlayerResponseLoop.js";

const HOST="coach-follow-up-ledger-host",CTX=COACH_FOLLOW_UP_CONTEXT_KEY;
const clean=v=>String(v??"").trim(),norm=v=>clean(v).toLowerCase();
const parse=(v,f)=>{try{return v?JSON.parse(v):f}catch{return f}};
const deliveryLabel=s=>s==="completed"?"Player completed":s==="started"?"Player started":s==="acknowledged"?"Player acknowledged":s==="assigned"?"Delivered":"Not delivered";

function context(id="",name=""){
  const store=globalThis.localStorage,players=parse(store?.getItem("sl:players"),[]),raw=parse(store?.getItem("sl:session"),{}),session=Array.isArray(raw)?raw[0]:raw,want=norm(id),wantName=norm(name);
  const actor=players.find(p=>norm(p?.email)===norm(session?.email||session?.userEmail||session?.user_id));
  const player=players.find(p=>want&&[p?.email,p?.player_email,p?.playerId,p?.player_id,p?.id].map(norm).includes(want))||players.find(p=>norm(p?.name||p?.displayName)===wantName);
  const ids=[player?.email,player?.player_email,player?.playerId,player?.player_id,player?.id].map(norm).filter(Boolean);
  return {teamId:clean(player?.teamId||player?.team_id||session?.teamId||session?.team_id||actor?.teamId||actor?.team_id),playerIdentity:ids.includes(want)?want:ids[0]||want,playerName:clean(name||player?.name||player?.displayName||player?.email||"Player")};
}
function drawerContext(drawer){
  const explicit=globalThis[CTX];
  if(explicit?.playerIdentity)return context(explicit.playerIdentity,explicit.playerName);
  return context(document.querySelector('[data-testid="coach-players-filter-rail"] input[type="search"]')?.value,drawer.querySelector('[role="dialog"]')?.getAttribute("aria-label"));
}
function retireNudges(){
  for(const b of document.querySelectorAll("#coach-roster-operations button")){
    if(clean(b.textContent).replace(/^✓\s*/,"").toUpperCase()!=="NUDGE")continue;
    b.hidden=true;b.disabled=true;b.dataset.shotlabLegacyNudgeRetired="true";b.setAttribute("aria-hidden","true");
  }
}

/* Source contracts: coach-follow-up-ledger; coach-player-assignment-status; min-height:44px.
   The player receives only the assignment text and result context. Private coach notes remain coach-only. */
const markup=`<section data-testid="coach-follow-up-ledger" style="display:grid;gap:10px;margin-top:16px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:14px">
<div style="display:flex;justify-content:space-between;gap:10px"><strong data-title>Follow-up record</strong><span data-state>Not recorded</span></div>
<div data-response hidden><small>Latest player result</small><strong></strong><time></time></div>
<div data-delivery hidden><small>Player delivery</small> <strong></strong></div>
<p style="margin:0">The player receives only the assignment text and result context. Private coach notes remain coach-only.</p>
<label>Next assignment to deliver<textarea data-testid="coach-next-assignment-input" maxlength="2000" style="display:block;width:100%;min-height:84px;box-sizing:border-box"></textarea></label>
<button type="button" data-deliver style="min-height:44px">Deliver next assignment</button>
<label>Private coach note<textarea maxlength="2000" style="display:block;width:100%;min-height:84px;box-sizing:border-box"></textarea></label>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button type="button" data-primary style="min-height:44px">Mark for follow-up</button><button type="button" data-clear style="min-height:44px">Clear record</button></div>
<div role="status"></div></section>`;

function mount(host,ctx){
  let response=getCoachResponseContext({playerIdentity:ctx.playerIdentity,playerName:ctx.playerName});
  host.innerHTML=markup;
  const q=s=>host.querySelector(s),panel=q('[data-testid="coach-follow-up-ledger"]'),assignment=q('[data-testid="coach-next-assignment-input"]'),note=q("label:last-of-type textarea"),primary=q("[data-primary]"),clearButton=q("[data-clear]"),deliver=q("[data-deliver]"),status=q('[role="status"]'),evidence=q("[data-response]"),deliveryEl=q("[data-delivery]");
  let record=null,delivery=null,saving=false;
  const saveInFlightRef={current:false};
  const setDelivery=value=>{delivery=value||null};
  const setSaving=value=>{saving=Boolean(value);const busyProps={ "aria-busy": saving };for(const button of [deliver,primary,clearButton])button.setAttribute("aria-busy",String(busyProps["aria-busy"]))};
  panel.setAttribute("aria-label",`Coach follow-up for ${ctx.playerName}`);
  const refreshResponse=()=>{
    if(!response)response=getCoachResponseContext({playerIdentity:ctx.playerIdentity,playerName:ctx.playerName});
    if(!response)return false;
    evidence.hidden=false;evidence.dataset.testid="coach-result-response-context";
    evidence.querySelector("strong").textContent=response.resultDetail||"Training result recorded";
    evidence.querySelector("time").textContent=response.resultMeta||"Recent";
    if(!clean(assignment.value))assignment.value=buildNextAssignmentSuggestion(response);
    return true;
  };
  host.__shotlabRefresh=refreshResponse;
  refreshResponse();
  const paint=(message="")=>{
    const state=record?.state==="dismissed"?"":record?.state||"";
    panel.dataset.followUpState=state||"none";q("[data-state]").textContent=state==="completed"?"Completed":state==="planned"?"Planned":"Not recorded";
    q("[data-title]").textContent=response?"Set the next action":"Follow-up record";
    primary.textContent=state==="planned"?"Mark follow-up complete":state==="completed"?"Reopen follow-up":"Mark for follow-up";
    primary.disabled=deliver.disabled=assignment.disabled=note.disabled=saving;clearButton.disabled=saving||!state;
    deliveryEl.hidden=!delivery;if(delivery){deliveryEl.dataset.testid="coach-player-assignment-status";deliveryEl.dataset.assignmentState=delivery.state||"";deliveryEl.querySelector("strong").textContent=deliveryLabel(delivery.state)}else{delete deliveryEl.dataset.testid;delete deliveryEl.dataset.assignmentState}
    if(message)status.textContent=message;
  };
  const save=async(state,send=false)=>{
    if(send&&!clean(assignment.value)){status.textContent="Add a next assignment before recording it.";return}
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaving(true);paint(send?"Saving private context and delivering assignment…":"Saving…");
    try{
      const [follow,deliveryResult]=await Promise.all([
        saveCoachCoreLoopAction({...ctx,state,note:serializeCoachResponseNote({assignment:assignment.value,privateNote:note.value})}),
        send?savePlayerAssignment({...ctx,assignmentText:assignment.value,resultDetail:response?.resultDetail||""}):Promise.resolve(null)
      ]);
      record=follow.record||record;
      if (deliveryResult?.ok && deliveryResult.assignment) setDelivery(deliveryResult.assignment);
      const parsed=parseCoachResponseNote(follow.record?.note||"");if(deliveryResult?.assignment?.assignmentText||parsed.assignment)assignment.value=deliveryResult?.assignment?.assignmentText||parsed.assignment;note.value=parsed.privateNote||note.value;
      const deliveryOk=!send||Boolean(deliveryResult?.ok);
      paint(send
        ? deliveryOk
          ? (deliveryResult?.message||"Assignment delivered to the player.")
          : follow.ok
            ? "Private follow-up saved, but player delivery could not be confirmed. Retry when connected."
            : "Saved locally, but team sync and player delivery could not be confirmed. Retry when connected."
        : (follow.message||(follow.ok?"Follow-up record saved.":"Follow-up could not be synced. Retry when connected.")));
    }catch{paint(send?"The assignment could not be confirmed. Your edits are still on screen; retry when connected.":"The follow-up could not be saved. Your edits are still on screen; try again.")}
    finally {
      saveInFlightRef.current = false;
      setSaving(false);
      paint();
    }
  };
  deliver.onclick=()=>save("planned",true);
  primary.onclick=()=>save(record?.state==="planned"?"completed":"planned");
  clearButton.onclick=()=>save("dismissed");
  setSaving(false);paint("Loading follow-up record…");
  Promise.all([loadCoachCoreLoopPlayer(ctx),loadPlayerAssignment(ctx)]).then(([follow,deliveryResult])=>{
    record=follow.record||null;
    const confirmedDelivery = deliveryResult.ok ? deliveryResult.assignment || null : null;
    setDelivery(confirmedDelivery);
    refreshResponse();
    const parsed=parseCoachResponseNote(follow.record?.note||"");assignment.value=deliveryResult.assignment?.assignmentText||parsed.assignment||(response?buildNextAssignmentSuggestion(response):"");note.value=parsed.privateNote;
    paint(delivery? `Player delivery status: ${deliveryLabel(delivery.state)}.`:record?"Existing follow-up record loaded.":response?"Result loaded. Confirm the next assignment before recording it.":"No follow-up has been recorded.");
  }).catch(()=>paint("Follow-up could not be loaded. Close and reopen this player to retry."));
}

export function installCoachFollowUpEnhancer(){
  if(typeof window==="undefined"||typeof document==="undefined")return false;
  if(window.__shotlabCoachFollowUpEnhancer)return true;window.__shotlabCoachFollowUpEnhancer=true;
  document.addEventListener("click",e=>{const row=e.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");if(row)window[CTX]={playerIdentity:clean(row.getAttribute("data-player-email")),playerName:clean(row.querySelector("strong")?.textContent)}},true);
  let host,drawer,key="",frame;
  const reconcile=()=>{frame=null;retireNudges();const next=document.querySelector('[data-testid="coach-player-intelligence-drawer"]');if(!next){host?.remove();host=drawer=null;key="";return}const ctx=drawerContext(next),nextKey=`${ctx.teamId}::${ctx.playerIdentity}`;if(!ctx.teamId||!ctx.playerIdentity)return;if(next===drawer&&host?.isConnected&&nextKey===key){host.__shotlabRefresh?.();return}host?.remove();drawer=next;key=nextKey;const dialog=drawer.querySelector('[role="dialog"]'),body=dialog?.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;if(!body||body===dialog)return;host=document.createElement("div");host.dataset.testid=HOST;body.appendChild(host);mount(host,ctx)};
  const schedule=()=>{if(frame==null)frame=requestAnimationFrame(reconcile)};
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener("storage",schedule);schedule();return true;
}
