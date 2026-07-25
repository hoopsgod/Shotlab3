import React, { useEffect, useMemo, useState } from "react";
import "./CoachMissionControlV2.css";
import "./CoachMissionControlShell.css";
import "./CoachMissionControlHeader.css";
import { useTeamBranding } from "../context/TeamBrandingContext";
import useCleanTeamLogo from "./useCleanTeamLogo";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const initials = (value = "") => String(value).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL";

function Icon({ name, size = 22 }) {
  const paths = {
    home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    calendar: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
    plus: "M12 5v14M5 12h14",
    message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z",
    score: "M5 3h14v18H5zM9 7h6M9 11h6M9 15h3",
    close: "m6 6 12 12M18 6 6 18",
    menu: "M4 7h16M4 12h16M4 17h16",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    check: "m5 12 4 4L19 6",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.4-3.5a6.9 6.9 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.7-1L16 3.4h-4L11.6 6a8 8 0 0 0-1.7 1L7.5 6 5.5 9.4l2 1.6a6.9 6.9 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z",
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.home} /></svg>;
}

function Avatar({ item, size = 44 }) {
  const src = item?.avatarUrl || item?.photoUrl || item?.imageUrl || "";
  const label = item?.name || item?.title || "Player";
  return src ? <img className="mcAvatar" src={src} alt={`${label} headshot`} style={{ width: size, height: size }} /> : <span className="mcAvatar mcAvatar--fallback" aria-label={`${label} headshot placeholder`} style={{ width: size, height: size }}>{initials(label)}</span>;
}

function CourtArtwork({ logoUrl }) {
  return <div className="mcCourtArtwork" aria-hidden="true"><div className="mcArenaLights"><span /><span /><span /></div><div className="mcHoop"><span className="mcBackboard" /><span className="mcRim" /><span className="mcPost" /></div><div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" /><img src={logoUrl || FALLBACK_LOGO} alt="" /></div></div>;
}

function AttentionRow({ item, onFallback }) {
  const tone = item?.tone === "danger" ? "danger" : item?.tone === "success" ? "success" : "warning";
  return <button type="button" className="mcAttentionRow" onClick={item?.onClick || onFallback}><span className={`mcStatusDot is-${tone}`} /><Avatar item={item} /><span className="mcAttentionCopy"><strong>{item?.name || item?.title || "Player follow-up"}</strong><small>{item?.detail || "Review player status"}</small></span><span className="mcRowAction">Review <Icon name="arrow" size={16} /></span></button>;
}

