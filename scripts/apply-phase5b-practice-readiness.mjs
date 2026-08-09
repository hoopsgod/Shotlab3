import { readFileSync, writeFileSync } from "node:fs";

const update = (path, transform) => {
  const source = readFileSync(path, "utf8");
  const next = transform(source);
  if (next !== source) writeFileSync(path, next);
};

const replaceRequired = (source, from, to, label) => {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[phase5b-practice-readiness] ${label} target was not found.`);
  return source.replace(from, to);
};

update("src/components/CoachInteractiveDashboards.jsx", (source) => {
  let next = source;
  next = replaceRequired(
    next,
    '    { key: "gaps", label: "Missing RSVPs", value: briefing.missing, detail: `${briefing.gapEvents.length} affected events`, tone: "attention" },',
    '    { key: "gaps", label: "Awaiting RSVP", value: briefing.awaitingResponse, detail: `${briefing.gapEvents.length} affected events`, tone: "attention" },',
    "awaiting-RSVP metric",
  );
  next = replaceRequired(
    next,
    '    { key: "all", label: "Response Rate", value: `${briefing.responseRate}%`, detail: `${briefing.confirmed} confirmations`, tone: briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },',
    '    { key: "all", label: "Response Rate", value: `${briefing.responseRate}%`, detail: `${briefing.responded} responses · ${briefing.attending} attending`, tone: briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },',
    "truthful response metric",
  );
  next = replaceRequired(
    next,
    '        <DashboardProgress value={briefing.responseRate} max={100} label="Upcoming RSVP completion" detail={`${briefing.confirmed} confirmed`} />',
    '        <DashboardProgress value={next?.attending || 0} max={next?.rosterCount || 1} label="Next-session availability" detail={next ? `${next.attending} attending · ${next.awaitingResponse} awaiting` : "No event scheduled"} />',
    "next-session availability progress",
  );
  if (next.includes('label: "Missing RSVPs"') || next.includes('`${briefing.confirmed} confirmations`')) {
    throw new Error("[phase5b-practice-readiness] rejected response/attendance conflation remains in Events dashboard.");
  }
  return next;
});

update("src/components/CoachDashboardPhase2.jsx", (source) => {
  let next = source;
  next = replaceRequired(
    next,
    '{ label: "Event readiness", value: `${model.attendanceRate}%` },',
    '{ label: "Upcoming availability", value: `${model.attendanceRate}%` },',
    "player availability metric",
  );
  next = replaceRequired(
    next,
    '<DashboardProgress value={model.attendanceRate} max={100} label="Event readiness" detail={`${model.attendanceConfirmed} of ${model.attendancePossible}`} />',
    '<DashboardProgress value={model.attendanceRate} max={100} label="Upcoming availability" detail={`${model.attendanceConfirmed} attending of ${model.attendancePossible}`} />',
    "player availability progress",
  );
  next = replaceRequired(
    next,
    `          <MetricGrid items={[
            { label: "Confirmed", value: model.confirmed.length },
            { label: "Missing", value: model.missing.length },
            { label: "Response rate", value: \`${"${model.responseRate}"}%\` },
            { label: "Walk-ins", value: model.walkIns.length },
          ]} />`,
    `          <MetricGrid items={[
            { label: "Attending", value: model.attending.length },
            { label: "Unavailable", value: model.unavailable.length },
            { label: "Awaiting RSVP", value: model.awaitingResponse.length },
            { label: "Response rate", value: \`${"${model.responseRate}"}%\` },
            { label: "Walk-ins", value: model.walkIns.length },
          ]} />`,
    "event intelligence metrics",
  );
  next = replaceRequired(
    next,
    `          <DashboardSection eyebrow="Readiness" title="Attendance response" summary={model.description} compact>
            <DashboardProgress value={model.responseRate} max={100} label="Roster response" detail={\`${"${model.confirmed.length}"} confirmed\`} />
          </DashboardSection>`,
    `          <DashboardSection eyebrow="Practice readiness" title="Next-session availability" summary={model.description} compact>
            <DashboardProgress value={model.availabilityRate} max={100} label="Roster attending" detail={\`${"${model.attending.length}"} of ${"${model.rosterCount}"}\`} />
          </DashboardSection>`,
    "event availability progress",
  );
  next = replaceRequired(
    next,
    `          <DashboardSection eyebrow="Confirmed" title="Available players" summary="Players currently attached to this event." compact>
            {model.confirmed.length ? <div className={styles.personList}>{model.confirmed.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Ready</em></div>)}</div> : <EmptyState>No confirmed players yet.</EmptyState>}
          </DashboardSection>
          <DashboardSection eyebrow="Follow-up" title="Missing responses" summary="Players who still need an RSVP touchpoint." compact>
            {model.missing.length ? <div className={styles.personList}>{model.missing.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Follow up</em></div>)}</div> : <EmptyState>Every rostered player has responded.</EmptyState>}
          </DashboardSection>`,
    `          <DashboardSection eyebrow="Attending" title="Available players" summary="Players who have responded that they are attending." compact>
            {model.attending.length ? <div className={styles.personList}>{model.attending.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Attending</em></div>)}</div> : <EmptyState>No players have marked themselves attending yet.</EmptyState>}
          </DashboardSection>
          {model.unavailable.length ? <DashboardSection eyebrow="Unavailable" title="Known absences" summary="Players who have responded that they cannot attend." compact>
            <div className={styles.personList}>{model.unavailable.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Unavailable</em></div>)}</div>
          </DashboardSection> : null}
          <DashboardSection eyebrow="Follow-up" title="Awaiting RSVP" summary="Players who still need an RSVP touchpoint." compact>
            {model.awaitingResponse.length ? <div className={styles.personList}>{model.awaitingResponse.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Follow up</em></div>)}</div> : <EmptyState>Every rostered player has responded.</EmptyState>}
          </DashboardSection>`,
    "event attendance sections",
  );
  if (next.includes('{ label: "Confirmed", value: model.confirmed.length }') || next.includes('title="Missing responses"')) {
    throw new Error("[phase5b-practice-readiness] rejected drawer confirmation language remains.");
  }
  return next;
});

console.log("Applied Phase 5B truthful practice-readiness presentation across Events and event intelligence.");
