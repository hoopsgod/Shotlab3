import { readFileSync, writeFileSync } from "node:fs";

function patch(path, before, after) {
  const source = readFileSync(path, "utf8");
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Expert app review anchor missing in ${path}`);
  writeFileSync(path, source.replace(before, after));
}

function appendOnce(path, marker, content) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  writeFileSync(path, `${source.trimEnd()}\n\n${content.trim()}\n`);
}

patch("src/main.jsx",
  "import { verifySupabaseSchema } from './lib/supabaseSchemaVerification.js'\n",
  "import { verifySupabaseSchema } from './lib/supabaseSchemaVerification.js'\nimport { installExpertVisualPolish } from './lib/expertVisualPolish.js'\nimport './styles/ExpertVisualPolish.css'\n");
patch("src/main.jsx",
  "markBoot('main_executed')\nregisterRuntimeListeners()\n",
  "markBoot('main_executed')\nregisterRuntimeListeners()\ninstallExpertVisualPolish()\n");

patch("src/components/CoachInteractiveDashboards.jsx",
  "? `${pluralize(noActivityRows.length, \"player\")} have no recorded activity and ${pluralize(followUpRows.length, \"player\")} were active previously but not this week.`",
  "? `${pluralize(noActivityRows.length, \"player\")} ${noActivityRows.length === 1 ? \"has\" : \"have\"} no recorded activity and ${pluralize(followUpRows.length, \"player\")} ${followUpRows.length === 1 ? \"was\" : \"were\"} active previously but not this week.`");

patch("src/components/CoachInteractiveDashboards.jsx",
  "{ key: \"all\", label: \"Roster\", value: metrics.total, detail: \"Active team players\" },\n    { key: \"active\", label: \"Active This Week\", value: metrics.active, detail: `${activeRate}% of roster`, tone: \"positive\" },\n    { key: \"attention\", label: \"Needs Attention\", value: metrics.attention, detail: noActivityRows.length ? `${noActivityRows.length} with no activity` : \"No current-week activity\", tone: \"attention\" },\n    { key: \"leaders\", label: \"Weekly Makes\", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: \"info\" },",
  "{ key: \"all\", label: \"Roster\", value: metrics.total, detail: \"Active team players\", evidence: rows.slice(0, 8).map((row) => row.engagementScore || 0), evidenceLabel: \"Roster engagement distribution\" },\n    { key: \"active\", label: \"Active This Week\", value: metrics.active, detail: `${activeRate}% of roster`, tone: \"positive\", evidence: rows.slice(0, 8).map((row) => row.statusKey === \"active\" ? 100 : row.statusKey === \"attention\" ? 45 : 8), evidenceLabel: \"Current activity distribution\" },\n    { key: \"attention\", label: \"Needs Attention\", value: metrics.attention, detail: noActivityRows.length ? `${noActivityRows.length} with no activity` : \"No current-week activity\", tone: \"attention\", evidence: rows.slice(0, 8).map((row) => row.statusKey === \"new\" ? 100 : row.statusKey === \"attention\" ? 65 : 10), evidenceLabel: \"Attention-risk distribution\" },\n    { key: \"leaders\", label: \"Weekly Makes\", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: \"info\", evidence: rows.slice(0, 8).map((row) => row.weeklyMakes || 0), evidenceLabel: \"Weekly makes distribution\" },");

const primitivePath = "src/components/CoachDashboardPrimitives.jsx";
let primitives = readFileSync(primitivePath, "utf8");
if (!primitives.includes("function MetricEvidenceSparkline")) {
  const anchor = 'const cx = (...values) => values.filter(Boolean).join(" ");\n';
  const helper = `\nfunction MetricEvidenceSparkline({ values = [], label = \"Metric evidence\" }) {\n  const points = values.map(Number).filter(Number.isFinite).slice(-10);\n  if (points.length < 2) return null;\n  const min = Math.min(...points);\n  const max = Math.max(...points);\n  const span = Math.max(max - min, 1);\n  const path = points.map((value, index) => {\n    const x = (index / Math.max(points.length - 1, 1)) * 100;\n    const y = 28 - ((value - min) / span) * 24;\n    return \`\${index === 0 ? \"M\" : \"L\"}\${x.toFixed(2)} \${y.toFixed(2)}\`;\n  }).join(\" \" );\n  return <svg className={styles.metricSparkline} viewBox=\"0 0 100 32\" role=\"img\" aria-label={label} preserveAspectRatio=\"none\"><path className={styles.metricSparklineTrack} d=\"M0 28 L100 28\" /><path className={styles.metricSparklinePath} d={path} /></svg>;\n}\n`;
  if (!primitives.includes(anchor)) throw new Error("Metric sparkline anchor missing");
  primitives = primitives.replace(anchor, `${anchor}${helper}`);
}
const detailAnchor = "{item.detail ? <span className={styles.metricDetail}>{item.detail}</span> : null}";
const detailReplacement = "{item.detail ? <span className={styles.metricDetail}>{item.detail}</span> : null}\n            {item.evidence?.length ? <MetricEvidenceSparkline values={item.evidence} label={item.evidenceLabel || `${item.label} evidence`} /> : null}";
if (!primitives.includes(detailReplacement)) {
  if (!primitives.includes(detailAnchor)) throw new Error("Metric evidence render anchor missing");
  primitives = primitives.replace(detailAnchor, detailReplacement);
}
writeFileSync(primitivePath, primitives);

appendOnce("src/components/CoachDashboardPrimitives.module.css", ".metricSparkline {", `
.metricSparkline { width: 100%; height: 32px; margin-top: auto; overflow: visible; }
.metricSparklineTrack { fill: none; stroke: rgba(255,255,255,.18); stroke-width: 1; }
.metricSparklinePath { fill: none; stroke: currentColor; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.tone_positive .metricSparklinePath { color: var(--semantic-positive, #62d98b); }
.tone_attention .metricSparklinePath { color: var(--semantic-warning, #ffbd66); }
.tone_info .metricSparklinePath { color: var(--semantic-info, #78d7ff); }
.progressTrack { min-height: 8px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.1) !important; }
.progressTrack > span { min-height: 100%; }
`);

appendOnce("src/styles/ExpertVisualPolish.css", "/* coach-live-activity-release-lock */", `
/* coach-live-activity-release-lock */
html body [data-testid="coach-live-activity"],
html body.mission-control-active [data-testid="coach-live-activity"] {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  max-height: none !important;
  overflow: visible !important;
}
`);

patch(
  "tests/e2e/coach-player-invitation.spec.mjs",
  `async function enterCoachPlayers(page) {\n  await page.goto("/");\n  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });\n  const visiblePlayers = page.locator('button:visible').filter({ hasText: /^Players$/ }).first();\n  await expect(demoCoach.or(visiblePlayers).first()).toBeVisible({ timeout: 15_000 });\n  if (await demoCoach.isVisible()) await demoCoach.click();\n  await expect(visiblePlayers).toBeVisible({ timeout: 15_000 });\n  await visiblePlayers.click();\n}`,
  `async function enterCoachPlayers(page) {\n  await page.goto("/");\n  const dock = page.getByTestId("mobile-navigation-dock");\n  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });\n  await expect(dock.or(demoCoach).first()).toBeVisible({ timeout: 15_000 });\n  if (await demoCoach.isVisible()) await demoCoach.click();\n  await expect(dock).toBeVisible({ timeout: 15_000 });\n  const players = dock.getByRole("button", { name: "Players", exact: true });\n  await expect(players).toBeVisible();\n  await players.click();\n}`,
);
