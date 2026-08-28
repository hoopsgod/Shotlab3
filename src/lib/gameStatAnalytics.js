const toArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const number = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; };

const playerKey = (row = {}) => lower(row.player_email ?? row.playerEmail ?? row.email) || clean(row.player_id ?? row.playerId) || `name:${lower(row.player_name ?? row.playerName ?? row.name)}`;
const seasonKey = (row = {}) => clean(row.season_id ?? row.seasonId) || `label:${lower(row.season_label ?? row.seasonLabel ?? "unassigned")}`;
const statKey = (row = {}) => clean(row.stat_key ?? row.statKey);
const importedAt = (row = {}) => String(row.imported_at ?? row.importedAt ?? row.created_at ?? row.createdAt ?? "");
const snapshotOrder = (row = {}) => `${String(row.as_of_date ?? row.asOfDate ?? "").padEnd(24, "0")}::${importedAt(row)}`;
const importKind = (row = {}) => clean(row.import_kind ?? row.importKind).toLowerCase() || "season_total";

export function selectLatestSeasonSnapshots(rows = []) {
  const latest = new Map();
  for (const row of toArray(rows)) {
    if (importKind(row) !== "season_total") continue;
    const value = number(row.stat_value ?? row.statValue ?? row.value);
    if (value === null || !statKey(row) || !playerKey(row)) continue;
    const key = [seasonKey(row), playerKey(row), statKey(row)].join("::");
    const previous = latest.get(key);
    if (!previous || snapshotOrder(row) >= snapshotOrder(previous)) latest.set(key, row);
  }
  return [...latest.values()];
}

export function buildCanonicalStatRows(rows = []) {
  const gameRows = toArray(rows).filter((row) => importKind(row) === "game" && number(row.stat_value ?? row.statValue ?? row.value) !== null && statKey(row));
  return [...gameRows, ...selectLatestSeasonSnapshots(rows)];
}

export function aggregateStatValues(values = [], aggregation = "sum") {
  const numbers = toArray(values).map(number).filter((value) => value !== null);
  if (!numbers.length) return null;
  if (aggregation === "average") return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (aggregation === "max") return Math.max(...numbers);
  if (aggregation === "min") return Math.min(...numbers);
  return numbers.reduce((sum, value) => sum + value, 0);
}

function metricDefinition(row = {}) {
  return {
    key: statKey(row),
    label: clean(row.stat_label ?? row.statLabel ?? statKey(row)),
    aggregation: clean(row.aggregation).toLowerCase() || "sum",
    unit: clean(row.unit) || "number",
  };
}

function currentSeasonPredicate(rows, currentSeasonId = "", currentSeasonLabel = "") {
  const id = clean(currentSeasonId);
  if (id) return (row) => clean(row.season_id ?? row.seasonId) === id;
  const requestedLabel = lower(currentSeasonLabel);
  if (requestedLabel) return (row) => lower(row.season_label ?? row.seasonLabel) === requestedLabel;
  const newest = [...toArray(rows)].sort((a, b) => importedAt(b).localeCompare(importedAt(a)))[0];
  const newestSeason = newest ? seasonKey(newest) : "";
  return (row) => seasonKey(row) === newestSeason;
}

function groupPlayerMetric(rows = []) {
  const groups = new Map();
  for (const row of toArray(rows)) {
    const pKey = playerKey(row);
    const sKey = statKey(row);
    const value = number(row.stat_value ?? row.statValue ?? row.value);
    if (!pKey || !sKey || value === null) continue;
    const key = `${pKey}::${sKey}`;
    if (!groups.has(key)) groups.set(key, { playerKey: pKey, definition: metricDefinition(row), rows: [], player: {
      playerId: clean(row.player_id ?? row.playerId),
      email: lower(row.player_email ?? row.playerEmail ?? row.email),
      name: clean(row.player_name ?? row.playerName ?? row.name) || lower(row.player_email ?? row.email) || clean(row.player_id ?? row.playerId),
    } });
    groups.get(key).rows.push(row);
  }
  return groups;
}

function aggregateGroups(rows = []) {
  const result = [];
  for (const group of groupPlayerMetric(rows).values()) {
    const values = group.rows.map((row) => row.stat_value ?? row.statValue ?? row.value);
    const value = aggregateStatValues(values, group.definition.aggregation);
    if (value === null) continue;
    result.push({ ...group.player, statKey: group.definition.key, statLabel: group.definition.label, aggregation: group.definition.aggregation, unit: group.definition.unit, value });
  }
  return result;
}

function buildLeaderboards(aggregates = [], hiddenIdentityKeys = new Set()) {
  const metrics = new Map();
  for (const row of aggregates) {
    const hidden = hiddenIdentityKeys.has(lower(row.email)) || hiddenIdentityKeys.has(clean(row.playerId));
    if (hidden) continue;
    if (!metrics.has(row.statKey)) metrics.set(row.statKey, { key: row.statKey, label: row.statLabel, aggregation: row.aggregation, unit: row.unit, rows: [] });
    metrics.get(row.statKey).rows.push(row);
  }
  return [...metrics.values()].map((metric) => ({
    ...metric,
    rows: metric.rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).map((row, index) => ({ ...row, rank: index + 1 })),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

function buildPersonal(aggregates = [], viewerEmail = "", viewerPlayerId = "") {
  const email = lower(viewerEmail);
  const id = clean(viewerPlayerId);
  return aggregates.filter((row) => (email && lower(row.email) === email) || (id && clean(row.playerId) === id)).sort((a, b) => a.statLabel.localeCompare(b.statLabel));
}

export function buildGameStatIntelligence({ rows = [], currentSeasonId = "", currentSeasonLabel = "", viewerEmail = "", viewerPlayerId = "", hiddenIdentityKeys = [] } = {}) {
  const canonical = buildCanonicalStatRows(rows);
  const isCurrent = currentSeasonPredicate(canonical, currentSeasonId, currentSeasonLabel);
  const currentRows = canonical.filter(isCurrent);
  const currentAggregates = aggregateGroups(currentRows);
  const programAggregates = aggregateGroups(canonical);
  const hidden = hiddenIdentityKeys instanceof Set ? hiddenIdentityKeys : new Set(toArray(hiddenIdentityKeys).map((value) => lower(value) || clean(value)).filter(Boolean));
  return {
    currentLeaderboards: buildLeaderboards(currentAggregates, hidden),
    programLeaderboards: buildLeaderboards(programAggregates, hidden),
    currentPlayerStats: buildPersonal(currentAggregates, viewerEmail, viewerPlayerId),
    programPlayerStats: buildPersonal(programAggregates, viewerEmail, viewerPlayerId),
    currentAggregates,
    programAggregates,
    canonicalRowCount: canonical.length,
  };
}

export function formatStatValue(value, unit = "number") {
  const numeric = number(value);
  if (numeric === null) return "—";
  const rounded = Math.abs(numeric % 1) < Number.EPSILON ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, "");
  return unit === "%" ? `${rounded}%` : rounded;
}
