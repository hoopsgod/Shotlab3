import React, { useEffect, useMemo, useRef, useState } from "react";
import "./CoachMissionControlInteractions.css";
import "./CoachMissionControlShell.css";
import "./CoachMissionControlFinal.css";
import "./CoachMissionControlTitleStage.css";
import "./CoachActivationPath.css";
import "./CoachTeamMonogramFallback.css";
import "./CoachPriorityOverlay.css";
import { useTeamBranding } from "../context/TeamBrandingContext";
import { deriveCoachActivationPath } from "../lib/coachActivationPath.js";
import { buildCoachInboxModel } from "../lib/coachInbox.js";
import { getRemoteActiveNamesToday, loadCoachCrossDeviceActivity, mergeCoachActivityItems } from "../lib/coachCrossDeviceActivity.js";
import { isDemoPersistenceSession } from "../lib/demoMode.js";
import useCleanTeamLogo from "./useCleanTeamLogo";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const initials = (value = "") => String(value).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL";
const normalizedName = (value = "") => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
const isDefaultTitansLogo = (value = "") => [
  FALLBACK_LOGO,
  "/branding/titans-default-mark.svg",
  "/branding/titans-default-mark-free.svg",
].some((candidate) => String(value).includes(candidate));

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
    spark: "m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm6 13 .9 2.6L21.5 19l-2.6.9L18 22l-.9-2.1-2.6-.9 2.6-1.4L18 15Z",
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
  return <div className="mcCourtArtwork" aria-hidden="true">
    <svg viewBox="0 0 390 360" preserveAspectRatio="xMidYMid slice">
      <g className="mcCourtLines" transform="translate(221 12) rotate(-5 80 164)">
        <path d="M0 0h160v328H0zM160 76h-62v176h62M98 121a44 44 0 1 0 0 88M160 37c-64 8-91 54-91 127s27 119 91 127M0 164h34" />
        <circle cx="134" cy="164" r="7" />
      </g>
      <path className="mcCourtRoute" d="M286 65c-28 36-30 91-7 128 14 24 35 45 61 67" />
      <g className="mcCourtSignals"><circle cx="286" cy="65" r="4" /><circle cx="279" cy="193" r="4" /><circle cx="340" cy="260" r="4" /></g>
      {logoUrl ? <image className="mcCourtGhostMark" href={logoUrl} x="226" y="132" width="72" height="72" preserveAspectRatio="xMidYMid meet" /> : null}
    </svg>
  </div>;
}

function LogoSetupPrompt({ teamName, className = "" }) {
  const mark = initials(teamName);
  return <span className={["mcTeamFallback", className].filter(Boolean).join(" ")} data-team-logo-fallback={mark} aria-hidden="true"><strong>{mark}</strong><small>Add logo</small></span>;
}

function AttentionRow({ item, onFallback, priority = 0 }) {
  const tone = item?.tone === "danger" ? "danger" : item?.tone === "success" ? "success" : "warning";
  return <button type="button" className={`mcAttentionRow is-${tone} ${priority === 0 ? "is-priority" : ""}`} data-attention-priority={priority + 1} onClick={item?.onClick || onFallback}><span className={`mcStatusDot is-${tone}`} /><Avatar item={item} /><span className="mcAttentionCopy"><strong>{item?.name || item?.title || "Player follow-up"}</strong><small>{item?.detail || "Review player status"}</small>{item?.meta ? <span className="mcAttentionMeta">{item.meta}</span> : null}</span><span className="mcRowAction">{item?.actionLabel || "Review"} <Icon name="arrow" size={16} /></span></button>;
}

