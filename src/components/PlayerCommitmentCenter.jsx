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
  if (mode === "strength") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 7h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M17.5 7h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3v3H8z" />
    </svg>
  );
}

function QueueRow({ item, mode, confirmed }) {
  const parts = formatDateParts(rowDate(item));
  return (
    <div className={styles.queueRow}>
      <div className={styles.queueDate}>
        <strong>{parts.day}</strong>
        <span>{parts.month}</span>
      </div>
      <div className={styles.queueCopy}>
        <strong>{itemTitle(item, mode)}</strong>
        <span>{clean(item?.time) || "Time TBD"} · {itemLocation(item, mode)}</span>
      </div>
      <span className={`${styles.queueStatus} ${confirmed ? styles.confirmed : styles.open}`}>
        {confirmed ? "SET" : "RSVP"}
      </span>
    </div>
  );
}

function PlayerEventRow({ item, confirmed, onOpen }) {
  const stamp = formatEventDayStamp(rowDate(item));
  return (
    <button type="button" className={styles.eventRow} onClick={onOpen} data-response-state={confirmed ? "going" : "needed"}>
      <div className={styles.eventRowDate}>
        <strong>{stamp.day}</strong>
        <span>{stamp.weekday}</span>
      </div>
      <div className={styles.eventRowCopy}>
        <div className={styles.eventRowTitleLine}>
          <strong>{itemTitle(item)}</strong>
          <EventTypeBadge type={item?.type} />
        </div>
        <EventTimeLocation time={item?.time} location={itemLocation(item)} compact />
        <span className={styles.eventRowStatus}>{confirmed ? "✓ GOING" : "RSVP NEEDED →"}</span>
      </div>
    </button>
  );
}

