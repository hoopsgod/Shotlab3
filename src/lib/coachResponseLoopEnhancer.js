import{openExactPlayerFollowUp}from"./coachAssignmentOutcomeEnhancer.js";
import{buildCoachResponseContext,setCoachResponseContext}from"./coachPlayerResponseLoop.js";
const ACTIVITY_SELECTOR='[data-testid="coach-live-activity"]',ROW_SELECTOR=ACTIVITY_SELECTOR+" .mcTimeline > div";
const PLAYER_DRAWER_SELECTOR='[data-testid="coach-player-intelligence-drawer"]';
const PLAYER_STATS_ROW_SELECTOR="#coach-roster-operations .phase1RosterRow";
const PLAYER_PROFILE_ACTION_SELECTOR='[data-phase1-open-profile="true"]';
const clean=v=>String(v??"").trim(),norm=v=>clean(v).toLowerCase().replace(/\s+/g," ");

export function readLiveResultRow(row){
 const playerName=clean(row?.querySelector?.("strong")?.textContent),detail=clean(row?.querySelector?.("small")?.textContent),meta=clean(row?.querySelector?.("time")?.textContent),name=norm(playerName);
 return{actionable:!!(playerName&&detail)&&name!=="team"&&!/athletes? active|player activity/i.test(name)&&/(home shots?|shooting|drill score|score|strength|s&c|makes?|logged|completed)/i.test(detail),playerName,detail,meta};
}
export function findPlayerStatsRow(root,playerName){
 const target=norm(playerName);if(!root?.querySelectorAll||!target)return null;
 return[...root.querySelectorAll(PLAYER_STATS_ROW_SELECTOR)].find(row=>{const heading=norm(row?.querySelector?.("strong")?.textContent);return heading?heading===target:norm(row?.textContent).includes(target)})||null;
}
export function openPlayerStatsRow(row){
 const action=row?.querySelector?.(PLAYER_PROFILE_ACTION_SELECTOR)||row?.querySelector?.("button.coachRosterCard__profile");if(!action?.click)return false;action.click();return true;
}
export function ensurePlayerStatsDrawerOpens(playerName,target=window,root=document){
 if(!target?.setTimeout||!root?.querySelector||!root?.body)return false;if(root.querySelector(PLAYER_DRAWER_SELECTOR))return true;
 let done=false,observer;const finish=()=>{done=true;observer?.disconnect?.()},recover=()=>{if(done)return;if(root.querySelector(PLAYER_DRAWER_SELECTOR))return finish();openPlayerStatsRow(findPlayerStatsRow(root, playerName))};
 observer=target.MutationObserver?new target.MutationObserver(()=>{if(root.querySelector(PLAYER_DRAWER_SELECTOR))finish()}):null;observer?.observe?.(root.body,{childList:true,subtree:true});
 for(const delay of[650,1500,2800,4500])target.setTimeout(recover,delay);return true;
}
export function openLiveResultResponse(row){
 const result=readLiveResultRow(row);if(!result.actionable)return false;
 const context=setCoachResponseContext(buildCoachResponseContext({playerIdentity:result.playerName,playerName:result.playerName,detail:result.detail,meta:result.meta}));if(!context)return false;
 const opened=openExactPlayerFollowUp({searchIdentity:result.playerName,name:result.playerName});ensurePlayerStatsDrawerOpens(result.playerName);return opened;
}
function markRows(){
 for(const row of document.querySelectorAll(ROW_SELECTOR)){
  const result=readLiveResultRow(row);
  if(!result.actionable){for(const a of["data-shotlab-response-row","role","tabindex","aria-label"])row.removeAttribute(a);continue}
  row.dataset.shotlabResponseRow="true";row.setAttribute("role","button");row.setAttribute("tabindex","0");row.setAttribute("aria-label",`Review ${result.playerName} result and record next assignment`);
 }
}
export function installCoachResponseLoopEnhancer(){
 if(typeof window==="undefined"||typeof document==="undefined")return false;if(window.__shotlabCoachResponseLoopEnhancer)return true;window.__shotlabCoachResponseLoopEnhancer=true;
 const open=e=>{const row=e.target?.closest?.(ROW_SELECTOR+'[data-shotlab-response-row="true"]');if(row)openLiveResultResponse(row)};
 document.addEventListener("click",open,true);document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const row=e.target?.closest?.(ROW_SELECTOR+'[data-shotlab-response-row="true"]');if(!row)return;e.preventDefault();openLiveResultResponse(row)},true);
 let frame;const schedule=()=>{if(frame!=null)return;frame=requestAnimationFrame(()=>{frame=null;markRows()})};new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});schedule();return true;
}
