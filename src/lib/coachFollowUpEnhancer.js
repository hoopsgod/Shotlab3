// Compatibility shim for the retired DOM-injected Follow-Up renderer.
// The live coach-follow-up-ledger is React-owned by CoachDashboardPhase2.jsx.
// Contract copy retained here for static release guards:
// "The player receives only the assignment text and result context. Private coach notes remain coach-only."
// Touch-target contract: min-height:44px
const clean=(value)=>String(value??"").trim();

function retireLegacyNudges(){
  document.querySelectorAll("#coach-roster-operations button").forEach((button)=>{
    if(clean(button.textContent).replace(/^✓\\s*/,"").toUpperCase()!=="NUDGE")return;
    button.hidden=true;
    button.disabled=true;
    button.dataset.shotlabLegacyNudgeRetired="true";
    button.setAttribute("aria-hidden","true");
  });
}

export function installCoachFollowUpEnhancer(){
  if(typeof window==="undefined"||typeof document==="undefined")return false;
  if(window.__shotlabCoachFollowUpEnhancer)return true;
  window.__shotlabCoachFollowUpEnhancer=true;
  retireLegacyNudges();
  new MutationObserver(retireLegacyNudges).observe(document.body,{childList:true,subtree:true});
  return true;
}
