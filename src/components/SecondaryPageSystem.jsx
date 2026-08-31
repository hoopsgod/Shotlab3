import ShotLabIcon from "./ShotLabIcon";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";
import "./SecondaryPageSystem.css";
import "./SecondaryPagePremiumMobile.css";
import "./Phase2PremiumActionLayer.css";
import "./Phase3CoachLeaderboardHierarchy.css";
import "../styles/Phase2PremiumRosterLayer.css";

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

export function SecondaryPageIntro({eyebrow,title,summary,status,actions=[],backAction=null,titleSize="auto",testId,icon}){
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
      titleSize={titleSize}
      brandTreatment="compact"
      testId={testId}
      className="secondaryPageTitleStage"
      dataLayoutRole="editorial-header"
      dataVisualRole="page-intro"
      dataPageKind={iconName}
      dataMobileStage="editorial"
      ariaLabel={`${displayTitle} team identity and page title`}
    />
  </div>
}

export function SecondaryPageToolbar({children,testId,label="Page tools"}){return <section className="secondaryPageToolbar" data-testid={testId} data-layout-role="evidence-tools" data-surface="light" data-visual-role="page-tools" aria-label={label}>{children}</section>}
export function SecondaryPageDecision({eyebrow,title,detail,tone="neutral",action,children,testId,icon}){
  const iconName=icon||iconFor(`${eyebrow} ${title}`);
  const mobile=mobileDecisionLayout();
  const sectionStyle=mobile?{gridTemplateColumns:"40px minmax(0,1fr)",alignItems:"start",minHeight:0,gap:14,padding:"19px 17px 18px"}:undefined;
  const titleStyle=mobile?{maxWidth:"22ch",fontSize:29,lineHeight:1.02,overflowWrap:"normal",wordBreak:"normal"}:undefined;
  const visualStyle=mobile?{gridColumn:"1 / -1",width:"100%",minWidth:0,padding:"15px 0 0",borderTop:"1px solid rgba(255,255,255,.09)",borderLeft:0}:undefined;
  return <section className="secondaryPageDecision" style={sectionStyle} data-tone={tone} data-testid={testId} data-layout-role="primary-decision" data-surface="dark" data-visual-role="primary-decision" data-page-kind={iconName} data-mobile-stage="performance"><span className="secondaryPageDecision__icon" aria-hidden="true"><ShotLabIcon name={iconName} size={23}/></span><div className="secondaryPageDecision__copy" style={mobile?{minWidth:0,width:"auto"}:undefined}>{eyebrow?<div className="secondaryPageDecision__eyebrow">{eyebrow}</div>:null}<h2 style={titleStyle}>{title}</h2>{detail?<p>{detail}</p>:null}{action?<button type="button" onClick={action.onClick} disabled={action.disabled}><span>{action.label}</span><ShotLabIcon name="arrow" size={16}/></button>:null}</div>{children?<div className="secondaryPageDecision__visual" style={visualStyle}>{children}</div>:null}</section>
}
export function SecondaryPageEvidence({children,testId,label="Supporting evidence"}){return <section className="secondaryPageEvidence" data-testid={testId} data-layout-role="supporting-evidence" data-surface="light" data-visual-role="supporting-evidence" aria-label={label}>{children}</section>}
