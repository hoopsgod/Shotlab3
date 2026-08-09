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
    "  const activeRate = rosterSize ? clamp(Math.round((activeCount / rosterSize) * 100), 0, 100) : 0;\n  const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);\n",
    "RSVP decision evidence",
  );

  if (!next.includes('label: "Review RSVPs"')) {
    const original = `  const primaryCommand = attentionCount > 0
    ? { eyebrow: "Today at a glance", title: \`${"${attentionCount}"} decision${"${attentionCount === 1 ? \"\" : \"s\"}"} before practice\`, detail: "Clear the priority, then set today’s plan.", label: "Review priority", onClick: onPlayersClick, state: "attention" }
    : activationCommand || (hasScheduledSession
      ? { eyebrow: "Practice ready", title: "Today is under control", detail: \`Your next team session is ${"${nextEventDateFormatted}"}.\`, label: "Open session", onClick: onNextEventClick, state: "ready" }
      : { eyebrow: "Today’s next move", title: "Build today’s practice", detail: "Set the focus every athlete should see next.", label: "Create practice", onClick: onScheduleEvent, state: "planning" });`;

    const replacement = `  const primaryCommand = attentionCount > 0
    ? { eyebrow: "Today at a glance", title: \`${"${attentionCount}"} decision${"${attentionCount === 1 ? \"\" : \"s\"}"} before practice\`, detail: "Clear the priority, then set today’s plan.", label: "Review priority", onClick: onPlayersClick, state: "attention" }
    : unresolvedRsvps > 0
      ? { eyebrow: "Today at a glance", title: "1 decision before practice", detail: unresolvedRsvps + " RSVP" + (unresolvedRsvps === 1 ? "" : "s") + " still open for " + (eventReadiness?.title || "the next session") + ".", label: "Review RSVPs", onClick: () => onEventReadinessClick?.(eventReadiness?.key), state: "attention" }
      : activationCommand || (hasScheduledSession
        ? { eyebrow: "Practice ready", title: "Today is under control", detail: \`Your next team session is ${"${nextEventDateFormatted}"}.\`, label: "Open session", onClick: onNextEventClick, state: "ready" }
        : { eyebrow: "Today’s next move", title: "Build today’s practice", detail: "Set the focus every athlete should see next.", label: "Create practice", onClick: onScheduleEvent, state: "planning" });`;

    if (!next.includes(original)) throw new Error("Phase 5A premium Coach hero target was not found.");
    next = next.replace(original, replacement);
  }

  for (const required of [
    '<span className="mcEyebrow">{primaryCommand.eyebrow}</span>',
    '<button type="button" onClick={onActiveTodayClick}><strong>{activeCount}<span>/{rosterSize}</span></strong><small>Active</small></button>',
    '<button type="button" onClick={onPlayersClick}><strong>{attentionCount}</strong><small>Follow-up</small></button>',
    '<button type="button" onClick={onNextEventClick}><strong>{hasScheduledSession ? "Set" : "—"}</strong><small>Next</small></button>',
    'function TeamActivityPanel(',
    'const teamPanel = hasTeamActivity ? <TeamActivityPanel',
  ]) if (!next.includes(required)) throw new Error(`Phase 5A must preserve accepted Phase 4 Coach presentation: ${required}`);

  if (next.includes('aria-label="Coach daily brief"') || next.includes("<small>RSVP ready</small>") || next.includes("player follow-up\" +")) {
    throw new Error("Phase 5A must not replace the accepted Coach hero with the rejected Daily Brief treatment.");
  }

  return next;
});