export default function CoachCommandCenter({ variant = "full", totalPlayers, activeTodayCount, nextEventDateFormatted, highlightPlayersAttention, onPlayersClick, onActiveTodayClick, onNextEventClick, onAddPlayer, onAddDrill, onScheduleEvent, onLogScore, joinCode, onCopyJoinCode, onRegenerateJoinCode, codeErr, attentionItems = [], activityItems = [] }) {
  const { branding } = useTeamBranding();
  const logoUrl = branding?.logoUrl || branding?.logoMarkUrl || FALLBACK_LOGO;
  const cleanLogoUrl = useCleanTeamLogo(logoUrl);
  const teamName = branding?.teamName || branding?.name || "Thomas Titans";
  const accent = branding?.accentColor || branding?.primaryColor || "#C8FF1A";
  const secondary = branding?.secondaryColor || "#9CA3AF";
  const [copied, setCopied] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { document.body.classList.add("mission-control-active"); return () => document.body.classList.remove("mission-control-active"); }, []);

  const openBrandingSettings = () => {
    const existingBrandingControl = document.querySelector('[data-testid="coach-dashboard-identity-header"] button');
    existingBrandingControl?.click();
  };

  const rosterSize = Math.max(0, Number(totalPlayers) || 0);
  const activeCount = Math.max(0, Number(activeTodayCount) || 0);
  const activeRate = rosterSize ? clamp(Math.round((activeCount / rosterSize) * 100), 0, 100) : 0;
  const hasScheduledSession = Boolean(nextEventDateFormatted && String(nextEventDateFormatted).trim() && !/^(none|—|not set)$/i.test(String(nextEventDateFormatted).trim()));
  const resolvedAttention = attentionItems.length ? attentionItems : highlightPlayersAttention ? [{ name: "Roster follow-up", detail: "Inactive or unresolved player items", tone: "danger", onClick: onPlayersClick }] : [];
  const attentionCount = resolvedAttention.length;
  const primaryCommand = attentionCount > 0
    ? { eyebrow: "Priority action", title: `${attentionCount} player${attentionCount === 1 ? "" : "s"} need your attention`, detail: "Resolve the highest-impact player issue before moving on.", label: `Review ${attentionCount} player${attentionCount === 1 ? "" : "s"}`, onClick: onPlayersClick }
    : hasScheduledSession
      ? { eyebrow: "Today is under control", title: "Your next session is ready", detail: `The next scheduled team session is ${nextEventDateFormatted}.`, label: "Open next session", onClick: onNextEventClick }
      : { eyebrow: "Today needs a plan", title: "Create today’s practice", detail: "Set the team focus so every athlete knows what matters next.", label: "Create practice", onClick: onScheduleEvent };
  const resolvedActivity = activityItems.length ? activityItems : [activeCount ? { name: `${activeCount} athlete${activeCount === 1 ? "" : "s"} active`, detail: "Training activity recorded today", meta: "Today" } : null, hasScheduledSession ? { name: "Next team session", detail: String(nextEventDateFormatted), meta: "Scheduled" } : null].filter(Boolean);
  const quickActions = useMemo(() => [{ label: "Add Player", icon: "users", onClick: onAddPlayer }, { label: "Create Practice", icon: "calendar", onClick: onScheduleEvent }, { label: "Build Mission", icon: "target", onClick: onAddDrill }, { label: "Log Score", icon: "score", onClick: onLogScore }, { label: "Message Team", icon: "message", onClick: onPlayersClick }, { label: "View Analytics", icon: "chart", onClick: onActiveTodayClick }], [onActiveTodayClick, onAddDrill, onAddPlayer, onLogScore, onPlayersClick, onScheduleEvent]);
  const navigation = [{ label: "Mission Control", icon: "home", active: true }, { label: "Players", icon: "users", onClick: onPlayersClick }, { label: "Sessions", icon: "calendar", onClick: onNextEventClick }, { label: "Drills", icon: "target", onClick: onAddDrill }, { label: "Analytics", icon: "chart", onClick: onActiveTodayClick }];

  if (variant === "compact") return <section className="missionControlCompact" data-testid="coach-command-center-compact"><div><span>Next action</span><strong>{primaryCommand.title}</strong></div><button type="button" onClick={primaryCommand.onClick}>{primaryCommand.label}</button></section>;

  return <div className="mcShell mcShellV3" data-testid="coach-command-center-full" style={{ "--mc": accent, "--mc-secondary": secondary }}>
    <aside className="mcRail" aria-label="Coach navigation"><button type="button" className="mcRailBrand" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}><img className="mcRailLogo" src={cleanLogoUrl} alt={`${teamName} logo`} /></button><nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} onClick={item.onClick}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav><div className="mcCoachIdentity"><Avatar item={{ name: "Coach" }} size={42} /><span><small>Coach</small><strong>Mission Control</strong></span></div></aside>

    <main className="missionControl">
      <header className="mcHeader" data-testid="mission-control-team-header"><button className="mcMobileMenu" type="button" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Icon name="menu" /></button><div className="mcBrandLockup"><span className="mcBrandCopy"><small>{teamName}</small><strong>Mission Control</strong></span></div><div className="mcHeaderActions"><button type="button" className="mcTeamSelect" onClick={openBrandingSettings}>{teamName}<span>⌄</span></button><button type="button" className="mcBell" aria-label={`${attentionCount} notifications`}><Icon name="bell" /><b>{attentionCount}</b></button></div></header>

      <section className="mcHero" data-testid="coach-primary-objective">
        <CourtArtwork logoUrl={cleanLogoUrl} /><div className="mcHeroScrim" />
        <button type="button" className="mcHeroTeamMark" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}><img src={cleanLogoUrl} alt={`${teamName} logo`} /><span><Icon name="settings" size={13} /></span></button>
        <div className="mcHeroContent"><span className="mcEyebrow">{primaryCommand.eyebrow}</span><h1>{primaryCommand.title}</h1><p>{primaryCommand.detail}</p><div className="mcRealityStrip" data-testid="coach-primary-metrics"><button type="button" onClick={onActiveTodayClick}><strong>{activeCount}<span>/{rosterSize}</span></strong><small>Active today</small></button><button type="button" onClick={onPlayersClick}><strong>{attentionCount}</strong><small>Need follow-up</small></button><button type="button" onClick={onNextEventClick}><strong>{hasScheduledSession ? "Set" : "None"}</strong><small>Next session</small></button></div><button type="button" className="mcPrimary" onClick={primaryCommand.onClick}>{primaryCommand.label}<Icon name="arrow" /></button></div>
      </section>

      <section className="mcFocusGrid"><article className="mcSection mcAttention" aria-labelledby="mc-attention-heading"><div className="mcSectionHead"><span><small>Who needs you</small><h2 id="mc-attention-heading">Needs attention</h2></span><b>{attentionCount}</b></div>{attentionCount > 0 ? <div className="mcAttentionList">{resolvedAttention.slice(0, 3).map((item, index) => <AttentionRow key={`${item.name || item.title}-${index}`} item={item} onFallback={onPlayersClick} />)}</div> : <div className="mcAllClear"><span><Icon name="check" /></span><div><strong>All clear</strong><small>No urgent player follow-up right now.</small></div></div>}<button type="button" className="mcTextLink" onClick={onPlayersClick}>Open player workspace <Icon name="arrow" size={15} /></button></article><article className="mcSection mcTeamHealth" aria-labelledby="mc-health-heading"><div className="mcSectionHead"><span><small>Is the team moving</small><h2 id="mc-health-heading">Team activity</h2></span><strong className="mcHealthScore">{activeRate}%</strong></div><div className="mcHealthBar"><span style={{ width: `${activeRate}%` }} /></div><div className="mcHealthFacts"><div><strong>{activeCount}</strong><small>Active today</small></div><div><strong>{Math.max(rosterSize - activeCount, 0)}</strong><small>Not active today</small></div><div><strong>{rosterSize}</strong><small>Rostered</small></div></div><button type="button" className="mcTextLink" onClick={onActiveTodayClick}>Review team activity <Icon name="arrow" size={15} /></button></article></section>

      <section className="mcLowerGrid"><article className="mcSection mcActivity" aria-labelledby="mc-activity-heading"><div className="mcSectionHead"><span><small>What happened today</small><h2 id="mc-activity-heading">Live activity</h2></span></div>{resolvedActivity.length > 0 ? <div className="mcTimeline">{resolvedActivity.slice(0, 5).map((item, index) => <div key={`${item.name || item.title}-${index}`}><Avatar item={item} size={42} /><span><strong>{item.name || item.title}</strong><small>{item.detail || "Recent team activity"}</small></span><time>{item.meta || "Now"}</time></div>)}</div> : <div className="mcEmptyActivity"><Icon name="chart" /><strong>Your live feed starts here</strong><small>Player workouts, RSVPs, scores, and milestones will appear as they happen.</small></div>}</article><article className="mcSection mcNextSession" aria-labelledby="mc-session-heading"><div className="mcSectionHead"><span><small>What is next</small><h2 id="mc-session-heading">Next session</h2></span></div><div className="mcSessionSummary"><span className={`mcSessionIcon ${hasScheduledSession ? "is-ready" : ""}`}><Icon name="calendar" /></span><div><strong>{hasScheduledSession ? "Team session scheduled" : "No session scheduled"}</strong><small>{hasScheduledSession ? String(nextEventDateFormatted) : "Create the plan players should see next."}</small></div></div><button type="button" className="mcSecondaryAction" onClick={hasScheduledSession ? onNextEventClick : onScheduleEvent}>{hasScheduledSession ? "Open session" : "Create practice"}<Icon name="arrow" size={17} /></button></article></section>

      <div className="mcToolsRow"><button type="button" onClick={() => setToolsOpen((value) => !value)} aria-expanded={toolsOpen}>{toolsOpen ? "Hide team tools" : "Team tools"} <span>{toolsOpen ? "−" : "+"}</span></button></div>{toolsOpen ? <section className="mcSection mcTools" data-testid="coach-secondary-tools"><div><small>Team code</small><strong>{joinCode || "—"}</strong>{codeErr ? <span>{codeErr}</span> : null}</div><div><button type="button" onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? "Copied" : "Copy code"}</button><button type="button" onClick={onRegenerateJoinCode}>New code</button></div><span data-testid="coach-team-code-bar" /></section> : null}
    </main>

    <button type="button" className="mcFab" aria-label="Open quick actions" onClick={() => setActionsOpen(true)}><Icon name="plus" size={28} /></button><div className={`mcActionLayer ${actionsOpen ? "is-open" : ""}`} aria-hidden={!actionsOpen}><button type="button" className="mcActionBackdrop" aria-label="Close quick actions" onClick={() => setActionsOpen(false)} /><section className="mcActionSheet" aria-label="Coach quick actions"><div className="mcActionSheetHead"><span><small>Coach tools</small><strong>Quick actions</strong></span><button type="button" aria-label="Close quick actions" onClick={() => setActionsOpen(false)}><Icon name="close" /></button></div><div className="mcActionGrid">{quickActions.map((item) => <button type="button" key={item.label} onClick={() => { setActionsOpen(false); item.onClick?.(); }}><Icon name={item.icon} /><span>{item.label}</span></button>)}</div></section></div>

    <div className={`mcNavLayer ${navOpen ? "is-open" : ""}`} aria-hidden={!navOpen}><button type="button" className="mcNavBackdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} /><aside className="mcMobileDrawer"><div className="mcDrawerBrand"><button type="button" className="mcDrawerLogo" onClick={() => { setNavOpen(false); openBrandingSettings(); }}><img src={cleanLogoUrl} alt={`${teamName} logo`} /></button><span><small>{teamName}</small><strong>Mission Control</strong></span><button type="button" aria-label="Close navigation" onClick={() => setNavOpen(false)}><Icon name="close" /></button></div><nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} onClick={() => { setNavOpen(false); item.onClick?.(); }}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav></aside></div>
  </div>;
}
