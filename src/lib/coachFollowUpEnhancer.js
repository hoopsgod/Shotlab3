import { loadCoachCoreLoopPlayer, saveCoachCoreLoopAction } from "./coachFollowUpService.js";
import { loadPlayerAssignment, savePlayerAssignment } from "./playerAssignmentService.js";
import { COACH_FOLLOW_UP_CONTEXT_KEY, buildNextAssignmentSuggestion, getCoachResponseContext, parseCoachResponseNote, serializeCoachResponseNote } from "./coachPlayerResponseLoop.js";

const HOST_TEST_ID="coach-follow-up-ledger-host",CTX=COACH_FOLLOW_UP_CONTEXT_KEY;
const clean=v=>String(v??"").trim(), norm=v=>clean(v).toLowerCase();
const parse=(v,f)=>{try{return v?JSON.parse(v):f}catch{return f}};
const labels={completed:"Completed",planned:"Planned"};
const deliveryLabel=s=>s==="completed"?"Player completed":s==="started"?"Player started":s==="acknowledged"?"Player acknowledged":s==="assigned"?"Delivered":"Not delivered";
const formatDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})};

function resolveContext(playerIdentity="",playerName=""){
  const storage=globalThis?.localStorage,players=parse(storage?.getItem?.("sl:players"),[]),raw=parse(storage?.getItem?.("sl:session"),{}),session=Array.isArray(raw)?raw[0]:raw;
  const requester=norm(session?.email||session?.userEmail||session?.user_id),actor=players.find(p=>norm(p?.email)===requester),wanted=norm(playerIdentity),name=norm(playerName);
  const target=players.find(p=>wanted&&[p?.email,p?.player_email,p?.playerId,p?.player_id,p?.id].map(norm).includes(wanted))||players.find(p=>norm(p?.name||p?.displayName)===name);
  const ids=[target?.email,target?.player_email,target?.playerId,target?.player_id,target?.id].map(norm).filter(Boolean);
  return{teamId:clean(target?.teamId||target?.team_id||session?.teamId||session?.team_id||actor?.teamId||actor?.team_id),playerIdentity:ids.includes(wanted)?wanted:ids[0]||wanted,playerName:clean(playerName||target?.name||target?.displayName||target?.email||"Player")};
}
function inferContext(drawer){
  const explicit=globalThis?.[CTX];
  if(explicit?.playerIdentity)return resolveContext(explicit.playerIdentity,explicit.playerName);
  return resolveContext(clean(document.querySelector('[data-testid="coach-players-filter-rail"] input[type="search"]')?.value),clean(drawer?.querySelector?.('[role="dialog"]')?.getAttribute?.("aria-label")));
}
function neutralizeLegacyNudges(){
  for(const button of document.querySelectorAll("#coach-roster-operations button")){
    if(clean(button.textContent).replace(/^✓\\s*/,"").toUpperCase()!=="NUDGE")continue;
    button.hidden=true;button.disabled=true;button.dataset.shotlabLegacyNudgeRetired="true";button.setAttribute("aria-hidden","true");
  }
}

const template=`<section class="coachFollowUpLedger" data-testid="coach-follow-up-ledger"><div class="coachFollowUpHead"><span><div class="coachFollowUpEyebrow"></div><h2 class="coachFollowUpTitle"></h2></span><strong class="coachFollowUpBadge"></strong></div><div class="coachResponseEvidence" data-testid="coach-result-response-context"><span><small>Latest player result</small><strong></strong></span><time></time></div><div class="coachDeliveryStatus" data-testid="coach-player-assignment-status"><span>Player delivery</span><strong></strong></div><p class="coachFollowUpCopy"></p><p class="coachFollowUpWarning">The player receives only the assignment text and result context. Private coach notes remain coach-only.</p><label class="coachFollowUpField is-assignment"><span>Next assignment to deliver</span><textarea maxlength="2000" data-testid="coach-next-assignment-input" placeholder="Example: Repeat the form shooting block and match today's makes with balanced footwork."></textarea></label><button type="button" class="coachAssignmentSave">Deliver next assignment</button><label class="coachFollowUpField"><span>Private coach note</span><textarea maxlength="2000" placeholder="Example: Check in after practice about completing the priority drill."></textarea></label><div class="coachFollowUpActions"><button type="button" data-follow-up-primary></button><button type="button" data-follow-up-clear>Clear record</button></div><div class="coachFollowUpStatus" role="status"></div><div class="coachFollowUpMeta"></div></section>`;

