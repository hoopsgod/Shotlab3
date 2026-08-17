import "./EventsMobileSystem.css";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TYPE_LABEL = { run: "Practice", game: "Game", clinic: "Camp", recovery: "Meeting" };
const clean = (value) => String(value ?? "").trim();

export const getEventDateKey = (row = {}) => clean(row?.date || row?.session_date || row?.created_at).slice(0, 10);
export const eventTypeLabel = (value) => {
  const type = clean(value).toLowerCase();
  return TYPE_LABEL[type] || (type ? type[0].toUpperCase() + type.slice(1) : "Team Event");
};

const toDate = (value) => {
  if (value instanceof Date) return value;
  const date = value ? new Date(`${value}T12:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const keyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const formatMonthLabel = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Schedule";
};
export const formatEventDayStamp = (value) => {
  const date = toDate(value);
  return date
    ? { weekday: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(), day: String(date.getDate()) }
    : { weekday: "TBD", day: "—" };
};

export function EventsTitleStage({ month, onCreate, role = "player" }) {
  return (
    <header className="eventsTitleStage" data-testid={`${role}-events-title-stage`}>
      <div className="eventsTitleStage__eyebrow">SCHEDULE</div>
      <div className="eventsTitleStage__main">
        <h1>Events</h1>
        {onCreate ? <button type="button" className="eventsTitleStage__action" onClick={onCreate}>+ New</button> : null}
      </div>
      <div className="eventsTitleStage__month">{month || "Schedule"}</div>
    </header>
  );
}

export function EventTypeBadge({ type }) {
  return <span className="eventsTypeBadge">{eventTypeLabel(type)}</span>;
}

export function EventTimeLocation({ time, location, compact = false }) {
  return (
    <div className={`eventsTimeLocation${compact ? " eventsTimeLocation--compact" : ""}`}>
      <span>{clean(time) || "Time TBD"}</span>
      <span>{clean(location) || "Location TBD"}</span>
    </div>
  );
}

function normalizeStamp(stamp) {
  if (!stamp) return null;
  if (typeof stamp === "object") {
    const weekday = clean(stamp.weekday);
    const day = clean(stamp.day);
    return weekday || day ? { weekday: weekday || "TBD", day: day || "—" } : null;
  }
  const [weekday, ...rest] = clean(stamp).split(/\s+/);
  return weekday ? { weekday, day: rest.join(" ") || "—" } : null;
}

export function NextEventSurface({ testId, stamp, title, type, time, location, status, detail, action, onAction, calm = false, emptyTitle, emptyCopy, emptyAction }) {
  const hasEvent = Boolean(title);
  const dayStamp = normalizeStamp(stamp);

  return (
    <section className="eventsNext" data-testid={testId} data-surface="dark" data-state={calm ? "calm" : "action"}>
      <div className="eventsNext__top">
        <span>NEXT UP</span>
        {hasEvent ? <EventTypeBadge type={type} /> : null}
      </div>
      {hasEvent ? (
        <>
          <div className="eventsNext__identity">
            {dayStamp ? (
              <div className="eventsNext__date" aria-label={`${dayStamp.weekday} ${dayStamp.day}`}>
                <span>{dayStamp.weekday}</span>
                <strong>{dayStamp.day}</strong>
              </div>
            ) : null}
            <div className="eventsNext__copy">
              <h2>{title}</h2>
              <EventTimeLocation time={time} location={location} />
            </div>
          </div>
          <div className="eventsNext__action">
            <div>
              <strong>{status}</strong>
              <small>{detail}</small>
            </div>
            <button type="button" className="eventsNext__primaryAction" onClick={onAction}>
              {action} <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      ) : (
        <div className="eventsNext__empty">
          <h2>{emptyTitle}</h2>
          <p>{emptyCopy}</p>
          {emptyAction ? <button type="button" className="eventsNext__primaryAction" onClick={onAction}>{emptyAction} →</button> : null}
        </div>
      )}
    </section>
  );
}

export function EventsWeekRail({ rows = [], anchorDate, selectedDate, onSelectDate }) {
  const anchor = toDate(anchorDate) || new Date();
  const monday = new Date(anchor);
  const eventDates = new Set(rows.map(getEventDateKey).filter(Boolean));
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));

  return (
    <section className="eventsWeekRail" data-testid="events-week-rail">
      <div className="eventsSectionKicker">THIS WEEK</div>
      <div className="eventsWeekRail__days" role="group" aria-label="Select schedule date">
        {DAYS.map((weekday, index) => {
          const date = addDays(monday, index);
          const key = keyOf(date);
          const selected = key === selectedDate;
          return (
            <button key={key} type="button" className="eventsWeekRail__day" data-selected={selected} data-has-event={eventDates.has(key)} onClick={() => onSelectDate?.(key)} aria-pressed={selected}>
              <span>{weekday}</span>
              <strong>{date.getDate()}</strong>
              <i aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function EventsMonthPanel({ rows = [], anchorDate, selectedDate, onSelectDate }) {
  const anchor = toDate(anchorDate) || new Date();
  const month = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(month);
  const eventDates = new Set(rows.map(getEventDateKey).filter(Boolean));
  gridStart.setDate(1 - ((month.getDay() + 6) % 7));

  return (
    <details className="eventsMonthPanel" data-testid="events-month-panel" data-layout-role="quiet-secondary">
      <summary>
        <div><span>MONTH</span><strong>{formatMonthLabel(month)}</strong></div>
        <span className="eventsMonthPanel__control">View month <b aria-hidden="true">+</b></span>
      </summary>
      <div className="eventsMonthPanel__body">
        <div className="eventsMonthPanel__weekdays" aria-hidden="true">{DAYS.map((label) => <span key={label}>{label[0]}</span>)}</div>
        <div className="eventsMonthPanel__grid">
          {Array.from({ length: 42 }, (_, index) => {
            const date = addDays(gridStart, index);
            const key = keyOf(date);
            const selected = key === selectedDate;
            return (
              <button key={key} type="button" className="eventsMonthPanel__day" data-selected={selected} data-has-event={eventDates.has(key)} onClick={() => onSelectDate?.(key)} disabled={date.getMonth() !== month.getMonth()} aria-pressed={selected}>
                <span>{date.getDate()}</span><i aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function EventsSectionHeader({ eyebrow, title, meta }) {
  return <div className="eventsSectionHeader"><div>{eyebrow ? <span>{eyebrow}</span> : null}<strong>{title}</strong></div><small>{meta}</small></div>;
}
