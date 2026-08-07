import { useMemo, useRef, useState } from "react";
import styles from "./PlayerCommitmentCenter.module.css";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const normalize = (value) => clean(value).toLowerCase();

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
    return { upcoming, unresolved, confirmed, myLogs, next: upcoming[0] || null };
  }, [items, responses, logs, teamId, userEmail, today, mode]);

  const nextDate = formatDateParts(rowDate(state.next));
  const nextConfirmed = Boolean(state.next && state.confirmed.some((item) => clean(item?.id) === clean(state.next?.id)));
  const hasAction = Boolean(model?.primaryAction);
  const statusLabel = !state.next ? "Schedule clear" : nextConfirmed ? "Commitment set" : "Response needed";
  const eyebrow = isStrength ? "NEXT DEVELOPMENT BLOCK" : "NEXT TEAM COMMITMENT";
  const emptyTitle = isStrength ? "No strength session scheduled" : "No upcoming team event";
  const detailTitle = isStrength ? "Session details & training log" : "Schedule & attendance details";
  const detailSummary = isStrength ? "Open full S&C schedule, RSVP controls, and logging." : "Open the full team schedule and RSVP controls.";
  const actionLabel = state.next && !nextConfirmed
    ? "Respond now"
    : isStrength && state.next
      ? "Open session"
      : state.next
        ? "View schedule"
        : isStrength
          ? "Open S&C workspace"
          : "Open schedule";

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
      <div className={styles.hero} data-testid={`player-commitment-hero-${mode}`}>
        <div className={styles.heroTopline}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={`${styles.status} ${state.next && !nextConfirmed ? styles.statusOpen : styles.statusSet}`}>
            <i aria-hidden="true" /> {statusLabel}
          </span>
        </div>

        {state.next ? (
          <div className={styles.heroBody}>
            <div className={styles.dateTile} aria-label={`${nextDate.month} ${nextDate.day}`}>
              <span>{nextDate.month}</span>
              <strong>{nextDate.day}</strong>
              <small>{nextDate.weekday}</small>
            </div>
            <div className={styles.heroCopy}>
              <div className={styles.iconTitle}>
                <span className={styles.icon}><CommitmentIcon mode={mode} /></span>
                <div>
                  <h2>{itemTitle(state.next, mode)}</h2>
                  <p>{clean(state.next?.time) || "Time TBD"} · {itemLocation(state.next, mode)}</p>
                </div>
              </div>
              <button type="button" className={styles.primaryAction} onClick={revealDetails}>
                {actionLabel} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyHero}>
            <span className={styles.icon}><CommitmentIcon mode={mode} /></span>
            <div>
              <h2>{emptyTitle}</h2>
              <p>{isStrength ? "Your next physical-development block will appear here when it is published." : "Your next program event will appear here when your coach adds it."}</p>
            </div>
            <button type="button" className={styles.secondaryAction} onClick={revealDetails}>{actionLabel} →</button>
          </div>
        )}

        <div className={styles.signalStrip} aria-label={`${isStrength ? "Strength" : "Event"} commitment signals`}>
          <span><strong>{state.upcoming.length}</strong><small>Upcoming</small></span>
          <span><strong>{state.unresolved.length}</strong><small>Need response</small></span>
          <span><strong>{isStrength ? state.myLogs.length : state.confirmed.length}</strong><small>{isStrength ? "Work logged" : "Confirmed"}</small></span>
        </div>
      </div>

      {state.upcoming.length > 0 && (
        <div className={styles.queue} data-testid={`player-commitment-queue-${mode}`}>
          <div className={styles.queueHeading}>
            <div><span>COMING UP</span><strong>{isStrength ? "Development runway" : "Team runway"}</strong></div>
            <small>{Math.min(3, state.upcoming.length)} of {state.upcoming.length}</small>
          </div>
          <div className={styles.queueList}>
            {state.upcoming.slice(0, 3).map((item) => (
              <QueueRow
                key={clean(item?.id) || `${rowDate(item)}-${itemTitle(item, mode)}`}
                item={item}
                mode={mode}
                confirmed={state.confirmed.some((confirmedItem) => clean(confirmedItem?.id) === clean(item?.id))}
              />
            ))}
          </div>
        </div>
      )}

      <details
        ref={detailsRef}
        className={styles.details}
        open={detailsOpen}
        onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        data-testid={`player-commitment-details-${mode}`}
      >
        <summary>
          <div><span>FULL WORKSPACE</span><strong>{detailTitle}</strong><small>{detailSummary}</small></div>
          <i aria-hidden="true">+</i>
        </summary>
        <div className={styles.detailBody}>{children}</div>
      </details>
    </section>
  );
}