function PlayerEventsExperience({ state, model, today, detailsOpen, setDetailsOpen, detailsRef, onAction, children, selectedDate, setSelectedDate }) {
  const focus = state.upcoming[0] || null;
  const confirmed = Boolean(focus && state.responseIds.has(clean(focus?.id)));
  const stamp = formatEventDayStamp(rowDate(focus));
  const runwayItems = state.upcoming.slice(0, RUNWAY_SLOTS);
  const revealDetails = (runAction = false) => {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      if (runAction && model?.primaryAction) window.setTimeout(() => onAction?.(model.primaryAction), 140);
    });
  };
  const activeDate = selectedDate || rowDate(focus) || today;

  return (
    <section className={`${styles.root} ${styles.eventsRoot}`} data-testid="player-commitment-center-events" data-mode="events">
      <EventsTitleStage role="player" month={formatMonthLabel(rowDate(focus) || activeDate)} />
      <NextEventSurface
        testId="player-events-next-up"
        stamp={focus ? `${stamp.weekday} ${stamp.day}` : ""}
        title={focus ? itemTitle(focus) : ""}
        type={focus?.type}
        time={focus?.time}
        location={itemLocation(focus || {})}
        status={confirmed ? "✓ GOING" : "RSVP REQUIRED"}
        detail={confirmed ? "Your attendance response is set." : "Your response is still open."}
        action={confirmed ? "Change response" : "Respond"}
        onAction={() => revealDetails(!confirmed)}
        calm={confirmed}
        emptyTitle="You’re clear for now."
        emptyCopy="No upcoming team event is scheduled. Your next commitment will appear here when it is published."
      />
      <EventsWeekRail rows={state.upcoming} anchorDate={rowDate(focus) || activeDate} selectedDate={activeDate} onSelectDate={setSelectedDate} />
      <section className={styles.eventSchedule} data-testid="player-events-upcoming-list">
        <EventsSectionHeader eyebrow="MY SCHEDULE" title="Upcoming" meta={`${state.upcoming.length} event${state.upcoming.length === 1 ? "" : "s"}`} />
        <div className={styles.eventRows}>
          {runwayItems.length ? runwayItems.map((item) => (
            <PlayerEventRow
              key={clean(item?.id) || `${rowDate(item)}-${itemTitle(item)}`}
              item={item}
              confirmed={state.responseIds.has(clean(item?.id))}
              onOpen={() => { setSelectedDate(rowDate(item)); revealDetails(); }}
            />
          )) : <div className={styles.eventsEmptyRow}>No upcoming events. You’re clear for now.</div>}
        </div>
      </section>
      <EventsMonthPanel rows={state.upcoming} anchorDate={rowDate(focus) || activeDate} selectedDate={activeDate} onSelectDate={setSelectedDate} />
      <details ref={detailsRef} className={`${styles.details} ${styles.eventDetails}`} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} data-testid="player-commitment-details-events">
        <summary><div><span>EVENT DETAILS</span><strong>Schedule & RSVP</strong><small>Open notes, attendance response, and past events.</small></div><i aria-hidden="true">+</i></summary>
        <div className={styles.detailBody}>{children}</div>
      </details>
    </section>
  );
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
  children,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const detailsRef = useRef(null);
  const isStrength = mode === "strength";
  const teamId = clean(user?.teamId || user?.team_id);
  const userEmail = clean(user?.email);

  const state = useMemo(() => {
    const upcoming = safeArray(items)
      .filter((item) => teamMatches(item, teamId) && rowDate(item) >= today)
      .sort((a, b) => rowDate(a).localeCompare(rowDate(b)) || clean(a?.time).localeCompare(clean(b?.time)));
    const mine = safeArray(responses).filter((row) => identityMatches(row, userEmail) && teamMatches(row, teamId));
    const responseIds = new Set(mine.map((row) => responseItemId(row, mode)).filter(Boolean));
    const unresolved = upcoming.filter((item) => !responseIds.has(clean(item?.id)));
    const confirmed = upcoming.filter((item) => responseIds.has(clean(item?.id)));
    const myLogs = safeArray(logs).filter((row) => identityMatches(row, userEmail) && teamMatches(row, teamId));
    const focus = upcoming[0] || null;
    return { upcoming, unresolved, confirmed, myLogs, focus, responseIds };
  }, [items, responses, logs, teamId, userEmail, today, mode]);

  if (!isStrength) {
    return (
      <PlayerEventsExperience
        state={state}
        model={model}
        today={today}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        detailsRef={detailsRef}
        onAction={onAction}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      >
        {children}
      </PlayerEventsExperience>
    );
  }

  const requiresResponse = state.unresolved.length > 0;
  const focusDate = formatDateParts(rowDate(state.focus));
  const hasAction = Boolean(model?.primaryAction);
  const statusLabel = !state.focus ? "Schedule clear" : requiresResponse ? "Response needed" : "Commitment set";
  const routeStatus = requiresResponse
    ? `${state.unresolved.length} response${state.unresolved.length === 1 ? "" : "s"} needed`
    : statusLabel;
  const routeSubtitle = requiresResponse
    ? `${state.unresolved.length} upcoming commitment${state.unresolved.length === 1 ? "" : "s"} ${state.unresolved.length === 1 ? "needs" : "need"} your response.`
    : model?.subtitle || "Keep every physical-development commitment clear.";
  const eyebrow = requiresResponse ? "SESSION RESPONSE NEEDED" : "NEXT DEVELOPMENT BLOCK";
  const emptyTitle = "No strength session scheduled";
  const runwayItems = state.upcoming.slice(0, 3);
  const runwayPlaceholders = Math.max(0, 3 - runwayItems.length);

  const revealDetails = () => {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      if (hasAction) window.setTimeout(() => onAction?.(model.primaryAction), 140);
    });
  };

  return (
    <section
      className={styles.root}
      data-testid={`player-commitment-center-${mode}`}
      data-mode={mode}
    >
      <header className={styles.routeHeader} data-testid={`player-commitment-route-header-${mode}`}>
        <div className={styles.routeEyebrow}>{model?.eyebrow || "Physical development"}</div>
        <div className={styles.routeTitleRow}>
          <h1>{model?.title || "Strength & Conditioning"}</h1>
          <span>{routeStatus}</span>
        </div>
        <p>{routeSubtitle}</p>
      </header>

      <div className={styles.hero} data-testid="player-commitment-hero-strength">
        <div className={styles.heroTopline}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={`${styles.status} ${requiresResponse ? styles.statusOpen : styles.statusSet}`}><i aria-hidden="true" /> {statusLabel}</span>
        </div>
        {state.focus ? (
          <div className={styles.heroBody}>
            <div className={styles.dateTile} aria-label={`${focusDate.month} ${focusDate.day}`}><span>{focusDate.month}</span><strong>{focusDate.day}</strong><small>{focusDate.weekday}</small></div>
            <div className={styles.heroCopy}>
              <div className={styles.iconTitle}><span className={styles.icon}><CommitmentIcon mode={mode} /></span><div><h2>{itemTitle(state.focus, mode)}</h2><p>{clean(state.focus?.time) || "Time TBD"} · {itemLocation(state.focus, mode)}</p></div></div>
              <button type="button" className={styles.primaryAction} onClick={revealDetails}>{requiresResponse ? "Respond now" : "Open session"} <span aria-hidden="true">→</span></button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyHero}><span className={styles.icon}><CommitmentIcon mode={mode} /></span><div><h2>{emptyTitle}</h2><p>Your next physical-development block will appear here when it is published.</p></div><button type="button" className={styles.secondaryAction} onClick={revealDetails}>Open S&C workspace →</button></div>
        )}
        <div className={styles.signalStrip} aria-label="Strength commitment signals">
          <span><strong>{state.upcoming.length}</strong><small>Upcoming</small></span>
          <span><strong>{state.unresolved.length}</strong><small>Need response</small></span>
          <span><strong>{state.myLogs.length}</strong><small>Work logged</small></span>
        </div>
      </div>

      <div className={styles.queue} data-testid="player-commitment-queue-strength" data-runway-slots="3">
        <div className={styles.queueHeading}><div><span>COMING UP</span><strong>Development runway</strong></div><small>{Math.min(3, state.upcoming.length)} of {state.upcoming.length}</small></div>
        <div className={styles.queueList}>
          {runwayItems.map((item) => <QueueRow key={clean(item?.id) || `${rowDate(item)}-${itemTitle(item, mode)}`} item={item} mode={mode} confirmed={state.confirmed.some((confirmedItem) => clean(confirmedItem?.id) === clean(item?.id))} />)}
          {Array.from({ length: runwayPlaceholders }, (_, index) => (
            <div className={`${styles.queueRow} ${styles.queuePlaceholder}`} data-empty-slot="true" key={`empty-runway-${index}`}>
              <div className={styles.queueDate}><strong>—</strong><span>OPEN</span></div>
              <div className={styles.queueCopy}><strong>Development slot open</strong><span>No additional commitment is scheduled in this slot.</span></div>
              <span className={`${styles.queueStatus} ${styles.confirmed}`}>CLEAR</span>
            </div>
          ))}
        </div>
      </div>

      <details ref={detailsRef} className={styles.details} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} data-testid="player-commitment-details-strength">
        <summary><div><span>FULL WORKSPACE</span><strong>Session details & training log</strong><small>Open full S&C schedule, RSVP controls, and logging.</small></div><i aria-hidden="true">+</i></summary>
        <div className={styles.detailBody}>{children}</div>
      </details>
    </section>
  );
}
