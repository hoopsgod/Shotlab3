import { readFileSync, writeFileSync } from "node:fs";

const update = (path, transform) => {
  const source = readFileSync(path, "utf8");
  const next = transform(source);
  if (next !== source) writeFileSync(path, next);
};

const replaceRequired = (source, pattern, replacement, label) => {
  if (typeof pattern === "string") {
    if (source.includes(replacement)) return source;
    if (!source.includes(pattern)) throw new Error(`Phase 5A ${label} target was not found.`);
    return source.replace(pattern, replacement);
  }
  if (replacement && source.includes(replacement)) return source;
  if (!pattern.test(source)) throw new Error(`Phase 5A ${label} target was not found.`);
  return source.replace(pattern, replacement);
};

update("src/components/CoachCommandCenter.jsx", (source) => {
  let next = source;

  next = replaceRequired(
    next,
    "  const activeRate = rosterSize ? clamp(Math.round((activeCount / rosterSize) * 100), 0, 100) : 0;\n",
    "  const activeRate = rosterSize ? clamp(Math.round((activeCount / rosterSize) * 100), 0, 100) : 0;\n  const rsvpReadiness = eventReadiness ? clamp(eventReadiness.responseRate, 0, 100) : null;\n  const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);\n",
    "readiness metrics",
  );
  next = next.replace("  const inactiveCount = Math.max(rosterSize - activeCount, 0);\n", "");

  if (!next.includes('label: "Review RSVPs"')) {
    const primaryPattern = /  const primaryCommand = attentionCount > 0[\s\S]*?\n\s*: \{ eyebrow: \"Today’s next move\", title: \"Build today’s practice\", detail: \"Set the focus every athlete should see next\.\", label: \"Create practice\", onClick: onScheduleEvent, state: \"planning\" \}\);/;
    if (!primaryPattern.test(next)) throw new Error("Phase 5A primary command target was not found.");
    const primary = `  const primaryCommand = attentionCount > 0
    ? { eyebrow: "Daily brief", title: attentionCount + " player follow-up" + (attentionCount === 1 ? "" : "s"), detail: "Clear the player priority before moving to the session plan.", label: "Review priority", onClick: onPlayersClick, state: "attention" }
    : unresolvedRsvps > 0
      ? { eyebrow: "Daily brief", title: unresolvedRsvps + " RSVP" + (unresolvedRsvps === 1 ? "" : "s") + " still open", detail: rsvpReadiness + "% of the roster has responded for " + (eventReadiness?.title || "the next session") + ".", label: "Review RSVPs", onClick: () => onEventReadinessClick?.(eventReadiness?.key), state: "attention" }
      : activationCommand || (hasScheduledSession
        ? { eyebrow: "Daily brief", title: "Today is under control", detail: "Next session: " + nextEventDateFormatted + ".", label: "Open session", onClick: onNextEventClick, state: "ready" }
        : { eyebrow: "Today’s next move", title: "Build today’s practice", detail: "Set the focus every athlete should see next.", label: "Create practice", onClick: onScheduleEvent, state: "planning" });`;
    next = next.replace(primaryPattern, primary);
  }

  if (!next.includes("<small>RSVP ready</small>")) {
    const realityPattern = /            <div className="mcRealityStrip" data-testid="coach-primary-metrics">[\s\S]*?\n            <\/div>\n            <button type="button" className="mcPrimary"/;
    if (!realityPattern.test(next)) throw new Error("Phase 5A reality strip target was not found.");
    const reality = `            <div className="mcRealityStrip" data-testid="coach-primary-metrics" aria-label="Coach daily brief">
              <button type="button" onClick={onActiveTodayClick}><strong>{rosterSize ? activeRate + "%" : "—"}</strong><small>Today active</small></button>
              <button type="button" onClick={onNextEventClick}><strong>{rsvpReadiness == null ? "—" : rsvpReadiness + "%"}</strong><small>RSVP ready</small></button>
              <button type="button" onClick={onPlayersClick}><strong>{attentionCount}</strong><small>Follow-up</small></button>
            </div>
            <button type="button" className="mcPrimary"`;
    next = next.replace(realityPattern, reality);
  }

  const teamActivityStart = next.indexOf("function TeamActivityPanel(");
  if (teamActivityStart >= 0) {
    const liveActivityStart = next.indexOf("function LiveActivityPanel", teamActivityStart);
    if (liveActivityStart < 0) throw new Error("Phase 5A live activity boundary was not found.");
    next = next.slice(0, teamActivityStart) + next.slice(liveActivityStart);
  }

  if (next.includes("const teamPanel =")) {
    const teamPanelStart = next.indexOf("  const teamPanel =");
    const lowerPanelsEnd = next.indexOf("\n", next.indexOf("  const lowerPanels =", teamPanelStart));
    if (teamPanelStart < 0 || lowerPanelsEnd < 0) throw new Error("Phase 5A team panel boundary was not found.");
    next = next.slice(0, teamPanelStart) + "  const priorityPanel = sessionPanel || livePanel;\n  const lowerPanels = [sessionPanel ? livePanel : null].filter(Boolean);" + next.slice(lowerPanelsEnd);
  }

  next = next.replace(/\n\s*\{\(sessionPanel \|\| teamPanel\) && livePanel \? <section className="mcLiveEvidence" data-testid="coach-live-evidence-region">\{livePanel\}<\/section> : null\}/, "");

  if (next.includes("TeamActivityPanel") || /\bteamPanel\b/.test(next) || next.includes("coach-live-evidence-region")) throw new Error("Phase 5A redundant team activity/live evidence was not removed.");
  return next;
});

update("src/lib/coachDashboardSelectors.js", (source) => {
  let next = source;
  next = next.replace(
    "export const deriveCoachInsightSummary = ({ roster = [], scores = [], shotLogs = [], priorities = null, today = new Date().toISOString().slice(0,10) } = {}) => {",
    "export const deriveCoachInsightSummary = ({ roster = [], scores = [], shotLogs = [], today = new Date().toISOString().slice(0,10) } = {}) => {",
  );
  next = next.replace("  const priorityCompletionRate = priorities?.priorityDrillText ? completionRate : Math.max(0, completionRate-8);\n", "");
  next = next.replace("    priorityCompletionRate,", "    weeklyActivityRate: completionRate,");
  if (next.includes("completionRate-8") || next.includes("priorityCompletionRate")) throw new Error("Phase 5A removed pseudo-derived priority completion evidence.");
  if (!next.includes("weeklyActivityRate: completionRate")) throw new Error("Phase 5A weekly activity evidence was not installed.");
  return next;
});

update("src/App.jsx", (source) => replaceRequired(
  source,
  "`Priority completion rate: ${coachInsights.priorityCompletionRate}%`",
  "`Weekly roster activity: ${coachInsights.weeklyActivityRate}%`",
  "roster intelligence copy",
));

console.log("Applied Phase 5A truthful Coach daily intelligence.");
