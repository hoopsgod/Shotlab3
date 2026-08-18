import { useMemo, useRef, useState } from "react";
import {
  EventTimeLocation,
  EventTypeBadge,
  EventsMonthPanel,
  EventsSectionHeader,
  EventsTitleStage,
  EventsWeekRail,
  NextEventSurface,
  formatEventDayStamp,
  formatMonthLabel,
} from "./EventsMobilePrimitives.jsx";
import styles from "./PlayerCommitmentCenter.module.css";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const normalize = (value) => clean(value).toLowerCase();
const RUNWAY_SLOTS = 4;

function rowDate(row = {}) {
  return clean(row?.date || row?.session_date || row?.created_at).slice(0, 10);
}

function teamMatches(row = {}, teamId = "") {
  const target = clean(teamId);
  const candidate = clean(row?.teamId || row?.team_id);
  return !target || !candidate || candidate === target;
}

function identityMatches(row = {}, email = "") {
  const target = normalize(email);
  if (!target) return false;
  return [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.userId, row?.user_id]
    .map(normalize)
    .some((candidate) => candidate === target);
}

function responseItemId(row = {}, mode = "events") {
  return clean(mode === "strength" ? row?.sessionId || row?.session_id : row?.eventId || row?.event_id);
}

function itemTitle(item = {}, mode = "events") {
  return clean(mode === "strength" ? item?.sport || item?.title : item?.title) || (mode === "strength" ? "Strength session" : "Team event");
}

function itemLocation(item = {}, mode = "events") {
  if (mode === "strength") return clean(item?.location || item?.sessionType || item?.session_type) || "Location TBD";
  return clean(item?.location) || "Location TBD";
}

function formatDateParts(dateValue = "") {
  if (!dateValue) return { month: "—", day: "—", weekday: "Schedule" };
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "—", day: "—", weekday: "Schedule" };
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString(undefined, { day: "2-digit" }),
    weekday: date.toLocaleDateString(undefined, { weekday: "long" }),
  };
}

