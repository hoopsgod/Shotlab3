import { useState } from "react";
import "./CoachEventsPremiumV2.css";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CoachEventsMonthCalendar({ rows = [], onOpenEvent }) {
  const next = rows.find((row) => row.statusKey === "upcoming") || rows[0];
  const anchor = next?.date ? new Date(`${next.date}T12:00`) : new Date();
  const [offset, setOffset] = useState(0);
  const month = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
  const byDate = new Map();
  rows.forEach((row) => byDate.set(row.date, [...(byDate.get(row.date) || []), row]));
  const start = new Date(month);
  start.setDate(1 - month.getDay());
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return <section className="coachEventsCalendar" data-testid="coach-events-month-calendar" aria-label="Team events month calendar">
    <div className="coachEventsCalendar__masthead">
      <div><span className="coachEventsCalendar__eyebrow">Team calendar</span><h2 data-testid="coach-events-calendar-month">{label}</h2></div>
      <div className="coachEventsCalendar__nav" aria-label="Calendar month navigation"><button type="button" aria-label="Previous month" onClick={() => setOffset(offset - 1)}>‹</button><button type="button" aria-label="Next month" onClick={() => setOffset(offset + 1)}>›</button></div>
    </div>
    <div className="coachEventsCalendar__weekdays" aria-hidden="true">{DAYS.map((day, index) => <span key={index}>{day}</span>)}</div>
    <div className="coachEventsCalendar__grid" role="grid" aria-label={label}>{Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start); date.setDate(start.getDate() + index);
      const key = keyOf(date), events = byDate.get(key) || [], inMonth = date.getMonth() === month.getMonth();
      return <button type="button" role="gridcell" key={key} className="coachEventsCalendar__day" data-in-month={String(inMonth)} data-has-events={String(Boolean(events.length))} aria-label={`${key}, ${events.length} events`} onClick={() => events[0] && onOpenEvent?.(events[0]?.event?.id ?? events[0].key)} disabled={!inMonth}>
        <span className="coachEventsCalendar__dayNumber">{date.getDate()}</span>{events.length > 0 && <span className="coachEventsCalendar__eventMarks" aria-hidden="true">{events.slice(0, 3).map((row) => <i key={row.key} />)}</span>}
      </button>;
    })}</div>
  </section>;
}
