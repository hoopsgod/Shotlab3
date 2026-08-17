import { useMemo, useState } from "react";
import "./CoachEventsPremiumV2.css";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseDateKey = (value = "") => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
};

const dateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const eventTone = (type = "") => {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "run" || normalized === "practice") return "practice";
  if (normalized === "game" || normalized === "games") return "game";
  if (normalized === "clinic" || normalized === "camp") return "camp";
  if (normalized === "recovery" || normalized === "meeting" || normalized === "film") return "meeting";
  if (normalized === "challenge") return "challenge";
  return "event";
};

const eventLabel = (type = "") => {
  const tone = eventTone(type);
  if (tone === "practice") return "Practice";
  if (tone === "game") return "Game";
  if (tone === "camp") return "Camp";
  if (tone === "meeting") return "Meeting";
  if (tone === "challenge") return "Challenge";
  return "Event";
};

const sameEventType = (row, activeType) => {
  if (!activeType || activeType === "all") return true;
  return String(row?.type || "").toLowerCase() === String(activeType).toLowerCase();
};

const formatSelectedDate = (key = "") => {
  const date = parseDateKey(key);
  if (!date) return "Select a date";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
};

const monthDistance = (fromDate, toDate) => (
  (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())
);

export default function CoachEventsMonthCalendar({ rows = [], activeType = "all", onOpenEvent, onCreateEvent }) {
  const validRows = useMemo(() => rows.filter((row) => parseDateKey(row?.date)), [rows]);
  const typeRows = useMemo(() => validRows.filter((row) => sameEventType(row, activeType)), [validRows, activeType]);
  const nextRow = useMemo(() => validRows.find((row) => row.statusKey === "upcoming") || validRows[0] || null, [validRows]);
  const anchorDate = parseDateKey(nextRow?.date) || new Date();
  const anchorYear = anchorDate.getFullYear();
  const anchorMonth = anchorDate.getMonth();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  const visibleMonth = useMemo(
    () => new Date(anchorYear, anchorMonth + monthOffset, 1),
    [anchorYear, anchorMonth, monthOffset],
  );
  const visibleMonthKey = monthKey(visibleMonth);
  const currentDate = new Date();
  const todayKey = dateKey(currentDate);
  const currentMonthKey = monthKey(currentDate);

  const rowsByDate = useMemo(() => {
    const map = new Map();
    for (const row of typeRows) {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date).push(row);
    }
    for (const bucket of map.values()) bucket.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
    return map;
  }, [typeRows]);

  const monthRows = useMemo(
    () => typeRows.filter((row) => String(row.date || "").startsWith(visibleMonthKey)),
    [typeRows, visibleMonthKey],
  );

  const firstEventDate = monthRows[0]?.date || "";
  const effectiveSelectedDate = selectedDate.startsWith(visibleMonthKey) ? selectedDate : firstEventDate;
  const selectedRows = rowsByDate.get(effectiveSelectedDate) || [];

  const cells = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = dateKey(date);
      return {
        key,
        date,
        inMonth: date.getMonth() === visibleMonth.getMonth(),
        events: rowsByDate.get(key) || [],
      };
    });
  }, [visibleMonth, rowsByDate]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const isCurrentMonth = visibleMonthKey === currentMonthKey;

  const shiftMonth = (direction) => {
    setMonthOffset((value) => value + direction);
    setSelectedDate("");
  };

  const goToToday = () => {
    setMonthOffset(monthDistance(anchorDate, currentDate));
    setSelectedDate(todayKey);
  };

  return (
    <section className="coachEventsCalendar" data-testid="coach-events-month-calendar" aria-label="Team events month calendar">
      <div className="coachEventsCalendar__masthead">
        <div>
          <span className="coachEventsCalendar__eyebrow">Team calendar</span>
          <h2 data-testid="coach-events-calendar-month">{monthLabel}</h2>
          <p>{monthRows.length} {monthRows.length === 1 ? "event" : "events"} this month</p>
        </div>
        <div className="coachEventsCalendar__nav" aria-label="Calendar month navigation">
          {!isCurrentMonth ? <button type="button" className="coachEventsCalendar__today" onClick={goToToday}>Today</button> : null}
          <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
          <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
        </div>
      </div>

      <div className="coachEventsCalendar__weekdays" aria-hidden="true">
        {DAY_LABELS.map((label) => <span key={label}>{label}</span>)}
      </div>

      <div className="coachEventsCalendar__grid" role="grid" aria-label={monthLabel}>
        {cells.map((cell) => {
          const isSelected = cell.key === effectiveSelectedDate;
          const isToday = cell.key === todayKey;
          const eventCount = cell.events.length;
          const ariaLabel = `${cell.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${eventCount ? `, ${eventCount} ${eventCount === 1 ? "event" : "events"}` : ", no events"}`;
          return (
            <button
              type="button"
              role="gridcell"
              key={cell.key}
              className="coachEventsCalendar__day"
              data-in-month={cell.inMonth ? "true" : "false"}
              data-selected={isSelected ? "true" : "false"}
              data-today={isToday ? "true" : "false"}
              data-has-events={eventCount ? "true" : "false"}
              aria-label={ariaLabel}
              aria-selected={isSelected}
              onClick={() => cell.inMonth && setSelectedDate(cell.key)}
              tabIndex={cell.inMonth ? 0 : -1}
            >
              <span className="coachEventsCalendar__dayNumber">{cell.date.getDate()}</span>
              {eventCount ? (
                <span className="coachEventsCalendar__eventMarks" aria-hidden="true">
                  {cell.events.slice(0, 3).map((row) => <i key={row.key} data-event-tone={eventTone(row.type)} />)}
                  {eventCount > 3 ? <b>+{eventCount - 3}</b> : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="coachEventsCalendar__legend" aria-label="Event type legend">
        {["practice", "game", "camp", "meeting"].map((tone) => <span key={tone}><i data-event-tone={tone} />{tone}</span>)}
      </div>

      <div className="coachEventsCalendar__agenda" data-testid="coach-events-calendar-agenda">
        <div className="coachEventsCalendar__agendaHeader">
          <div>
            <span>Selected date</span>
            <strong>{effectiveSelectedDate ? formatSelectedDate(effectiveSelectedDate) : monthLabel}</strong>
          </div>
          {selectedRows.length ? <em>{selectedRows.length}</em> : null}
        </div>

        {selectedRows.length ? (
          <div className="coachEventsCalendar__agendaList">
            {selectedRows.map((row) => {
              const eventId = row?.event?.id ?? row?.key;
              const responseTotal = Number(row.rosterCount) || Number(row.responded) || 0;
              const responseCopy = responseTotal ? `${Number(row.responded) || 0}/${responseTotal} responded` : "RSVP tracking ready";
              return (
                <button
                  type="button"
                  key={row.key}
                  className="coachEventsCalendar__agendaItem"
                  data-event-tone={eventTone(row.type)}
                  onClick={() => typeof onOpenEvent === "function" && eventId != null && onOpenEvent(eventId)}
                >
                  <span className="coachEventsCalendar__agendaTime">{row.time || "TBD"}</span>
                  <span className="coachEventsCalendar__agendaCopy">
                    <strong>{row.title || "Team event"}</strong>
                    <small>{eventLabel(row.type)} · {row.location || "Location TBD"} · {responseCopy}</small>
                  </span>
                  <span className="coachEventsCalendar__agendaArrow" aria-hidden="true">↗</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="coachEventsCalendar__emptyMonth">
            <span>No events on this date.</span>
            {monthRows.length === 0 && typeof onCreateEvent === "function" ? <button type="button" onClick={onCreateEvent}>Create an event</button> : null}
          </div>
        )}
      </div>
    </section>
  );
}
