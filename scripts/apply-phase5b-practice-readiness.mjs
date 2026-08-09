import { readFileSync, writeFileSync } from "node:fs";

const path = "src/components/CoachInteractiveDashboards.jsx";
const source = readFileSync(path, "utf8");
let next = source;

const replaceRequired = (from, to, label) => {
  if (next.includes(to)) return;
  if (!next.includes(from)) throw new Error(`[phase5b-practice-readiness] ${label} target was not found.`);
  next = next.replace(from, to);
};

replaceRequired(
  '    { key: "gaps", label: "Missing RSVPs", value: briefing.missing, detail: `${briefing.gapEvents.length} affected events`, tone: "attention" },',
  '    { key: "gaps", label: "Awaiting RSVP", value: briefing.awaitingResponse, detail: `${briefing.gapEvents.length} affected events`, tone: "attention" },',
  "awaiting-RSVP metric",
);

replaceRequired(
  '    { key: "all", label: "Response Rate", value: `${briefing.responseRate}%`, detail: `${briefing.confirmed} confirmations`, tone: briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },',
  '    { key: "all", label: "Response Rate", value: `${briefing.responseRate}%`, detail: `${briefing.responded} responses · ${briefing.attending} attending`, tone: briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },',
  "truthful response metric",
);

replaceRequired(
  '        <DashboardProgress value={briefing.responseRate} max={100} label="Upcoming RSVP completion" detail={`${briefing.confirmed} confirmed`} />',
  '        <DashboardProgress value={next?.attending || 0} max={next?.rosterCount || 1} label="Next-session availability" detail={next ? `${next.attending} attending · ${next.awaitingResponse} awaiting` : "No event scheduled"} />',
  "next-session availability progress",
);

if (next.includes('label: "Missing RSVPs"') || next.includes('`${briefing.confirmed} confirmations`')) {
  throw new Error("[phase5b-practice-readiness] rejected response/attendance conflation remains in Events dashboard.");
}

if (next !== source) writeFileSync(path, next);
console.log("Applied Phase 5B truthful practice-readiness presentation.");
