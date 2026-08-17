import "./EventsMobileSystem.css";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const cleanEventValue = (value) => String(value ?? "").trim();
export const getEventDateKey = (row = {}) => cleanEventValue(row?.date || row?.session_date || row?.created_at).slice(0, 10);

export const normalizeEventType = (value) => {
  const key = cleanEventValue(value).toLowerCase();
  if (["run", "practice"].includes(key)) return "practice";
  if (["game", "games", "scrimmage"].includes(key)) return "game";
  if (["workout", "training", "lift", "strength"].includes(key)) return "workout";
  if (["shooting", "shoot"].includes(key)) return "shooting";
  if (["clinic", "camp"].includes(key)) return "camp";
  if (["recovery", "meeting", "film"].includes(key)) return "meeting";
  if (key === "challenge") return "challenge";
  return "event";
};

export const eventTypeLabel = (value) => ({
  practice: "Practice",
  game: "Game",
  workout: "Workout",
  shooting: "Shooting",
  camp: "Camp",
  meeting: "Meeting",
  challenge: "Challenge",
  event: "Team Event",
}[normalizeEventType(value)] || "Team Event");

const localDate = (dateKey) => {
  if (!dateKey) return null;
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addCalendarDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const formatMonthLabel = (value) => {
  const date = value instanceof Date ? value : localDate(value);
  if (!date) return "Schedule";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export const formatEventDayStamp = (value) => {
  const date = value instanceof Date ? value : localDate(value);
  if (!date) return { weekday: "TBD", day: "—", month: "" };
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    day: date.toLocaleDateString(undefined, { day: "2-digit" }),
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function EventsTitleStage({ month, onCreate, createLabel = "+ New", role = "player" }) {
  return (
    <header className="eventsTitleStage" data-testid={`${role}-events-title-stage`} data-role={role}>
      <div className="eventsTitleStage__eyebrow">SCHEDULE</div>
      <div className="eventsTitleStage__main">
        <h1>Events</h1>
        {typeof onCreate === "function" ? (
          <button type="button" className="eventsTitleStage__action" onClick={onCreate} aria-label="Create new event">
            {createLabel}
          </button>
        ) : null}
      </div>
      <div className="eventsTitleStage__month">{month || "Schedule"}</div>
    </header>
  );
}

export function EventTypeBadge({ type }) {
  const tone = normalizeEventType(type);
  return <span className="eventsTypeBadge" data-event-tone={tone}>{eventTypeLabel(type)}</span>;
}

export function EventTimeLocation({ time, location, compact = false }) {
  return (
    <div className={`eventsTimeLocation${compact ? " eventsTimeLocation--compact" : ""}`}>
      <span><ClockIcon />{cleanEventValue(time) || "Time TBD"}</span>
      <span><PinIcon />{cleanEventValue(location) || "Location TBD"}</span>
    </div>
  );
}

export function EventsWeekRail({ rows = [], anchorDate, selectedDate, onSelectDate, label = "THIS WEEK" }) {
  const anchor = localDate(anchorDate) || new Date();
  const monday = new Date(anchor);
  const jsDay = monday.getDay();
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  monday.setDate(monday.getDate() - daysFromMonday);
  const today = dateKey(new Date());
  const eventDates = new Map();

  rows.forEach((row) => {
    const key = getEventDateKey(row);
    if (!key) return;
    const tones = eventDates.get(key) || [];
    tones.push(normalizeEventType(row?.type || row?.event?.type));
    eventDates.set(key, tones);
  });

  return (
    <section className="eventsWeekRail" data-testid="events-week-rail">
      <div className="eventsSectionKicker">{label}</div>
      <div className="eventsWeekRail__days" role="group" aria-label="Select schedule date">
        {DAY_LABELS.map((weekday, index) => {
          const date = addCalendarDays(monday, index);
          const key = dateKey(date);
          const tones = eventDates.get(key) || [];
          const selected = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              className="eventsWeekRail__day"
              data-selected={selected ? "true" : "false"}
              data-today={key === today ? "true" : "false"}
              data-has-event={tones.length ? "true" : "false"}
              onClick={() => onSelectDate?.(key)}
              aria-pressed={selected}
              aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${tones.length ? `, ${tones.length} event${tones.length === 1 ? "" : "s"}` : ""}`}
            >
              <span>{weekday}</span>
              <strong>{date.getDate()}</strong>
              <i data-event-tone={tones[0] || "event"} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function EventsMonthPanel({ rows = [], anchorDate, selectedDate, onSelectDate, defaultOpen = false }) {
  const anchor = localDate(anchorDate) || new Date();
  const month = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(month);
  gridStart.setDate(1 - ((month.getDay() + 6) % 7));
  const today = dateKey(new Date());
  const byDate = new Map();
  rows.forEach((row) => {
    const key = getEventDateKey(row);
    if (!key) return;
    const list = byDate.get(key) || [];
    list.push(row);
    byDate.set(key, list);
  });

  return (
    <details className="eventsMonthPanel" data-testid="events-month-panel" open={defaultOpen || undefined}>
      <summary>
        <div>
          <span>MONTH</span>
          <strong>{formatMonthLabel(month)}</strong>
        </div>
        <span className="eventsMonthPanel__control"><CalendarIcon /> View month <b aria-hidden="true">+</b></span>
      </summary>
      <div className="eventsMonthPanel__body">
        <div className="eventsMonthPanel__weekdays" aria-hidden="true">
          {DAY_LABELS.map((label) => <span key={label}>{label.slice(0, 1)}</span>)}
        </div>
        <div className="eventsMonthPanel__grid">
          {Array.from({ length: 42 }, (_, index) => {
            const date = addCalendarDays(gridStart, index);
            const key = dateKey(date);
            const events = byDate.get(key) || [];
            const inMonth = date.getMonth() === month.getMonth();
            const selected = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                className="eventsMonthPanel__day"
                data-in-month={inMonth ? "true" : "false"}
                data-selected={selected ? "true" : "false"}
                data-today={key === today ? "true" : "false"}
                data-has-event={events.length ? "true" : "false"}
                onClick={() => onSelectDate?.(key)}
                disabled={!inMonth}
                aria-pressed={selected}
                aria-label={`${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : ""}`}
              >
                <span>{date.getDate()}</span>
                <i data-event-tone={normalizeEventType(events[0]?.type || events[0]?.event?.type)} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function EventsSectionHeader({ eyebrow, title, meta, action, onAction }) {
  return (
    <div className="eventsSectionHeader">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <strong>{title}</strong>
      </div>
      {action && typeof onAction === "function" ? <button type="button" onClick={onAction}>{action}</button> : <small>{meta}</small>}
    </div>
  );
}
