import { readFileSync, writeFileSync } from "node:fs";

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
source = source
  .replace("  const hasTeamActivity = activeCount > 0;\n", "")
  .replace("  const pulsePanel = <ProgramPulsePanel model={programPulse} onOpen={onPlayersClick} />;", "  const pulsePanel = <ProgramPulsePanel model={programPulse} />;");
writeFileSync(componentPath, source);

const testPath = "tests/coach-command-center-10x.test.mjs";
let tests = readFileSync(testPath, "utf8");
tests = tests
  .replace('assert.match(source,/model\\?\\.value == null \\? "—"/);', 'assert.match(source,/value == null \\? "—"/);')
  .replace('assert.match(source,/model\\?\\.value == null \\? "No weekly goal data"/);', 'assert.match(source,/value == null \\? <div className="mcAllClear"/);\n  assert.match(source,/No weekly goal data/);');
writeFileSync(testPath, tests);