function CommitmentIcon({ mode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M17.5 7h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5" /></svg>;
}

function QueueRow({ item, mode, confirmed }) {
  const parts = formatDateParts(rowDate(item));
  return <div className={styles.queueRow}><div className={styles.queueDate}><strong>{parts.day}</strong><span>{parts.month}</span></div><div className={styles.queueCopy}><strong>{itemTitle(item, mode)}</strong><span>{clean(item?.time) || "Time TBD"} · {itemLocation(item, mode)}</span></div><span className={`${styles.queueStatus} ${confirmed ? styles.confirmed : styles.open}`}>{confirmed ? "SET" : "RSVP"}</span></div>;
}

function PlayerEventRow({ item, confirmed, onOpen }) {
  const stamp = formatEventDayStamp(rowDate(item));
  return <button type="button" className={styles.eventRow} onClick={onOpen} data-response-state={confirmed ? "going" : "needed"}><div className={styles.eventRowDate}><strong>{stamp.day}</strong><span>{stamp.weekday}</span></div><div className={styles.eventRowCopy}><div className={styles.eventRowTitleLine}><strong>{itemTitle(item)}</strong><EventTypeBadge type={item?.type} /></div><EventTimeLocation time={item?.time} location={itemLocation(item)} compact /><span className={styles.eventRowStatus}>{confirmed ? "✓ GOING" : "RSVP NEEDED →"}</span></div></button>;
}

function PlayerEventDetail({ event, confirmed, onToggle }) {
  if (!event) return <div className={styles.eventsEmptyRow}>No upcoming event is selected.</div>;
  const date = new Date(`${rowDate(event)}T12:00:00`);
  const when = Number.isNaN(date.getTime()) ? "Date TBD" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const notes = clean(event?.notes || event?.description || event?.details);
  return <article className={styles.playerEventDetail} data-testid="player-event-detail"><div className={styles.playerEventDetail__heading}><div><span>EVENT</span><h2>{itemTitle(event)}</h2></div><EventTypeBadge type={event?.type} /></div><dl><div><dt>WHEN</dt><dd>{when}<br />{clean(event?.time) || "Time TBD"}</dd></div><div><dt>WHERE</dt><dd>{itemLocation(event)}</dd></div></dl><div className={styles.playerEventDetail__response}><div><span>MY RESPONSE</span><strong>{confirmed ? "✓ GOING" : "NO RESPONSE"}</strong></div><button type="button" onClick={onToggle}>{confirmed ? "Remove RSVP" : "Confirm going"}</button></div>{notes ? <div className={styles.playerEventDetail__notes}><span>DETAILS</span><p>{notes}</p></div> : null}</article>;
}

function PlayerEventsExperience({ state, today, detailsOpen, setDetailsOpen, detailsRef, selectedDate, setSelectedDate, selectedId, setSelectedId, toggleRsvp, onCompletionCue }) {
  const focus = state.upcoming[0] || null;
  const focusConfirmed = Boolean(focus && state.responseIds.has(clean(focus?.id)));
  const stamp = formatEventDayStamp(rowDate(focus));
  const activeDate = selectedDate || rowDate(focus) || today;
  const selected = state.upcoming.find((item) => clean(item?.id) === selectedId) || state.upcoming.find((item) => rowDate(item) === activeDate) || focus;
  const selectedConfirmed = Boolean(selected && state.responseIds.has(clean(selected?.id)));
  const runwayItems = state.upcoming.slice(0, RUNWAY_SLOTS);
  const openEvent = (item = focus) => {
    if (item) { setSelectedId(clean(item?.id)); setSelectedDate(rowDate(item)); }
    setDetailsOpen(true);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
  };
  const selectDate = (date) => {
    setSelectedDate(date);
    const match = state.upcoming.find((item) => rowDate(item) === date);
    if (match) setSelectedId(clean(match?.id));
  };
  const toggleSelected = () => {
    if (!selected?.id || typeof toggleRsvp !== "function") return;
    toggleRsvp(selected.id);
    if (!selectedConfirmed) onCompletionCue?.({ title: "Event participation confirmed", detail: `You're in for ${itemTitle(selected)}`, momentum: "Attendance momentum building", next: "Show up ready" });
  };

  return <section className={`${styles.root} ${styles.eventsRoot}`} data-testid="player-commitment-center-events" data-mode="events" data-page-hierarchy="schedule-editorial">
    <EventsTitleStage role="player" month={formatMonthLabel(rowDate(focus) || activeDate)} />
    <NextEventSurface testId="player-events-next-up" stamp={focus ? `${stamp.weekday} ${stamp.day}` : ""} title={focus ? itemTitle(focus) : ""} type={focus?.type} time={focus?.time} location={itemLocation(focus || {})} status={focusConfirmed ? "✓ GOING" : "RSVP REQUIRED"} detail={focusConfirmed ? "Your attendance response is set." : "Your response is still open."} action={focusConfirmed ? "View response" : "Respond"} onAction={() => openEvent(focus)} calm={focusConfirmed} emptyTitle="You’re clear for now." emptyCopy="No upcoming team event is scheduled. Your next commitment will appear here when it is published." />
    <EventsWeekRail rows={state.upcoming} anchorDate={rowDate(focus) || activeDate} selectedDate={activeDate} onSelectDate={selectDate} />
    <section className={styles.eventSchedule} data-testid="player-events-upcoming-list"><EventsSectionHeader eyebrow="MY SCHEDULE" title="Upcoming" meta={`${state.upcoming.length} event${state.upcoming.length === 1 ? "" : "s"}`} /><div className={styles.eventRows}>{runwayItems.length ? runwayItems.map((item) => <PlayerEventRow key={clean(item?.id) || `${rowDate(item)}-${itemTitle(item)}`} item={item} confirmed={state.responseIds.has(clean(item?.id))} onOpen={() => openEvent(item)} />) : <div className={styles.eventsEmptyRow}>No upcoming events. You’re clear for now.</div>}</div></section>
    <EventsMonthPanel rows={state.upcoming} anchorDate={rowDate(focus) || activeDate} selectedDate={activeDate} onSelectDate={selectDate} />
    <details ref={detailsRef} className={`${styles.details} ${styles.eventDetails}`} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} data-testid="player-commitment-details-events"><summary><div><span>EVENT DETAILS</span><strong>{selected ? itemTitle(selected) : "Schedule & RSVP"}</strong><small>When, where, and your response.</small></div><i aria-hidden="true">+</i></summary><div className={styles.detailBody}><PlayerEventDetail event={selected} confirmed={selectedConfirmed} onToggle={toggleSelected} /></div></details>
  </section>;
}