function mountPanel(host,context){
  const response=getCoachResponseContext({playerIdentity:context.playerIdentity,playerName:context.playerName});
  const model={record:null,delivery:null,assignment:"",note:"",status:"Loading follow-up record…",error:false,saving:false};
  const state=()=>model.record?.state==="dismissed"?"":model.record?.state||"";
  const render=()=>{
    host.innerHTML=template;
    const q=s=>host.querySelector(s),section=q('[data-testid="coach-follow-up-ledger"]'),s=state(),evidence=q(".coachResponseEvidence"),delivery=q(".coachDeliveryStatus"),assignment=q('[data-testid="coach-next-assignment-input"]'),note=q('.coachFollowUpField:not(.is-assignment) textarea'),primary=q("[data-follow-up-primary]"),clearButton=q("[data-follow-up-clear]"),saveButton=q(".coachAssignmentSave");
    section.dataset.followUpState=s||"none";section.setAttribute("aria-label",`Coach follow-up for ${context.playerName}`);
    q(".coachFollowUpEyebrow").textContent=response?"Live result response":"Coach workflow";q(".coachFollowUpTitle").textContent=response?"Set the next action":"Follow-up record";
    const badge=q(".coachFollowUpBadge");badge.textContent=labels[s]||"Not recorded";badge.classList.toggle("is-completed",s==="completed");
    evidence.hidden=!response;if(response){evidence.querySelector("strong").textContent=response.resultDetail||"Training result recorded";evidence.querySelector("time").textContent=response.resultMeta||"Recent"}
    delivery.hidden=!model.delivery;if(model.delivery){delivery.dataset.assignmentState=model.delivery.state||"";delivery.querySelector("strong").textContent=deliveryLabel(model.delivery.state)}
    q(".coachFollowUpCopy").textContent=s==="completed"?"You confirmed that this follow-up was completed outside ShotLab.":s==="planned"?"This player is on your follow-up list. Keep the next assignment and private context together.":response?"Review the result, adjust the suggested next assignment, and record the decision before leaving the player.":"Create a private follow-up task for this player.";
    assignment.value=model.assignment;note.value=model.note;assignment.disabled=note.disabled=saveButton.disabled=primary.disabled=model.saving;clearButton.disabled=model.saving||!s;
    primary.textContent=s==="planned"?"Mark follow-up complete":s==="completed"?"Reopen follow-up":"Mark for follow-up";
    const status=q(".coachFollowUpStatus");status.textContent=model.status;status.classList.toggle("is-error",model.error);
    const meta=q(".coachFollowUpMeta");meta.hidden=!model.record?.updatedAt;if(model.record?.updatedAt)meta.textContent=`Updated ${formatDate(model.record.updatedAt)}${model.record.updatedBy?` · ${model.record.updatedBy}`:""}`;
    assignment.addEventListener("input",e=>{model.assignment=e.currentTarget.value});note.addEventListener("input",e=>{model.note=e.currentTarget.value});
    saveButton.addEventListener("click",()=>save("planned",true));primary.addEventListener("click",()=>save(s==="planned"?"completed":"planned",false));clearButton.addEventListener("click",()=>save("dismissed",false));
  };
  const save=async(nextState,deliver)=>{
    if(deliver&&!clean(model.assignment)){model.error=true;model.status="Add a next assignment before recording it.";render();return}
    if(model.saving)return;model.saving=true;model.error=false;model.status=deliver?"Saving private context and delivering assignment…":"Saving…";render();
    try{
      const follow=saveCoachCoreLoopAction({...context,state:nextState,note:serializeCoachResponseNote({assignment:model.assignment,privateNote:model.note})});
      const assignmentPromise=deliver?savePlayerAssignment({...context,assignmentText:model.assignment,resultDetail:response?.resultDetail||""}):Promise.resolve(null);
      const[result,deliveryResult]=await Promise.all([follow,assignmentPromise]);
      model.record=result.record||model.record;if(deliveryResult?.ok&&deliveryResult.assignment)model.delivery=deliveryResult.assignment;
      const parsed=parseCoachResponseNote(result.record?.note??serializeCoachResponseNote({assignment:model.assignment,privateNote:model.note}));
      model.assignment=deliveryResult?.assignment?.assignmentText||parsed.assignment;model.note=parsed.privateNote;
      const ok=Boolean(result.ok),deliveryOk=!deliver||Boolean(deliveryResult?.ok);model.error=!ok||!deliveryOk;
      model.status=deliver?(ok&&deliveryOk?(deliveryResult.message||"Assignment delivered to the player."):deliveryOk?"Assignment delivered, but private follow-up sync failed.":ok?"Private follow-up saved, but player delivery could not be confirmed. Retry when connected.":"Saved locally, but team sync and player delivery could not be confirmed. Retry when connected."):(result.message||(ok?"Follow-up record saved.":"Follow-up could not be synced. Retry when connected."));
    }catch{model.error=true;model.status=deliver?"The assignment could not be confirmed. Your edits are still on screen; retry when connected.":"The follow-up could not be saved. Your edits are still on screen; try again."}
    model.saving=false;render();
  };
  render();
  Promise.all([loadCoachCoreLoopPlayer(context),loadPlayerAssignment(context)]).then(([follow,delivery])=>{
    const parsed=parseCoachResponseNote(follow.record?.note||"");model.record=follow.record||null;model.delivery=delivery.ok?delivery.assignment||null:null;model.assignment=delivery.assignment?.assignmentText||parsed.assignment||(response?buildNextAssignmentSuggestion(response):"");model.note=parsed.privateNote;model.error=(!follow.ok&&!!follow.error)||(!delivery.ok&&!!delivery.error);
    model.status=model.delivery?`Player delivery status: ${deliveryLabel(model.delivery.state)}.`:follow.record?"Existing follow-up record loaded.":response?"Result loaded. Confirm the next assignment before recording it.":"No follow-up has been recorded.";render();
  }).catch(()=>{model.error=true;model.status="Follow-up could not be loaded. Close and reopen this player to retry.";render()});
}
// min-height:44px is enforced by compiled authenticated authority CSS.
export function installCoachFollowUpEnhancer(){
  if(typeof window==="undefined"||typeof document==="undefined")return false;
  if(window.__shotlabCoachFollowUpEnhancer)return true;window.__shotlabCoachFollowUpEnhancer=true;
  document.addEventListener("click",event=>{const row=event.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");if(row)window[CTX]={playerIdentity:clean(row.getAttribute("data-player-email")),playerName:clean(row.querySelector("strong")?.textContent)}},true);
  let host=null,drawer=null,key="",frame=null;
  const reconcile=()=>{frame=null;neutralizeLegacyNudges();const next=document.querySelector('[data-testid="coach-player-intelligence-drawer"]');if(!next){host?.remove?.();host=null;drawer=null;key="";return}const context=inferContext(next),nextKey=`${context.teamId}::${context.playerIdentity}`;if(!context.teamId||!context.playerIdentity)return;if(next===drawer&&host?.isConnected&&nextKey===key)return;host?.remove?.();drawer=next;key=nextKey;const dialog=drawer.querySelector('[role="dialog"]'),body=dialog?.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;if(!body||body===dialog)return;host=document.createElement("div");host.dataset.testid=HOST_TEST_ID;body.appendChild(host);mountPanel(host,context)};
  const schedule=()=>{if(frame==null)frame=requestAnimationFrame(reconcile)};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener("storage",schedule);schedule();return true;
}
