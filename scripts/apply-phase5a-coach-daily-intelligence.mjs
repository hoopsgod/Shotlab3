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

// Coach Mission Control title, Hero composition, and RSVP decision content are source-owned.
// Phase 5A may verify those contracts, but must never rewrite CoachCommandCenter.jsx.
{
  const coachSource = readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
  for (const required of [
    'const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);',
    'label: "Review RSVPs"',
    'data-team-identity-stage="coach-mission-control"',
    'className="mcHeroIdentity"',
  ]) if (!coachSource.includes(required)) throw new Error(`Phase 5A source-owned Coach contract missing: ${required}`);
}

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

  next = replaceRequired(
    next,
    'const coachSeasonComparisonModel=useMemo(()=>buildSeasonComparisonModel({currentRoster:coachRosterPlayers,currentScores:safeScores,currentShotLogs:safeShotLogs,currentEvents:safeEvents,currentRsvps:safeRsvps,currentScSessions:scSessions,currentScLogs:safeScLogs,archives:seasonArchives,selectedArchiveId:selectedSeasonArchiveId}),[coachRosterPlayers,safeScores,safeShotLogs,safeEvents,safeRsvps,scSessions,safeScLogs,seasonArchives,selectedSeasonArchiveId]);',
    'const coachSeasonComparisonModel=useMemo(()=>buildSeasonComparisonModel({currentRoster:coachRosterPlayers,currentScores:[...safeScores,...safeProgramScores],currentShotLogs:safeShotLogs,currentEvents:safeEvents,currentRsvps:safeRsvps,currentScSessions:scSessions,currentScLogs:safeScLogs,archives:seasonArchives,selectedArchiveId:selectedSeasonArchiveId}),[coachRosterPlayers,safeScores,safeProgramScores,safeShotLogs,safeEvents,safeRsvps,scSessions,safeScLogs,seasonArchives,selectedSeasonArchiveId]);',
    "season comparison program-score coverage",
  );

  if (!next.includes('if(sess?.email){try{catalog=await trainingCatalogPersistence.hydrateCatalog')) throw new Error("Phase 5A auth landing must skip team catalog hydration for signed-out launches.");
  if (!next.includes('new Promise(r=>setTimeout(r,3e3))')) throw new Error("Phase 5A production session bootstrap must have a bounded timeout.");
  if (next.includes('(SUPABASE_AUTH_ENABLED?authSession?.data?.session?.user?.email:"")||sess?.email')) throw new Error("Phase 5A must not trust the local app session when production Supabase verification is unavailable.");
  if (!next.includes('currentScores:[...safeScores,...safeProgramScores]')) throw new Error("Phase 5A season comparison must include both home and program score collections.");
  return next;
});

console.log("Verified source-owned Coach decision intelligence and applied Phase 5A data/auth reconciliation without mutating Coach title composition.");
await import("./externalize-shotlab-brand-logo.mjs");
await import("./apply-phase5b-practice-readiness.mjs");
