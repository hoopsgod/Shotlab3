import { readFileSync, writeFileSync } from "node:fs";

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: expected exactly one seam`);
  return source.replace(before, after);
};

const componentPath = "src/components/CoachCommandCenter.jsx";
let source = readFileSync(componentPath, "utf8");
const start = source.indexOf("function ProgramPulsePanel({ model, onOpen }) {");
const end = source.indexOf("\nfunction LiveActivityPanel", start);
if (start < 0 || end < 0) throw new Error("Program Pulse panel seam not found");
const replacement = `function ProgramPulsePanel({ model }) {
  const value = model?.value;
  return <article className="mcSection mcTeamHealth" aria-labelledby="mc-program-pulse-heading" data-testid="coach-program-pulse"><div className="mcSectionHead"><span><small>Weekly goal</small><h2 id="mc-program-pulse-heading">Program Pulse</h2></span><strong className="mcHealthScore">{value == null ? "—" : \`\${value}%\`}</strong></div><div className="mcHealthBar" aria-hidden="true"><span style={{ width: \`\${value || 0}%\` }} /></div>{value == null ? <div className="mcAllClear"><div><small>No weekly goal data</small></div></div> : null}</article>;
}`;
source = source.slice(0, start) + replacement + source.slice(end);
source = replaceOnce(source, "  const hasTeamActivity = activeCount > 0;\n", "", "unused team activity flag");
source = replaceOnce(source, "  const pulsePanel = <ProgramPulsePanel model={programPulse} onOpen={onPlayersClick} />;", "  const pulsePanel = <ProgramPulsePanel model={programPulse} />;", "Program Pulse CTA removal");
source = replaceOnce(source, '<h2 id="mc-attention-heading">Needs Attention</h2>', '<h2 id="mc-attention-heading">Needs attention</h2>', "established attention heading");
writeFileSync(componentPath, source);

const metricsPath = "src/lib/coachOperationalDashboard.js";
let metrics = readFileSync(metricsPath, "utf8");
const beforePulse = `    programPulse: totalGoal
      ? { available: true, value, displayValue: \`\${value}%\`, detail: \`\${Math.round(creditedMakes)} of \${Math.round(totalGoal)} weekly makes\`, eligibleAthletes: safeRows.length, creditedMakes, totalGoal }
      : { available: false, value: null, displayValue: "—", detail: "No weekly goal data", eligibleAthletes: safeRows.length, creditedMakes: 0, totalGoal: 0 },`;
metrics = replaceOnce(metrics, beforePulse, "    programPulse: { value },", "Program Pulse runtime model compaction");
writeFileSync(metricsPath, metrics);

const testPath = "tests/coach-command-center-10x.test.mjs";
let tests = readFileSync(testPath, "utf8");
tests = replaceOnce(tests, '"Needs Attention"', '"Needs attention"', "attention contract casing");
tests = replaceOnce(tests, 'assert.match(source,/model\\?\\.value == null \\? "—"/);', 'assert.match(source,/value == null \\? "—"/);', "Program Pulse display contract");
tests = replaceOnce(tests, 'assert.match(source,/model\\?\\.value == null \\? "No weekly goal data"/);', 'assert.match(source,/value == null \\? <div className="mcAllClear"/);\n  assert.match(source,/No weekly goal data/);', "Program Pulse unavailable contract");
writeFileSync(testPath, tests);
