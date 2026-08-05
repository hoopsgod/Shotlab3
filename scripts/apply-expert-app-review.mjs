import { readFileSync, writeFileSync } from "node:fs";

function patch(path, before, after) {
  const source = readFileSync(path, "utf8");
  if (source.includes(after)) return false;
  if (!source.includes(before)) throw new Error(`Expert app review anchor missing in ${path}`);
  writeFileSync(path, source.replace(before, after));
  return true;
}

function appendOnce(path, marker, content) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return false;
  writeFileSync(path, `${source.trimEnd()}\n\n${content.trim()}\n`);
  return true;
}

patch(
  "src/main.jsx",
  "import { verifySupabaseSchema } from './lib/supabaseSchemaVerification.js'\n",
  "import { verifySupabaseSchema } from './lib/supabaseSchemaVerification.js'\nimport { installExpertVisualPolish } from './lib/expertVisualPolish.js'\nimport './styles/ExpertVisualPolish.css'\n",
);

patch(
  "src/main.jsx",
  "markBoot('main_executed')\nregisterRuntimeListeners()\n",
  "markBoot('main_executed')\nregisterRuntimeListeners()\ninstallExpertVisualPolish()\n",
);

patch(
  "src/components/CoachInteractiveDashboards.jsx",
  "? `${pluralize(noActivityRows.length, \"player\")} have no recorded activity and ${pluralize(followUpRows.length, \"player\")} were active previously but not this week.`",
  "? `${pluralize(noActivityRows.length, \"player\")} ${noActivityRows.length === 1 ? \"has\" : \"have\"} no recorded activity and ${pluralize(followUpRows.length, \"player\")} ${followUpRows.length === 1 ? \"was\" : \"were\"} active previously but not this week.`",
);

patch(
  "src/components/CoachInteractiveDashboards.jsx",
  "{ key: \"all\", label: \"Roster\", value: metrics.total, detail: \"Active team players\" },\n    { key: \"active\", label: \"Active This Week\", value: metrics.active, detail: `${activeRate}% of roster`, tone: \"positive\" },\n    { key: \"attention\", label: \"Needs Attention\", value: metrics.attention, detail: noActivityRows.length ? `${noActivityRows.length} with no activity` : \"No current-week activity\", tone: \"attention\" },\n    { key: \"leaders\", label: \"Weekly Makes\", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: \"info\" },",
  "{ key: \"all\", label: \"Roster\", value: metrics.total, detail: \"Active team players\", evidence: rows.slice(0, 8).map((row) => row.engagementScore || 0), evidenceLabel: \"Roster engagement distribution\" },\n    { key: \"active\", label: \"Active This Week\", value: metrics.active, detail: `${activeRate}% of roster`, tone: \"positive\", evidence: rows.slice(0, 8).map((row) => row.statusKey === \"active\" ? 100 : row.statusKey === \"attention\" ? 45 : 8), evidenceLabel: \"Current activity distribution\" },\n    { key: \"attention\", label: \"Needs Attention\", value: metrics.attention, detail: noActivityRows.length ? `${noActivityRows.length} with no activity` : \"No current-week activity\", tone: \"attention\", evidence: rows.slice(0, 8).map((row) => row.statusKey === \"new\" ? 100 : row.statusKey === \"attention\" ? 65 : 10), evidenceLabel: \"Attention-risk distribution\" },\n    { key: \"leaders\", label: \"Weekly Makes\", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: \"info\", evidence: rows.slice(0, 8).map((row) => row.weeklyMakes || 0), evidenceLabel: \"Weekly makes distribution\" },",
);

patch(
  "src/components/CoachInteractiveDashboards.jsx",
  "{ key: \"upcoming\", label: \"Upcoming\", value: metrics.upcoming, detail: next ? `Next: ${formatScheduleDate(next.date)}` : \"No event scheduled\", tone: \"info\" },\n    { key: \"gaps\", label: \"Missing RSVPs\", value: metrics.missing, detail: `${gapEvents.length} affected events`, tone: \"attention\" },\n    { key: \"all\", label: \"Response Rate\", value: `${metrics.responseRate}%`, detail: `${metrics.confirmed} confirmations`, tone: \"positive\" },\n    { key: \"past\", label: \"Completed\", value: metrics.past, detail: `${metrics.total} total events` },",
  "{ key: \"upcoming\", label: \"Upcoming\", value: metrics.upcoming, detail: next ? `Next: ${formatScheduleDate(next.date)}` : \"No event scheduled\", tone: \"info\", evidence: rows.slice(0, 8).map((row) => row.confirmed || 0), evidenceLabel: \"Upcoming confirmations by event\" },\n    { key: \"gaps\", label: \"Missing RSVPs\", value: metrics.missing, detail: `${gapEvents.length} affected events`, tone: \"attention\", evidence: rows.slice(0, 8).map((row) => row.missing || 0), evidenceLabel: \"Missing responses by event\" },\n    { key: \"all\", label: \"Response Rate\", value: `${metrics.responseRate}%`, detail: `${metrics.confirmed} confirmations`, tone: \"positive\", evidence: rows.slice(0, 8).map((row) => row.responseRate || (row.confirmed && row.missing !== undefined ? Math.round((row.confirmed / Math.max(row.confirmed + row.missing, 1)) * 100) : 0)), evidenceLabel: \"Response rate by event\" },\n    { key: \"past\", label: \"Completed\", value: metrics.past, detail: `${metrics.total} total events`, evidence: rows.slice(0, 8).map((row, index) => row.isPast ? index + 1 : 0), evidenceLabel: \"Completed event distribution\" },",
);

