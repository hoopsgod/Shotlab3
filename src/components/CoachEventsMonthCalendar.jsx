import { useState } from "react";
import "./CoachEventsPremiumV2.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const keyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function CoachEventsMonthCalendar({ rows = [], onOpenEvent }) {
  const next = rows.find((row) => row.statusKey === "upcoming") || rows[0];
  const anchor = next?.date ? new Date(`${next.date}T12:00:00`) : new Date();
  const [offset, setOffset] = useState(0);
  const month = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
  const monthKey = keyOf(month).slice(0, 7);
  const byDate = new Map();
  rows.forEach((row) => byDate.set(row.date, [...(byDate.get(row.date) || []), row]));
  const monthRows = rows.filter((row) => String(row.date || "").startsWith(monthKey));
  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return <section className="coachEventsCalendar" data-testid="coach-events-month-calendar" aria-label="Team events month calendar">
    <div className="coachEventsCalendar__masthead">
      <div><span className="coachEventsCalendar__eyebrow">Team calendar</span><h2 data-testid="coach-events-calendar-month">{label}</h2><p>{monthRows.length} {monthRows.length === 1 ? "event" : "events"} this month</p></div>
      <div className="coachEventsCalendar__nav" aria-label="Calendar month navigation"><button type="button" aria-label="Previous month" onClick={() => setOffset(offset - 1)}>‹</button><button type="button" aria-label="Next month" onClick={() => setOffset(offset + 1)}>›</button></div>
    </div>
    <div className="coachEventsCalendar__weekdays" aria-hidden="true">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="coachEventsCalendar__grid" role="grid" aria-label={label}>{Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start); date.setDate(start.getDate() + index);
      const key = keyOf(date), events = byDate.get(key) || [], inMonth = date.getMonth() === month.getMonth();
      return <button type="button" role="gridcell" key={key} className="coachEventsCalendar__day" data-in-month={String(inMonth)} data-has-events={String(Boolean(events.length))} aria-label={`${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${events.length || "no"} ${events.length === 1 ? "event" : "events"}`} onClick={() => events[0] && onOpenEvent?.(events[0]?.event?.id ?? events[0].key)} disabled={!inMonth}>
        <span className="coachEventsCalendar__dayNumber">{date.getDate()}</span>{events.length > 0 && <span className="coachEventsCalendar__eventMarks" aria-hidden="true">{events.slice(0, 3).map((row) => <i key={row.key} />)}{events.length > 3 && <b>+{events.length - 3}</b>}</span>}
      </button>;
    })}</div>
    {monthRows.length === 0 && <div className="coachEventsCalendar__emptyMonth"><span>No events scheduled this month.</span></div>}
  </section>;
}