update("src/lib/coachDashboardSelectors.js", (source) => {
  let next = source;
  next = next.replace(
    "export const deriveCoachInsightSummary = ({ roster = [], scores = [], shotLogs = [], priorities = null, today = new Date().toISOString().slice(0,10) } = {}) => {",
    "export const deriveCoachInsightSummary = ({ roster = [], scores = [], shotLogs = [], today = new Date().toISOString().slice(0,10) } = {}) => {",
  );
  next = next.replace(
    "  const activityRows = [...normalizeCoachScores(scores), ...(Array.isArray(shotLogs)?shotLogs:[]).map((s)=>({email:normalizeEmailSafe(s?.email),date:String(s?.date||\"\")}))].filter((r)=>r.email&&r.date>=weekStart);",
    "  const rosterEmails = new Set(players.map((player)=>player.email));\n  const activityRows = [...normalizeCoachScores(scores), ...(Array.isArray(shotLogs)?shotLogs:[]).map((s)=>({email:normalizeEmailSafe(s?.email),date:String(s?.date||\"\")}))].filter((r)=>r.email&&r.date>=weekStart&&rosterEmails.has(r.email));",
  );
  next = next.replace("  const priorityCompletionRate = priorities?.priorityDrillText ? completionRate : Math.max(0, completionRate-8);\n", "");
  next = next.replace("    priorityCompletionRate,", "    weeklyActivityRate: completionRate,");
  if (next.includes("completionRate-8") || next.includes("priorityCompletionRate")) throw new Error("Phase 5A removed pseudo-derived priority completion evidence.");
  if (!next.includes("rosterEmails.has(r.email)")) throw new Error("Phase 5A weekly activity must be scoped to the supplied roster.");
  if (!next.includes("weeklyActivityRate: completionRate")) throw new Error("Phase 5A weekly activity evidence was not installed.");
  return next;
});

update("src/App.jsx", (source) => {
  let next = replaceRequired(
    source,
    "`Priority completion rate: ${coachInsights.priorityCompletionRate}%`",
    "`Weekly roster activity: ${coachInsights.weeklyActivityRate}%`",
    "roster intelligence copy",
  );

  next = replaceRequired(
    next,
    'let catalog=null;try{catalog=await trainingCatalogPersistence.hydrateCatalog({localHomeDrills:localSeededDrills,localProgramDrills:localSeededProgramDrills});}catch(error){emitReleaseDiagnostic("training_catalog_hydration_failed",{message:String(error?.message||"unknown")});}',
    'let catalog;if(sess?.email){try{catalog=await trainingCatalogPersistence.hydrateCatalog({localHomeDrills:localSeededDrills,localProgramDrills:localSeededProgramDrills});}catch(error){emitReleaseDiagnostic("training_catalog_hydration_failed",{message:String(error?.message||"unknown")});}}',
    "unauthenticated catalog bootstrap guard",
  );

  next = replaceRequired(
    next,
    'const authSession=SUPABASE_AUTH_ENABLED?await supabase.auth.getSession():null; const authEmail=normalizeEmail((SUPABASE_AUTH_ENABLED?authSession?.data?.session?.user?.email:"")||sess?.email||"");',
    'const authEmail=normalizeEmail(SUPABASE_AUTH_ENABLED?(await Promise.race([supabase.auth.getSession(),new Promise(r=>setTimeout(r,3e3))]))?.data?.session?.user?.email:sess?.email);',
    "bounded production auth bootstrap",
  );

  if (!next.includes('if(sess?.email){try{catalog=await trainingCatalogPersistence.hydrateCatalog')) throw new Error("Phase 5A auth landing must skip team catalog hydration for signed-out launches.");
  if (!next.includes('new Promise(r=>setTimeout(r,3e3))')) throw new Error("Phase 5A production session bootstrap must have a bounded timeout.");
  if (next.includes('(SUPABASE_AUTH_ENABLED?authSession?.data?.session?.user?.email:"")||sess?.email')) throw new Error("Phase 5A must not trust the local app session when production Supabase verification is unavailable.");
  return next;
});

console.log("Applied Phase 5A Coach decision intelligence and bounded auth bootstrap without changing the accepted Phase 4 visual language.");
await import("./externalize-shotlab-brand-logo.mjs");
await import("./apply-phase5b-practice-readiness.mjs");