patch(
  "src/components/CoachDashboardPrimitives.jsx",
  "const cx = (...values) => values.filter(Boolean).join(\" \";",
  "const cx = (...values) => values.filter(Boolean).join(\" \";",
);

patch(
  "src/components/CoachDashboardPrimitives.jsx",
  "const cx = (...values) => values.filter(Boolean).join(\" \" );",
  "const cx = (...values) => values.filter(Boolean).join(\" \" );",
);

const primitivePath = "src/components/CoachDashboardPrimitives.jsx";
let primitives = readFileSync(primitivePath, "utf8");
if (!primitives.includes("function MetricEvidenceSparkline")) {
  const anchor = 'const cx = (...values) => values.filter(Boolean).join(" ");\n';
  if (!primitives.includes(anchor)) throw new Error("Metric sparkline anchor missing");
  const helper = `\nfunction MetricEvidenceSparkline({ values = [], label = \"Metric evidence\" }) {\n  const points = values.map(Number).filter(Number.isFinite).slice(-10);\n  if (points.length < 2) return null;\n  const min = Math.min(...points);\n  const max = Math.max(...points);\n  const span = Math.max(max - min, 1);\n  const path = points.map((value, index) => {\n    const x = (index / Math.max(points.length - 1, 1)) * 100;\n    const y = 28 - ((value - min) / span) * 24;\n    return \`\${index === 0 ? \"M\" : \"L\"}\${x.toFixed(2)} \${y.toFixed(2)}\`;\n  }).join(\" \" );\n  return (\n    <svg className={styles.metricSparkline} viewBox=\"0 0 100 32\" role=\"img\" aria-label={label} preserveAspectRatio=\"none\">\n      <path className={styles.metricSparklineTrack} d=\"M0 28 L100 28\" />\n      <path className={styles.metricSparklinePath} d={path} />\n    </svg>\n  );\n}\n`;
  primitives = primitives.replace(anchor, `${anchor}${helper}`);
}
const detailAnchor = "{item.detail ? <span className={styles.metricDetail}>{item.detail}</span> : null}";
const detailReplacement = "{item.detail ? <span className={styles.metricDetail}>{item.detail}</span> : null}\n            {item.evidence?.length ? <MetricEvidenceSparkline values={item.evidence} label={item.evidenceLabel || `${item.label} evidence`} /> : null}";
if (!primitives.includes(detailReplacement)) {
  if (!primitives.includes(detailAnchor)) throw new Error("Metric evidence render anchor missing");
  primitives = primitives.replace(detailAnchor, detailReplacement);
}
writeFileSync(primitivePath, primitives);

appendOnce(
  "src/components/CoachDashboardPrimitives.module.css",
  ".metricSparkline {",
  `.metricSparkline {\n  width: 100%;\n  height: 32px;\n  margin-top: auto;\n  overflow: visible;\n}\n.metricSparklineTrack {\n  fill: none;\n  stroke: rgba(255, 255, 255, .12);\n  stroke-width: 1;\n}\n.metricSparklinePath {\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2.25;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  vector-effect: non-scaling-stroke;\n}\n.tone_positive .metricSparklinePath { color: var(--semantic-positive, #62d98b); }\n.tone_attention .metricSparklinePath { color: var(--semantic-warning, #ffbd66); }\n.tone_info .metricSparklinePath { color: var(--semantic-info, #78d7ff); }\n.progressTrack {\n  min-height: 8px;\n  border: 1px solid rgba(255, 255, 255, .2);\n  background: rgba(255, 255, 255, .1) !important;\n}\n.progressTrack > span { min-height: 100%; }`,
);