function ProgramPulsePanel({ model }) {
  const value = model?.value;
  const available = value != null && Number.isFinite(Number(value));
  const progress = available ? Math.max(0, Math.min(100, Number(value))) : 0;
  const state = !available ? "missing" : progress === 0 ? "zero" : progress >= 100 ? "complete" : "active";
  const summary = !available ? "No weekly goal data" : progress === 0 ? "No credited makes yet" : progress >= 100 ? "Weekly target met" : "Weekly target in progress";
  return <article className="mcSection mcTeamHealth" aria-labelledby="mc-program-pulse-heading" data-testid="coach-program-pulse" data-pulse-state={state}>
    <div className="mcPulseLead"><span><small>Weekly team target</small><h2 id="mc-program-pulse-heading">Program Pulse</h2></span><strong className="mcHealthScore">{available ? `${value}%` : "—"}</strong></div>
    <div className="mcPulseRail" role="progressbar" aria-label="Program Pulse weekly progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={available ? progress : undefined} aria-valuetext={summary}><span style={{ width: `${progress}%` }} /></div>
    <div className="mcPulseCaption"><span>{summary}</span><small>{available ? "Roster makes credited to the shared goal" : "Set a weekly makes goal to activate Pulse"}</small></div>
  </article>;
}
function LiveActivityPanel({ items }) {
  return <article className="mcSection mcActivity" aria-labelledby="mc-activity-heading" data-testid="coach-live-activity"><div className="mcSectionHead"><span><small>Team evidence</small><h2 id="mc-activity-heading">Recent Activity</h2></span></div>{items.length ? <div className="mcTimeline">{items.slice(0, 5).map((item, index) => <div key={`${item.id || item.name || item.title}-${index}`}><Avatar item={item} size={42} /><span><strong>{item.name || item.title}</strong><small>{item.detail || "Recent team activity"}</small></span><time>{item.meta || "Now"}</time></div>)}</div> : <div className="mcEvidenceEmpty"><strong>No recent activity</strong><small>Team training evidence will appear here.</small></div>}</article>;
}
function NextSessionPanel({ date, onOpen }) {
  const hasEvent = Boolean(date);
  return <article className="mcSection mcNextSession" aria-labelledby="mc-session-heading" data-testid="coach-upcoming-event" data-event-state={hasEvent ? "scheduled" : "empty"}><div className="mcSectionHead"><span><small>Coming up</small><h2 id="mc-session-heading">Upcoming Event</h2></span></div><div className="mcSessionSummary"><span className={`mcSessionIcon ${hasEvent ? "is-ready" : ""}`}><Icon name="calendar" /></span><div><strong>{hasEvent ? "Team event ready" : "No upcoming event"}</strong><small>{hasEvent ? String(date) : "Create the next team touchpoint when you’re ready."}</small></div></div><button type="button" className="mcSecondaryAction" onClick={onOpen}>{hasEvent ? "Open event" : "Open schedule"}<Icon name="arrow" size={17} /></button></article>;
}
function TodayPlan({ activation, onAction }) {
  const next = activation?.next;
  if (!next) return null;
  return <article className="mcTodayPlan mcActivationPlan" data-testid="coach-onboarding-state" data-home-role="supporting"><span className="mcTodayPlanIcon"><Icon name={next.icon || "spark"} size={21} /></span><span className="mcTodayPlanCopy"><small>Coach activation · {activation.completed}/{activation.total}</small><strong>{next.title}</strong><em>{next.detail}</em><span className="mcActivationProgress" aria-label={`${activation.completed} of ${activation.total} activation milestones complete`}><span className="mcActivationProgressTrack"><span style={{ width: `${activation.progress}%` }} /></span><strong>{activation.progress}% ready</strong></span></span><button type="button" onClick={() => onAction?.(next.action)}>{next.label}<Icon name="arrow" size={16} /></button></article>;
}

