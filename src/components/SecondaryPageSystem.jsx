import { useEffect, useRef, useState } from "react";
import ShotLabIcon from "./ShotLabIcon";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";
import "./SecondaryPageSystem.css";
import "./SecondaryPagePremiumMobile.css";
import "./Phase2PremiumActionLayer.css";
import "./Phase3CoachLeaderboardHierarchy.css";
import "./CoachSecondaryExperience.css";
// Keep the Coach Players presentation as one dedicated production authority.
// The query prevents the optimized CSS restructure from folding this route-owned
// layer into an earlier shared chunk where late authenticated styles can erase it.
import "../styles/Phase2PremiumRosterLayer.css?roster-authority";

const ICONS=[[/player|roster/,"team"],[/event|schedule|calendar/,"calendar"],[/strength|lifting|conditioning/,"strength"],[/activity|signal|feed/,"activity"],[/career|profile/,"profile"],[/leader|rank/,"trophy"],[/store/,"store"],[/progress|analytic/,"chart"],[/program|brand|identity/,"program"],[/account|setting/,"settings"],[/coach|assignment/,"coach"],[/training|drill/,"training"]];
const iconFor=value=>ICONS.find(([pattern])=>pattern.test(String(value).toLowerCase()))?.[1]||"target";
const TITLE_LABELS=new Map([
  ["Drills Dashboard","Drills"],
  ["Strength & Conditioning Dashboard","S&C"],
  ["Activity Dashboard","Activity"],
  ["Leaderboards Dashboard","Leaderboards"],
]);
const normalizeTitle=value=>TITLE_LABELS.get(String(value||""))||value;
const mobileDecisionLayout=()=>typeof window!=="undefined"&&Math.min(window.innerWidth||Infinity,window.visualViewport?.width||Infinity,window.screen?.width||Infinity)<=760;

export function SecondaryPageShell({children,testId,className=""}){return <section className={["secondaryPageShell",className].filter(Boolean).join(" ")} data-testid={testId} data-page-hierarchy="editorial" data-surface="light" data-visual-role="secondary-page">{children}</section>}

export function SecondaryPageIntro({eyebrow,title,summary,status,actions=[],backAction=null,titleSize="auto",testId,icon,compact=false}){
  const displayTitle=normalizeTitle(title);
  const iconName=icon||iconFor(`${eyebrow} ${title} ${displayTitle}`);
  return <div className="teamIdentityTitleStageFrame" data-layout-role="title-and-operations" data-title-stage-family="editorial">
    <TeamIdentityTitleStage
      variant="standard"
      surface="light"
      role={eyebrow||"Team"}
      title={displayTitle}
      summary={summary}
      status={status}
      actions={actions}
      backAction={backAction}
      icon={iconName}
      titleSize={titleSize}
      compact={compact}
      testId={testId}
    />
  </div>;
}

export function SecondaryPageDecision({eyebrow,title,summary,action=null,children,testId,className=""}){
  const rootRef=useRef(null);
  const [collapsed,setCollapsed]=useState(()=>mobileDecisionLayout());
  useEffect(()=>{
    const onResize=()=>{if(!mobileDecisionLayout())setCollapsed(false)};
    window.addEventListener("resize",onResize,{passive:true});
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  return <section ref={rootRef} className={["secondaryPageDecision",className].filter(Boolean).join(" ")} data-testid={testId} data-layout-role="decision-support" data-surface="light" data-collapsed={collapsed?"true":"false"}>
    <div className="secondaryPageDecision__heading">
      <div>
        {eyebrow&&<span className="secondaryPageDecision__eyebrow">{eyebrow}</span>}
        {title&&<h2>{title}</h2>}
        {summary&&<p>{summary}</p>}
      </div>
      <div className="secondaryPageDecision__actions">
        {action&&<button type="button" onClick={action.onClick}>{action.label}</button>}
        <button type="button" className="secondaryPageDecision__toggle" aria-expanded={!collapsed} onClick={()=>setCollapsed(value=>!value)}>{collapsed?"Show":"Hide"}</button>
      </div>
    </div>
    {!collapsed&&children}
  </section>;
}
