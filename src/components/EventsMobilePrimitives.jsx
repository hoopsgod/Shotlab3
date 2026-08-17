import "./EventsMobileSystem.css";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TYPE_LABEL = {
  run: "Practice", practice: "Practice", game: "Game", games: "Game", scrimmage: "Game",
  workout: "Workout", training: "Workout", lift: "Workout", strength: "Workout",
  shooting: "Shooting", shoot: "Shooting", clinic: "Camp", camp: "Camp",
  recovery: "Meeting", meeting: "Meeting", film: "Meeting", challenge: "Challenge",
};

export const cleanEventValue = (value) => String(value ?? "").trim();
export const getEventDateKey = (row = {}) => cleanEventValue(row?.date || row?.session_date || row?.created_at).slice(0, 10);
export const eventTypeLabel = (value) => TYPE_LABEL[cleanEventValue(value).toLowerCase()] || "Team Event";

const toDate = (value) => {
  if (value instanceof Date) return value;
  const date = value ? new Date(`${value}T12:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const keyOf = (date) => date instanceof Date && !Number.isNaN(date.getTime())
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };

export const formatMonthLabel = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Schedule";
};
export const formatEventDayStamp = (value) => {
  const date = toDate(value);
  return date ? { weekday: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(), day: String(date.getDate()) } : { weekday: "TBD", day: "—" };
};

export function EventsTitleStage({ month, onCreate, role = "player" }) {
  return <header className="eventsTitleStage" data-testid={`${role}-events-title-stage`} data-role={role}>
    <div className="eventsTitleStage__eyebrow">SCHEDULE</div>
    <div className="eventsTitleStage__main"><h1>Events</h1>{onCreate ? <button type="button" className="eventsTitleStage__action" onClick={onCreate}>+ New</button> : null}</div>
    <div className="eventsTitleStage__month">{month || "Schedule"}</div>
  </header>;
}
export function EventTypeBadge({ type }) { return <span className="eventsTypeBadge">{eventTypeLabel(type)}</span>; }
export function EventTimeLocation({ time, location, compact = false }) {
  return <div className={`eventsTimeLocation${compact ? " eventsTimeLocation--compact" : ""}`}><span>{cleanEventValue(time) || "Time TBD"}</span><span>{cleanEventValue(location) || "Location TBD"}</span></div>;
}

export function NextEventSurface({ testId, stamp, title, type, time, location, status, detail, action, onAction, calm = false, emptyTitle, emptyCopy, emptyAction }) {
  const hasEvent = Boolean(title);
  return <section className="eventsNext" data-testid={testId} data-state={calm ? "calm" : "action"}>
    <div className="eventsNext__top"><span>NEXT UP{stamp ? ` · ${stamp}` : ""}</span>{hasEvent ? <EventTypeBadge type={type} /> : null}</div>
    {hasEvent ? <>
      <h2>{title}</h2><EventTimeLocation time={time} location={location} />
      <div className="eventsNext__action"><div><strong>{status}</strong><small>{detail}</small></div><button type="button" onClick={onAction}>{action} <span aria-hidden="true">→</span></button></div>
    </> : <div className="eventsNext__empty"><h2>{emptyTitle}</h2><p>{emptyCopy}</p>{emptyAction ? <button type="button" onClick={onAction}>{emptyAction} →</button> : null}</div>}
  </section>;
}

export function EventsWeekRail({ rows = [], anchorDate, selectedDate, onSelectDate, label = "THIS WEEK" }) {
  const anchor = toDate(anchorDate) || new Date();
  const monday = new Date(anchor);
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  const today = keyOf(new Date());
  const eventDates = new Set(rows.map(getEventDateKey).filter(Boolean));
  return <section className="eventsWeekRail" data-testid="events-week-rail"><div className="eventsSectionKicker">{label}</div><div className="eventsWeekRail__days" role="group" aria-label="Select schedule date">
    {DAYS.map((weekday, index) => {
      const date = addDays(monday, index), key = keyOf(date), hasEvent = eventDates.has(key), selected = key === selectedDate;
      return <button key={key} type="button" className="eventsWeekRail__day" data-selected={selected} data-today={key === today} data-has-event={hasEvent} onClick={() => onSelectDate?.(key)} aria-pressed={selected}><span>{weekday}</span><strong>{date.getDate()}</strong><i aria-hidden="true" /></button>;
    })}
  </div></section>;
}

export function EventsMonthPanel({ rows = [], anchorDate, selectedDate, onSelectDate }) {
  const anchor = toDate(anchorDate) || new Date(), month = new Date(anchor.getFullYear(), anchor.getMonth(), 1), gridStart = new Date(month), today = keyOf(new Date()), eventDates = new Set(rows.map(getEventDateKey).filter(Boolean));
  gridStart.setDate(1 - ((month.getDay() + 6) % 7));
  return <details className="eventsMonthPanel" data-testid="events-month-panel"><summary><div><span>MONTH</span><strong>{formatMonthLabel(month)}</strong></div><span className="eventsMonthPanel__control">View month <b aria-hidden="true">+</b></span></summary><div className="eventsMonthPanel__body"><div className="eventsMonthPanel__weekdays" aria-hidden="true">{DAYS.map((label) => <span key={label}>{label[0]}</span>)}</div><div className="eventsMonthPanel__grid">
    {Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index), key = keyOf(date), hasEvent = eventDates.has(key), selected = key === selectedDate;
      return <button key={key} type="button" className="eventsMonthPanel__day" data-selected={selected} data-today={key === today} data-has-event={hasEvent} onClick={() => onSelectDate?.(key)} disabled={date.getMonth() !== month.getMonth()} aria-pressed={selected}><span>{date.getDate()}</span><i aria-hidden="true" /></button>;
    })}
  </div></div></details>;
}
export function EventsSectionHeader({ eyebrow, title, meta }) { return <div className="eventsSectionHeader"><div>{eyebrow ? <span>{eyebrow}</span> : null}<strong>{title}</strong></div><small>{meta}</small></div>; }