export default function CoachCommandCenter({
  variant = "full", totalPlayers, activeTodayCount, nextEventDateFormatted, highlightPlayersAttention, onPlayersClick, onActiveTodayClick, onAnalyticsClick, onNextEventClick, onAddPlayer, onAddDrill, onScheduleEvent, onLogScore, joinCode, onCopyJoinCode, onRegenerateJoinCode, codeErr, attentionItems = [], activityItems = [], eventReadiness = null, onEventReadinessClick, programPulse = null,
}) {
  const { branding } = useTeamBranding();
  const isDemoSession = isDemoPersistenceSession();
  const configuredFullLogoSource = branding?.logoUrl && !isDefaultTitansLogo(branding.logoUrl) ? branding.logoUrl : "";
  const fullLogoSource = configuredFullLogoSource || (isDemoSession ? (branding?.logoUrl || FALLBACK_LOGO) : "");
  const cleanFullLogoUrl = useCleanTeamLogo(fullLogoSource);
  const teamName = branding?.teamName || branding?.name || (isDemoSession ? "Thomas Titans" : "Your Team");
  const fullTeamLogoUrl = fullLogoSource ? cleanFullLogoUrl : "";
  const heroTeamLogoUrl = fullTeamLogoUrl;
  const accent = branding?.accentColor || branding?.primaryColor || "#C8FF1A";
  const secondary = branding?.secondaryColor || "#9CA3AF";
  const [copied, setCopied] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [prioritiesOpen, setPrioritiesOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [remoteActivityItems, setRemoteActivityItems] = useState([]);
  const inboxRef = useRef(null);
  const restoreInboxFocusRef = useRef(true);

  useEffect(() => { document.body.classList.add("mission-control-active"); return () => { document.body.classList.remove("mission-control-active"); document.body.classList.remove("mission-control-priority-open"); }; }, []);
  useEffect(() => {
    let cancelled = false; let requestActive = false;
    const refresh = async () => { if (requestActive) return; requestActive = true; const result = await loadCoachCrossDeviceActivity({ joinCode }); requestActive = false; if (!cancelled && result.ok) setRemoteActivityItems(result.items); };
    const onFocus = () => void refresh(); const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh(); const timer = window.setInterval(refresh, 15_000); window.addEventListener("focus", onFocus); document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, [joinCode]);

  const openBrandingSettings = () => { document.querySelector('[data-testid="coach-dashboard-identity-header"] button')?.click(); };
  const openTeamTools = () => { setActionsOpen(false); setToolsOpen(true); window.setTimeout(() => document.querySelector('[data-testid="coach-secondary-tools"]')?.scrollIntoView({ behavior: "smooth", block: "center" }), 40); };
  const closePriorityEditor = () => { const editor = document.querySelector('[data-testid="coach-priority-editor"]'); if (editor) { editor.open = false; editor.removeAttribute("role"); editor.removeAttribute("aria-modal"); editor.removeAttribute("aria-label"); } document.body.classList.remove("mission-control-priority-open"); setPrioritiesOpen(false); };
  const openPriorityEditor = () => { const editor = document.querySelector('[data-testid="coach-priority-editor"]'); if (!editor) return; setActionsOpen(false); setNavOpen(false); editor.open = true; editor.setAttribute("role", "dialog"); editor.setAttribute("aria-modal", "true"); editor.setAttribute("aria-label", "Set team focus"); document.body.classList.add("mission-control-priority-open"); setPrioritiesOpen(true); window.setTimeout(() => editor.querySelector("input, select, textarea, button")?.focus?.({ preventScroll: true }), 60); };
  useEffect(() => { if (!prioritiesOpen) return undefined; const onKeyDown = (event) => { if (event.key === "Escape") closePriorityEditor(); }; document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown); }, [prioritiesOpen]);
  useEffect(() => {
    if (!inboxOpen) return undefined;
    const previousActiveElement = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") { restoreInboxFocusRef.current = true; setInboxOpen(false); return; }
      if (event.key !== "Tab") return;
      const controls = [...(inboxRef.current?.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])") || [])];
      if (!controls.length) return; const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown); window.setTimeout(() => inboxRef.current?.querySelector("button")?.focus?.({ preventScroll: true }), 40);
    return () => { document.removeEventListener("keydown", onKeyDown); if (restoreInboxFocusRef.current) previousActiveElement?.focus?.({ preventScroll: true }); };
  }, [inboxOpen]);
  const openInbox = () => { restoreInboxFocusRef.current = true; setInboxOpen(true); };
  const closeInbox = () => { restoreInboxFocusRef.current = true; setInboxOpen(false); };

  const mergedActivityItems = useMemo(() => mergeCoachActivityItems({ localItems: activityItems, remoteItems: remoteActivityItems }), [activityItems, remoteActivityItems]);
  const remoteActiveNames = useMemo(() => getRemoteActiveNamesToday(remoteActivityItems), [remoteActivityItems]);
  const rosterSize = Math.max(0, Number(totalPlayers) || 0);
  const localActiveCount = Math.max(0, Number(activeTodayCount) || 0);
  const activeCount = Math.min(rosterSize || remoteActiveNames.size, Math.max(localActiveCount, remoteActiveNames.size));
  const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);
  const hasScheduledSession = Boolean(nextEventDateFormatted && String(nextEventDateFormatted).trim() && !/^(none|—|not set)$/i.test(String(nextEventDateFormatted).trim()));
  const fallbackAttention = highlightPlayersAttention ? [{ name: "Roster activity gap", detail: rosterSize === 1 ? "No training activity has been logged this week." : "At least one player has no logged activity this week.", meta: "Review training status and account connection", tone: "danger", actionLabel: "Open", onClick: onPlayersClick }] : [];
  const attentionSource = attentionItems.length ? attentionItems : fallbackAttention;
  const resolvedAttention = attentionSource.filter((item) => !remoteActiveNames.has(normalizedName(item?.name || item?.title)));
  const attentionCount = resolvedAttention.length;
  const resolvedActivity = mergedActivityItems.length ? mergedActivityItems : [activeCount ? { name: `${activeCount} athlete${activeCount === 1 ? "" : "s"} active`, detail: "Training activity recorded today", meta: "Today" } : null].filter(Boolean);
  const hasLiveActivity = resolvedActivity.length > 0;
  const activationPath = useMemo(() => deriveCoachActivationPath({ teamCode: joinCode, teamName, logoUrl: fullLogoSource, fallbackLogo: FALLBACK_LOGO, rosterSize, hasScheduledSession, activeTodayCount: activeCount, hasLiveActivity }), [activeCount, fullLogoSource, hasLiveActivity, hasScheduledSession, joinCode, rosterSize, teamName]);
  const inboxModel = useMemo(() => buildCoachInboxModel({ attentionItems: resolvedAttention, activationPath, hasScheduledSession, nextEventDateFormatted, eventReadiness }), [activationPath, eventReadiness, hasScheduledSession, nextEventDateFormatted, resolvedAttention]);
  const onboardingMode = !activationPath.complete;

  const runActivationAction = (action) => { if (action === "team-tools") { openTeamTools(); return; } if (action === "branding") { openBrandingSettings(); return; } if (action === "add-player") { onAddPlayer?.(); return; } if (action === "schedule-session") { onScheduleEvent?.(); return; } if (action === "review-engagement") onPlayersClick?.(); };
  const runInboxAction = (item) => { restoreInboxFocusRef.current = false; setInboxOpen(false); if (item?.action === "open-attention") { const source = resolvedAttention[item.sourceIndex]; (source?.onClick || onPlayersClick)?.(); return; } if (item?.action === "open-session") { onNextEventClick?.(); return; } if (item?.action === "open-event-readiness") { onEventReadinessClick?.(item.eventId); return; } runActivationAction(item?.action); };

  const activationCommand = onboardingMode && activationPath.next ? { eyebrow: `Activation · ${activationPath.completed}/${activationPath.total}`, title: activationPath.next.title, detail: activationPath.next.detail, label: activationPath.next.label, onClick: () => runActivationAction(activationPath.next.action), state: "planning" } : null;
  const primaryCommand = attentionCount > 0
    ? { eyebrow: "Today at a glance", title: `${attentionCount} decision${attentionCount === 1 ? "" : "s"} before practice`, detail: "Clear the priority, then set today’s plan.", label: "Review priority", onClick: onPlayersClick, state: "attention" }
    : unresolvedRsvps > 0
      ? { eyebrow: "Today at a glance", title: "1 decision before practice", detail: unresolvedRsvps + " RSVP" + (unresolvedRsvps === 1 ? "" : "s") + " still open for " + (eventReadiness?.title || "the next session") + ".", label: "Review RSVPs", onClick: () => onEventReadinessClick?.(eventReadiness?.key), state: "attention" }
      : activationCommand || (hasScheduledSession
        ? { eyebrow: "Practice ready", title: "Today is under control", detail: `Your next team session is ${nextEventDateFormatted}.`, label: "Open session", onClick: onNextEventClick, state: "ready" }
        : { eyebrow: "Today’s next move", title: "Build today’s practice", detail: "Set the focus every athlete should see next.", label: "Create practice", onClick: onScheduleEvent, state: "planning" });
  const quickActions = useMemo(() => [{ label: "Add Player", icon: "users", onClick: onAddPlayer }, { label: "Create Practice", icon: "calendar", onClick: onScheduleEvent }, { label: "Set Team Focus", icon: "spark", onClick: openPriorityEditor }, { label: "Build Mission", icon: "target", onClick: onAddDrill }, { label: "Record Result", icon: "score", onClick: onLogScore }, { label: "Review Players", icon: "message", onClick: onPlayersClick }, { label: "Team Code", icon: "settings", onClick: openTeamTools }], [onAddDrill, onAddPlayer, onLogScore, onPlayersClick, onScheduleEvent]);
  const navigation = [{ label: "Mission Control", icon: "home", active: true }, { label: "Players", icon: "users", onClick: onPlayersClick }, { label: "Sessions", icon: "calendar", onClick: onNextEventClick }, { label: "Drills", icon: "target", onClick: onAddDrill }, { label: "Analytics", icon: "chart", onClick: onAnalyticsClick }, { label: "Coach Tools", icon: "plus", onClick: () => setActionsOpen(true) }];

  const attentionPanel = <article className="mcSection mcAttention" aria-labelledby="mc-attention-heading" data-testid="coach-athlete-attention"><div className="mcSectionHead"><span><small>Who needs you now</small><h2 id="mc-attention-heading">Needs attention</h2></span>{attentionCount > 0 ? <b>{attentionCount}</b> : null}</div>{attentionCount > 0 ? <div className="mcAttentionList">{resolvedAttention.slice(0, 3).map((item, index) => <AttentionRow key={`${item.name || item.title}-${index}`} item={item} onFallback={onPlayersClick} priority={index} />)}</div> : <div className="mcAllClear"><span><Icon name="check" /></span><div><strong>All clear</strong><small>No urgent player follow-up right now.</small></div></div>}<button type="button" className="mcTextLink" onClick={onPlayersClick}>Open player workspace <Icon name="arrow" size={15} /></button></article>;
  const pulsePanel = <ProgramPulsePanel model={programPulse} />;
  const livePanel = <LiveActivityPanel items={resolvedActivity} />;
  const sessionPanel = <NextSessionPanel date={hasScheduledSession ? nextEventDateFormatted : ""} onOpen={onNextEventClick} />;

  if (variant === "compact") return <section className="missionControlCompact" data-testid="coach-command-center-compact"><div><span>Next action</span><strong>{primaryCommand.title}</strong></div><button type="button" onClick={primaryCommand.onClick}>{primaryCommand.label}</button></section>;

  return <>
    <div className={`mcShell mcShellV3 ${onboardingMode ? "is-onboarding" : "has-team-data"}`} data-testid="coach-command-center-full" data-home-hierarchy="decision-first" data-mobile-product-reset="phase-1" data-visual-system="phase-4-premium" style={{ "--mc": accent, "--mc-secondary": secondary }}>
      <aside className="mcRail" aria-label="Coach navigation">
        <button type="button" className="mcRailBrand" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}>{fullTeamLogoUrl ? <img className="mcRailLogo" src={fullTeamLogoUrl} alt={`${teamName} logo`} /> : <LogoSetupPrompt teamName={teamName} className="mcRailLogoSetup" />}</button>
        <nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} onClick={item.onClick}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <div className="mcCoachIdentity"><Avatar item={{ name: "Coach" }} size={42} /><span><small>Coach</small><strong>Mission Control</strong></span></div>
      </aside>

      <main className="missionControl">
        <header className="mcHeader" data-testid="mission-control-team-header">
          <button className="mcMobileMenu" type="button" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <div className="mcBrandLockup"><button type="button" className="mcHeaderTeamMark" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}>{heroTeamLogoUrl ? <img src={heroTeamLogoUrl} alt="" /> : <LogoSetupPrompt teamName={teamName} className="mcHeaderLogoSetup" />}</button><span className="mcBrandCopy"><small>Coach mode</small><strong>{teamName}</strong></span></div>
          <div className="mcHeaderActions"><button type="button" className="mcTeamSelect" onClick={openBrandingSettings}>{teamName}<span>⌄</span></button><button type="button" className="mcBell" aria-label={`Open Coach Inbox, ${inboxModel.actionableCount} ${inboxModel.actionableCount === 1 ? "item" : "items"}`} aria-expanded={inboxOpen} aria-controls="coach-inbox-panel" onClick={openInbox}><Icon name="bell" />{inboxModel.actionableCount > 0 ? <b>{inboxModel.actionableCount}</b> : null}</button></div>
        </header>

        <section className={`mcHero is-${primaryCommand.state}`} data-testid="coach-primary-objective" data-home-role="primary" data-team-identity-stage="coach-mission-control">
          <CourtArtwork logoUrl={heroTeamLogoUrl} /><div className="mcHeroScrim" />
          <div className="mcHeroContent">
            <div className="mcHeroIdentity">
              <div className="mcHeroIdentityCopy"><span className="mcProgramIdentity">{teamName}</span><span className="mcEyebrow">Coach Mode · {primaryCommand.eyebrow}</span></div>
              <button type="button" className="mcHeroTeamMark" onClick={openBrandingSettings} aria-label={`Customize ${teamName} team identity`}>{heroTeamLogoUrl ? <img src={heroTeamLogoUrl} alt={`${teamName} logo`} /> : <LogoSetupPrompt teamName={teamName} className="mcHeroLogoSetup" />}</button>
            </div>
            <h1>{primaryCommand.title}</h1><p>{primaryCommand.detail}</p>
            <div className="mcRealityStrip" data-testid="coach-primary-metrics"><button type="button" onClick={onActiveTodayClick}><strong>{activeCount}<span>/{rosterSize}</span></strong><small>Active</small></button><button type="button" onClick={onPlayersClick}><strong>{attentionCount}</strong><small>Follow-up</small></button><button type="button" onClick={onNextEventClick}><strong>{hasScheduledSession ? "Set" : "—"}</strong><small>Next</small></button></div>
            <button type="button" className="mcPrimary" onClick={primaryCommand.onClick}>{primaryCommand.label}<Icon name="arrow" /></button>
          </div>
        </section>

        <section className="mcFocusGrid" data-layout-role="program-intelligence">{pulsePanel}{attentionPanel}</section>
        {onboardingMode ? <section className="mcActivationChapter"><TodayPlan activation={activationPath} onAction={runActivationAction} /></section> : null}
        <section className="mcLowerGrid has-2-panels" data-layout-role="supporting-evidence">{sessionPanel}{livePanel}</section>
        {toolsOpen ? <section className="mcSection mcTools" data-testid="coach-secondary-tools"><div><small>Team code</small><strong>{joinCode || "—"}</strong>{codeErr ? <span>{codeErr}</span> : null}</div><div><button type="button" onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? "Copied" : "Copy code"}</button><button type="button" onClick={onRegenerateJoinCode}>New code</button><button type="button" onClick={() => setToolsOpen(false)}>Close</button></div><span data-testid="coach-team-code-bar" /></section> : null}
      </main>

      {prioritiesOpen ? <div className="mcPriorityOverlayLayer" data-testid="coach-priority-overlay"><button type="button" className="mcPriorityOverlayBackdrop" aria-label="Close team focus editor" onClick={closePriorityEditor} /><button type="button" className="mcPriorityOverlayClose" aria-label="Close team focus editor" onClick={closePriorityEditor}><Icon name="close" size={20} /></button></div> : null}
      {inboxOpen ? <div className="mcInboxLayer" data-testid="coach-inbox-layer"><button type="button" className="mcInboxBackdrop" aria-label="Close Coach Inbox" onClick={closeInbox} /><section ref={inboxRef} id="coach-inbox-panel" className="mcInboxPanel" role="dialog" aria-modal="true" aria-labelledby="coach-inbox-title" data-testid="coach-inbox"><header className="mcInboxHead"><span><small>Live team signals</small><strong id="coach-inbox-title">Coach Inbox</strong></span><button type="button" aria-label="Close Coach Inbox" onClick={closeInbox}><Icon name="close" /></button></header><div className="mcInboxSummary"><strong>{inboxModel.actionableCount > 0 ? `${inboxModel.actionableCount} ${inboxModel.actionableCount === 1 ? "move" : "moves"} to make` : "You’re caught up"}</strong><span>Only current team actions appear here.</span></div>{inboxModel.items.length > 0 ? <div className="mcInboxList">{inboxModel.items.map((item, index) => <button type="button" key={`${item.kind}-${item.title}-${index}`} className={`mcInboxItem is-${item.tone || item.kind}`} onClick={() => runInboxAction(item)}><span className="mcInboxItemIcon"><Icon name={item.kind === "attention" ? "users" : item.kind === "event-readiness" ? "calendar" : "spark"} size={19} /></span><span className="mcInboxItemCopy"><small>{item.kind === "attention" ? "Player follow-up" : item.kind === "event-readiness" ? "Event readiness" : "Team launch"}</small><strong>{item.title}</strong><em>{item.detail}</em>{item.meta ? <b>{item.meta}</b> : null}</span><span className="mcInboxItemAction">{item.label}<Icon name="arrow" size={15} /></span></button>)}</div> : <div className="mcInboxAllClear"><span><Icon name="check" /></span><div><strong>No follow-up needed</strong><small>No player, RSVP, or team-launch tasks need attention right now.</small></div></div>}{inboxModel.context ? <button type="button" className="mcInboxContext" onClick={() => runInboxAction(inboxModel.context)}><span className="mcInboxItemIcon"><Icon name="calendar" size={19} /></span><span><small>Coming up</small><strong>{inboxModel.context.title}</strong><em>{inboxModel.context.detail}</em></span><b>{inboxModel.context.label}<Icon name="arrow" size={15} /></b></button> : null}<footer>Built from live roster, RSVP, activation, and schedule data.</footer></section></div> : null}

      <div className={`mcActionLayer ${actionsOpen ? "is-open" : ""}`} aria-hidden={!actionsOpen}><button type="button" className="mcActionBackdrop" aria-label="Close quick actions" onClick={() => setActionsOpen(false)} /><section className="mcActionSheet" aria-label="Coach quick actions"><div className="mcActionSheetHead"><span><small>Coach command menu</small><strong>Quick actions</strong></span><button type="button" aria-label="Close quick actions" onClick={() => setActionsOpen(false)}><Icon name="close" /></button></div><div className="mcActionGrid">{quickActions.map((item) => <button type="button" key={item.label} onClick={() => { setActionsOpen(false); item.onClick?.(); }}><Icon name={item.icon} /><span>{item.label}</span></button>)}</div></section></div>
      <div className={`mcNavLayer ${navOpen ? "is-open" : ""}`} aria-hidden={!navOpen}><button type="button" className="mcNavBackdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} /><aside className="mcMobileDrawer"><div className="mcDrawerBrand"><button type="button" className="mcDrawerLogo" onClick={() => { setNavOpen(false); openBrandingSettings(); }}>{fullTeamLogoUrl ? <img src={fullTeamLogoUrl} alt={`${teamName} logo`} /> : <LogoSetupPrompt teamName={teamName} className="mcDrawerLogoSetup" />}</button><span><small>{teamName}</small><strong>Mission Control</strong></span><button type="button" aria-label="Close navigation" onClick={() => setNavOpen(false)}><Icon name="close" /></button></div><nav>{navigation.map((item) => <button key={item.label} type="button" className={item.active ? "is-active" : ""} onClick={() => { setNavOpen(false); item.onClick?.(); }}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav></aside></div>
    </div>
  </>;
}