export default function PlayerCommitmentCenter({
  mode = "events",
  model,
  items = [],
  responses = [],
  logs = [],
  user,
  today = new Date().toISOString().slice(0, 10),
  onAction,
  toggleRsvp,
  onCompletionCue,
  children,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const detailsRef = useRef(null);
  const isStrength = mode === "strength";
  const teamId = clean(user?.teamId || user?.team_id);
  const userEmail = clean(user?.email);

  const state = useMemo(() => {
    const upcoming = safeArray(items).filter((item) => teamMatches(item, teamId) && rowDate(item) >= today).sort((a, b) => rowDate(a).localeCompare(rowDate(b)) || clean(a?.time).localeCompare(clean(b?.time)));
    const mine = safeArray(responses).filter((row) => identityMatches(row, userEmail) && teamMatches(row, teamId));
    const responseIds = new Set(mine.map((row) => responseItemId(row, mode)).filter(Boolean));
    const unresolved = upcoming.filter((item) => !responseIds.has(clean(item?.id)));
    const confirmed = upcoming.filter((item) => responseIds.has(clean(item?.id)));
    const myLogs = safeArray(logs).filter((row) => identityMatches(row, userEmail) && teamMatches(row, teamId));
    return { upcoming, unresolved, confirmed, myLogs, focus: upcoming[0] || null, responseIds };
  }, [items, responses, logs, teamId, userEmail, today, mode]);

  if (!isStrength) return <PlayerEventsExperience state={state} today={today} detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen} detailsRef={detailsRef} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedId={selectedId} setSelectedId={setSelectedId} toggleRsvp={toggleRsvp} onCompletionCue={onCompletionCue} />;

  const requiresResponse = state.unresolved.length > 0;
  const focusDate = formatDateParts(rowDate(state.focus));
  const hasAction = Boolean(model?.primaryAction);
  const statusLabel = !state.focus ? "Schedule clear" : requiresResponse ? "Response needed" : "Commitment set";
  const routeStatus = requiresResponse ? `${state.unresolved.length} response${state.unresolved.length === 1 ? "" : "s"} needed` : statusLabel;
  const routeSubtitle = requiresResponse ? `${state.unresolved.length} upcoming commitment${state.unresolved.length === 1 ? "" : "s"} ${state.unresolved.length === 1 ? "needs" : "need"} your response.` : model?.subtitle || "Keep every physical-development commitment clear.";
  const eyebrow = requiresResponse ? "SESSION RESPONSE NEEDED" : "NEXT DEVELOPMENT BLOCK";
  const runwayItems = state.upcoming.slice(0, 3);
  const runwayPlaceholders = Math.max(0, 3 - runwayItems.length);
  const revealDetails = () => {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      if (hasAction) window.setTimeout(() => onAction?.(model.primaryAction), 140);
    });
  };

  return <section className={styles.root} data-testid={`player-commitment-center-${mode}`} data-mode={mode}>
    <header className={styles.routeHeader} data-testid={`player-commitment-route-header-${mode}`}><div className={styles.routeEyebrow}>{model?.eyebrow || "Physical development"}</div><div className={styles.routeTitleRow}><h1>{model?.title || "Strength & Conditioning"}</h1><span>{routeStatus}</span></div><p>{routeSubtitle}</p></header>
    <div className={styles.hero} data-testid="player-commitment-hero-strength"><div className={styles.heroTopline}><span className={styles.eyebrow}>{eyebrow}</span><span className={`${styles.status} ${requiresResponse ? styles.statusOpen : styles.statusSet}`}><i aria-hidden="true" /> {statusLabel}</span></div>{state.focus ? <div className={styles.heroBody}><div className={styles.dateTile} aria-label={`${focusDate.month} ${focusDate.day}`}><span>{focusDate.month}</span><strong>{focusDate.day}</strong><small>{focusDate.weekday}</small></div><div className={styles.heroCopy}><div className={styles.iconTitle}><span className={styles.icon}><CommitmentIcon mode={mode} /></span><div><h2>{itemTitle(state.focus, mode)}</h2><p>{clean(state.focus?.time) || "Time TBD"} · {itemLocation(state.focus, mode)}</p></div></div><button type="button" className={styles.primaryAction} onClick={revealDetails}>{requiresResponse ? "Respond now" : "Open session"} <span aria-hidden="true">→</span></button></div></div> : <div className={styles.emptyHero}><span className={styles.icon}><CommitmentIcon mode={mode} /></span><div><h2>No strength session scheduled</h2><p>Your next physical-development block will appear here when it is published.</p></div><button type="button" className={styles.secondaryAction} onClick={revealDetails}>Open S&C workspace →</button></div>}<div className={styles.signalStrip} aria-label="Strength commitment signals"><span><strong>{state.upcoming.length}</strong><small>Upcoming</small></span><span><strong>{state.unresolved.length}</strong><small>Need response</small></span><span><strong>{state.myLogs.length}</strong><small>Work logged</small></span></div></div>
    <div className={styles.queue} data-testid="player-commitment-queue-strength" data-runway-slots="3"><div className={styles.queueHeading}><div><span>COMING UP</span><strong>Development runway</strong></div><small>{Math.min(3, state.upcoming.length)} of {state.upcoming.length}</small></div><div className={styles.queueList}>{runwayItems.map((item) => <QueueRow key={clean(item?.id) || `${rowDate(item)}-${itemTitle(item, mode)}`} item={item} mode={mode} confirmed={state.confirmed.some((confirmedItem) => clean(confirmedItem?.id) === clean(item?.id))} />)}{Array.from({ length: runwayPlaceholders }, (_, index) => <div className={`${styles.queueRow} ${styles.queuePlaceholder}`} data-empty-slot="true" key={`empty-runway-${index}`}><div className={styles.queueDate}><strong>—</strong><span>OPEN</span></div><div className={styles.queueCopy}><strong>Development slot open</strong><span>No additional commitment is scheduled in this slot.</span></div><span className={`${styles.queueStatus} ${styles.confirmed}`}>CLEAR</span></div>)}</div></div>
    <details ref={detailsRef} className={styles.details} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} data-testid="player-commitment-details-strength"><summary><div><span>FULL WORKSPACE</span><strong>Session details & training log</strong><small>Open full S&C schedule, RSVP controls, and logging.</small></div><i aria-hidden="true">+</i></summary><div className={styles.detailBody}>{children}</div></details>
  </section>;
}