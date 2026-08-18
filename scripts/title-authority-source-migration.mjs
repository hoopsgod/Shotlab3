import { readFileSync, writeFileSync } from 'node:fs';

const coachPath = 'src/components/CoachCommandCenter.jsx';
const phase5aPath = 'scripts/apply-phase5a-coach-daily-intelligence.mjs';

let coach = readFileSync(coachPath, 'utf8');
const activeRateAnchor = '  const activeRate = rosterSize ? clamp(Math.round((activeCount / rosterSize) * 100), 0, 100) : 0;\n';
if (!coach.includes('const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);')) {
  if (!coach.includes(activeRateAnchor)) throw new Error('Coach active-rate source anchor not found.');
  coach = coach.replace(activeRateAnchor, `${activeRateAnchor}  const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);\n`);
}

if (!coach.includes('label: "Review RSVPs"')) {
  const primaryStart = coach.indexOf('  const primaryCommand = attentionCount > 0 ?');
  const quickActionsStart = coach.indexOf('  const quickActions =', primaryStart);
  if (primaryStart < 0 || quickActionsStart < 0) throw new Error('Coach primary-command source boundary not found.');
  const primaryCommand = `  const primaryCommand = attentionCount > 0\n    ? { eyebrow: "Today at a glance", title: \`${'${attentionCount}'} decision${'${attentionCount === 1 ? "" : "s"}'} before practice\`, detail: "Clear the priority, then set today’s plan.", label: "Review priority", onClick: onPlayersClick, state: "attention" }\n    : unresolvedRsvps > 0\n      ? { eyebrow: "Today at a glance", title: "1 decision before practice", detail: unresolvedRsvps + " RSVP" + (unresolvedRsvps === 1 ? "" : "s") + " still open for " + (eventReadiness?.title || "the next session") + ".", label: "Review RSVPs", onClick: () => onEventReadinessClick?.(eventReadiness?.key), state: "attention" }\n      : activationCommand || (hasScheduledSession\n        ? { eyebrow: "Practice ready", title: "Today is under control", detail: \`Your next team session is ${'${nextEventDateFormatted}'}.\`, label: "Open session", onClick: onNextEventClick, state: "ready" }\n        : { eyebrow: "Today’s next move", title: "Build today’s practice", detail: "Set the focus every athlete should see next.", label: "Create practice", onClick: onScheduleEvent, state: "planning" });\n`;
  coach = `${coach.slice(0, primaryStart)}${primaryCommand}${coach.slice(quickActionsStart)}`;
}

for (const expected of [
  'data-team-identity-stage="coach-mission-control"',
  'const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);',
  'label: "Review RSVPs"',
  'className="mcHeroIdentity"',
]) {
  if (!coach.includes(expected)) throw new Error(`Coach source-owned title/decision contract missing: ${expected}`);
}
writeFileSync(coachPath, coach);

let phase5a = readFileSync(phase5aPath, 'utf8');
const coachMutationStart = phase5a.indexOf('update("src/components/CoachCommandCenter.jsx"');
const selectorMutationStart = phase5a.indexOf('update("src/lib/coachDashboardSelectors.js"');
if (coachMutationStart >= 0) {
  if (selectorMutationStart <= coachMutationStart) throw new Error('Phase 5A Coach mutation boundary is malformed.');
  const sourceOwnedGuard = `// Coach Mission Control title, Hero composition, and RSVP decision content are source-owned.\n// Phase 5A may verify those contracts, but must never rewrite CoachCommandCenter.jsx.\n{\n  const coachSource = readFileSync("src/components/CoachCommandCenter.jsx", "utf8");\n  for (const required of [\n    'const unresolvedRsvps = Math.max(0, Number(eventReadiness?.missing) || 0);',\n    'label: "Review RSVPs"',\n    'data-team-identity-stage="coach-mission-control"',\n    'className="mcHeroIdentity"',\n  ]) if (!coachSource.includes(required)) throw new Error(\`Phase 5A source-owned Coach contract missing: ${'${required}'}\`);\n}\n\n`;
  phase5a = `${phase5a.slice(0, coachMutationStart)}${sourceOwnedGuard}${phase5a.slice(selectorMutationStart)}`;
}
phase5a = phase5a.replace(
  'console.log("Applied Phase 5A Coach decision intelligence and bounded auth bootstrap without changing the accepted Phase 4 visual language.");',
  'console.log("Verified source-owned Coach decision intelligence and applied Phase 5A data/auth reconciliation without mutating Coach title composition.");',
);
if (phase5a.includes('update("src/components/CoachCommandCenter.jsx"')) throw new Error('Phase 5A still mutates CoachCommandCenter source.');
if (!phase5a.includes('source-owned Coach contract missing')) throw new Error('Phase 5A source-owned Coach verification guard missing.');
writeFileSync(phase5aPath, phase5a);

console.log('Migrated Coach RSVP decision intelligence into source ownership and retired the Phase 5A Coach Hero mutation.');
