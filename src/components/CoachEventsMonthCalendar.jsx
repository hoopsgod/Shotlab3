import { useState } from "react";
import "./CoachEventsPremiumV2.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPES = {
  run: ["practice", "Practice"],
  game: ["game", "Game"],
  clinic: ["camp", "Camp"],
  recovery: ["meeting", "Meeting"],
  challenge: ["challenge", "Challenge"],
};
const localDate = (value = "") => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null;
const keyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const monthOf = (date) => keyOf(date).slice(0, 7);
const metaOf = (row) => TYPES[row?.type] || ["event", "Event"];

export default function CoachEventsMonthCalendar({ rows = [], activeType = "all", onOpenEvent, onCreateEvent }) {
  const valid = rows.filter((row) => localDate(row?.date));
  const filtered = activeType === "all" ? valid : valid.filter((row) => row.type === activeType);
  const next = valid.find((row) => row.statusKey === "upcoming") || valid[0];
  const anchor = localDate(next?.date) || new Date();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const month = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
  const monthKey = monthOf(month);
  const today = new Date();
  const todayKey = keyOf(today);
  const byDate = new Map();
  filtered.forEach((row) => {
    const bucket = byDate.get(row.date) || [];
    bucket.push(row);
    byDate.set(row.date, bucket);
  });
  byDate.forEach((bucket) => bucket.sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))));
  const monthRows = filtered.filter((row) => row.date.startsWith(monthKey));
  const selectedKey = selected.startsWith(monthKey) ? selected : (monthRows[0]?.date || "");
  const selectedRows = byDate.get(selectedKey) || [];
  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = keyOf(date);
    return { date, key, events: byDate.get(key) || [], inMonth: date.getMonth() === month.getMonth() };
  });
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const goToday = () => {
    setOffset((today.getFullYear() - anchor.getFullYear()) * 12 + today.getMonth() - anchor.getMonth());
    setSelected(todayKey);
  };

  return <section className="coachEventsCalendar" data-testid="coach-events-month-calendar" aria-label="Team events month calendar">
    <div className="coachEventsCalendar__masthead">
      <div><span className="coachEventsCalendar__eyebrow">Team calendar</span><h2 data-testid="coach-events-calendar-month">{label}</h2><p>{monthRows.length} {monthRows.length === 1 ? "event" : "events"} this month</p></div>
      <div className="coachEventsCalendar__nav" aria-label="Calendar month navigation">
        {monthKey !== monthOf(today) && <button type="button" className="coachEventsCalendar__today" onClick={goToday}>Today</button>}
        <button type="button" aria-label="Previous month" onClick={() => { setOffset(offset - 1); setSelected(""); }}>‹</button>
        <button type="button" aria-label="Next month" onClick={() => { setOffset(offset + 1); setSelected(""); }}>›</button>
      </div>
    </div>
    <div className="coachEventsCalendar__weekdays" aria-hidden="true">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="coachEventsCalendar__grid" role="grid" aria-label={label}>
      {cells.map((cell) => {
        const count = cell.events.length;
        return <button type="button" role="gridcell" key={cell.key} className="coachEventsCalendar__day" data-in-month={String(cell.inMonth)} data-selected={String(cell.key === selectedKey)} data-today={String(cell.key === todayKey)} data-has-events={String(Boolean(count))} aria-label={`${cell.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${count || "no"} ${count === 1 ? "event" : "events"}`} aria-selected={cell.key === selectedKey} onClick={() => cell.inMonth && setSelected(cell.key)} tabIndex={cell.inMonth ? 0 : -1}>
          <span className="coachEventsCalendar__dayNumber">{cell.date.getDate()}</span>
          {count > 0 && <span className="coachEventsCalendar__eventMarks" aria-hidden="true">{cell.events.slice(0, 3).map((row) => <i key={row.key} data-event-tone={metaOf(row)[0]} />)}{count > 3 && <b>+{count - 3}</b>}</span>}
        </button>;
      })}
    </div>
    <div className="coachEventsCalendar__legend" aria-label="Event type legend">{[["practice", "practice"], ["game", "game"], ["camp", "camp"], ["meeting", "meeting"]].map(([tone, text]) => <span key={tone}><i data-event-tone={tone} />{text}</span>)}</div>
    <div className="coachEventsCalendar__agenda" data-testid="coach-events-calendar-agenda">
      <div className="coachEventsCalendar__agendaHeader"><div><span>Selected date</span><strong>{selectedKey ? localDate(selectedKey).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : label}</strong></div>{selectedRows.length > 0 && <em>{selectedRows.length}</em>}</div>
      {selectedRows.length > 0 ? <div className="coachEventsCalendar__agendaList">{selectedRows.map((row) => {
        const eventId = row?.event?.id ?? row.key;
        const total = Number(row.rosterCount) || Number(row.responded) || 0;
        return <button type="button" key={row.key} className="coachEventsCalendar__agendaItem" data-event-tone={metaOf(row)[0]} onClick={() => onOpenEvent?.(eventId)}>
          <span className="coachEventsCalendar__agendaTime">{row.time || "TBD"}</span><span className="coachEventsCalendar__agendaCopy"><strong>{row.title || "Team event"}</strong><small>{metaOf(row)[1]} · {row.location || "Location TBD"} · {total ? `${Number(row.responded) || 0}/${total} responded` : "RSVP tracking ready"}</small></span><span className="coachEventsCalendar__agendaArrow" aria-hidden="true">↗</span>
        </button>;
      })}</div> : <div className="coachEventsCalendar__emptyMonth"><span>No events on this date.</span>{monthRows.length === 0 && onCreateEvent && <button type="button" onClick={onCreateEvent}>Create an event</button>}</div>}
    </div>
  </section>;
}
