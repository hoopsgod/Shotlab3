import { readFileSync, writeFileSync, rmSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const write = (path, source) => writeFileSync(new URL(`../${path}`, import.meta.url), source);
const replaceOnce = (path, label, before, after) => {
  let source = read(path);
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: expected seam not found in ${path}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: seam is not unique in ${path}`);
  source = source.replace(before, after);
  write(path, source);
};
const replaceBlock = (path, label, start, end, replacement) => {
  let source = read(path);
  const first = source.indexOf(start);
  if (first < 0) throw new Error(`${label}: start seam not found in ${path}`);
  if (source.indexOf(start, first + start.length) >= 0) throw new Error(`${label}: start seam is not unique in ${path}`);
  const last = source.indexOf(end, first + start.length);
  if (last < 0) throw new Error(`${label}: end seam not found in ${path}`);
  source = source.slice(0, first) + replacement + source.slice(last);
  write(path, source);
};

replaceOnce(
  "src/App.jsx",
  "Coach operational import",
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, buildCoachProgramPulse, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";',
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";',
);
replaceOnce(
  "src/App.jsx",
  "Separate Program Pulse memo",
  'const coachProgramPulse=useMemo(()=>buildCoachProgramPulse(coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget),[coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget]);\n',
  "",
);
replaceOnce(
  "src/App.jsx",
  "Coach player metrics memo",
  'const coachPlayerDashboardMetrics=useMemo(()=>buildCoachPlayerDashboardMetrics(coachPlayerDashboardRows),[coachPlayerDashboardRows]);',
  'const coachPlayerDashboardMetrics=useMemo(()=>buildCoachPlayerDashboardMetrics(coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget),[coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget]);',
);
replaceOnce(
  "src/App.jsx",
  "Coach Home Program Pulse prop",
  "programPulse={coachProgramPulse}",
  "programPulse={coachPlayerDashboardMetrics.programPulse}",
);

replaceBlock(
  "src/lib/coachOperationalDashboard.js",
  "Coach player metrics and Program Pulse",
  "export function buildCoachPlayerDashboardMetrics(rows = []) {",
  "export function buildCoachEventDashboardRows",
  `export function buildCoachPlayerDashboardMetrics(rows = [], weeklyGoal) {
  const safeRows = safeArray(rows);
  const goal = safeNumber(weeklyGoal);
  const eligibleAthletes = safeRows.length;
  const totalGoal = goal > 0 ? goal * eligibleAthletes : 0;
  const creditedMakes = totalGoal ? safeRows.reduce((total, row) => total + Math.min(Math.max(0, safeNumber(row.weeklyMakes)), goal), 0) : 0;
  const value = totalGoal ? Math.round((creditedMakes / totalGoal) * 100) : null;
  return {
    total: eligibleAthletes,
    active: safeRows.filter((row) => row.statusKey === "active").length,
    attention: safeRows.filter((row) => row.statusKey !== "active").length,
    weeklyMakes: safeRows.reduce((total, row) => total + row.weeklyMakes, 0),
    weeklyActions: safeRows.reduce((total, row) => total + row.weeklyActivityCount, 0),
    leader: safeRows[0] || null,
    programPulse: totalGoal
      ? { available: true, value, displayValue: \`${'${value}'}%\`, detail: \`${'${Math.round(creditedMakes)}'} of ${'${Math.round(totalGoal)}'} weekly makes\`, eligibleAthletes, creditedMakes, totalGoal }
      : { available: false, value: null, displayValue: "—", detail: "No weekly goal data", eligibleAthletes, creditedMakes: 0, totalGoal: 0 },
  };
}

`,
);

replaceOnce(
  "src/components/CoachCommandCenter.jsx",
  "Unused clamp helper",
  'const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));\n',
  "",
);
replaceBlock(
  "src/components/CoachCommandCenter.jsx",
  "Program Pulse panel",
  "function ProgramPulsePanel({ model, onOpen }) {",
  "function LiveActivityPanel",
  `function ProgramPulsePanel({ model, onOpen }) {
  const available = Boolean(model?.available);
  return <article className="mcSection mcTeamHealth" aria-labelledby="mc-program-pulse-heading" data-testid="coach-program-pulse"><div className="mcSectionHead"><span><small>Weekly standard</small><h2 id="mc-program-pulse-heading">Program Pulse</h2></span><strong className="mcHealthScore">{model?.displayValue || "—"}</strong></div><div className="mcHealthBar" aria-hidden="true"><span style={{ width: \`${'${available ? model?.value : 0}'}%\` }} /></div><div className="mcAllClear"><div><strong>{available ? "Weekly goal progress" : "Goal data unavailable"}</strong><small>{model?.detail || "No weekly goal data"}</small></div></div>{onOpen ? <button type="button" className="mcTextLink" onClick={onOpen}>Review weekly progress <Icon name="arrow" size={15} /></button> : null}</article>;
}
`,
);
replaceOnce(
  "src/components/CoachCommandCenter.jsx",
  "Production mobile authority marker",
  'data-mobile-product-reset="phase-3"',
  'data-mobile-product-reset="phase-1"',
);

write("tests/coach-program-pulse.test.mjs", `import test from "node:test";
import assert from "node:assert/strict";
import { buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows } from "../src/lib/coachOperationalDashboard.js";

const roster = [
  { email: "ava@example.com", name: "Ava" },
  { email: "jordan@example.com", name: "Jordan" },
];
const rowsFor = (shotLogs = [], players = roster) => buildCoachPlayerDashboardRows({ players, shotLogs, weekStart: "2026-08-23" });
const pulseFor = (shotLogs = [], weeklyGoal = 500, players = roster) => buildCoachPlayerDashboardMetrics(rowsFor(shotLogs, players), weeklyGoal).programPulse;

test("Program Pulse caps each athlete at the shared Coach weekly goal", () => {
  const model = pulseFor([
    { email: "ava@example.com", made: 650, date: "2026-08-24" },
    { email: "jordan@example.com", made: 250, date: "2026-08-25" },
  ]);
  assert.deepEqual({ credited: model.creditedMakes, goal: model.totalGoal, value: model.value, display: model.displayValue }, { credited: 750, goal: 1000, value: 75, display: "75%" });
});

test("one over-goal athlete cannot compensate past 100% for another athlete", () => {
  const model = pulseFor([
    { email: "ava@example.com", made: 900, date: "2026-08-24" },
    { email: "jordan@example.com", made: 100, date: "2026-08-25" },
  ]);
  assert.equal(model.creditedMakes, 600);
  assert.equal(model.totalGoal, 1000);
  assert.equal(model.value, 60);
});

test("Program Pulse reports zero when a valid weekly goal exists but the week has no makes", () => {
  const model = pulseFor([], 500);
  assert.equal(model.available, true);
  assert.equal(model.value, 0);
  assert.equal(model.displayValue, "0%");
  assert.equal(model.totalGoal, 1000);
});

test("Program Pulse is unavailable for missing, zero, negative, or rosterless goal denominators", () => {
  const models = [pulseFor([], undefined), pulseFor([], 0), pulseFor([], -25), pulseFor([], 500, [])];
  for (const model of models) {
    assert.equal(model.available, false);
    assert.equal(model.value, null);
    assert.equal(model.displayValue, "—");
    assert.equal(model.detail, "No weekly goal data");
  }
});

test("out-of-week activity does not inflate Program Pulse", () => {
  const model = pulseFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "ava@example.com", made: 500, date: "2026-08-16" },
  ], 400);
  assert.equal(model.creditedMakes, 100);
  assert.equal(model.totalGoal, 800);
  assert.equal(model.value, 13);
});

test("non-roster activity does not inflate Program Pulse", () => {
  const model = pulseFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "not-on-roster@example.com", made: 999, date: "2026-08-25" },
  ], 400);
  assert.equal(model.creditedMakes, 100);
  assert.equal(model.totalGoal, 800);
});

test("Coach identity never counts as an eligible Program Pulse athlete", () => {
  const players = [...roster, { email: "coach@example.com", name: "Coach", role: "coach", isCoach: true }];
  const model = pulseFor([
    { email: "ava@example.com", made: 100, date: "2026-08-23" },
    { email: "coach@example.com", made: 999, date: "2026-08-25" },
  ], 400, players);
  assert.equal(model.eligibleAthletes, 2);
  assert.equal(model.creditedMakes, 100);
  assert.equal(model.totalGoal, 800);
});
`);

write("tests/phase3-coach-home-scope.test.mjs", `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const commandSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

test("Phase 3 Coach Home derives Program Pulse inside the existing Coach player metrics pipeline", () => {
  assert.doesNotMatch(appSource, /buildCoachProgramPulse|const coachProgramPulse=useMemo/);
  assert.match(appSource, /buildCoachPlayerDashboardMetrics\\(coachPlayerDashboardRows,persistedCoachPriorities\\?\\.weeklyMakesTarget\\)/);
  assert.match(appSource, /programPulse=\\{coachPlayerDashboardMetrics\\.programPulse\\}/);
  assert.match(commandSource, /data-testid="coach-program-pulse"/);
  assert.match(commandSource, /data-testid="coach-athlete-attention"/);
  assert.match(commandSource, /data-testid="coach-upcoming-event"/);
  assert.match(commandSource, /Recent Activity/);
});

test("Phase 3 Coach Home keeps the established production authority marker", () => {
  assert.match(commandSource, /data-mobile-product-reset="phase-1"/);
  assert.doesNotMatch(commandSource, /data-mobile-product-reset="phase-3"/);
});

test("Phase 3 Coach Home does not disguise activity rate as Program Pulse", () => {
  assert.doesNotMatch(commandSource, /Team pulse/);
  assert.doesNotMatch(commandSource, /activeRate/);
  assert.match(commandSource, /<small>Active<\\/small>/);
  assert.match(commandSource, /programPulse = null/);
});
`);

rmSync(new URL("../scripts/apply-phase3-coach-home-finish.mjs", import.meta.url));
rmSync(new URL("../.github/workflows/phase3-coach-home-finish.yml", import.meta.url));
