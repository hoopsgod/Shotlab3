const MAX_CSV_CHARS = 2_000_000;
const MAX_ROWS = 1_000;
const MAX_COLUMNS = 100;

const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const normalize = (value) => clean(value, 500).toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();
const compact = (value) => normalize(value).replace(/\s+/g, "");
const normalizeEmail = (value) => clean(value, 320).toLowerCase();
const normalizeJersey = (value) => clean(value, 32).replace(/^#/, "").trim().toLowerCase();
const normalizeName = (value) => normalize(value).replace(/\s+/g, " ");

const EMAIL_HEADERS = new Set(["email", "playeremail", "athleteemail"]);
const NAME_HEADERS = new Set(["name", "player", "playername", "athlete", "athletename"]);
const FIRST_HEADERS = new Set(["firstname", "first", "playerfirst", "athletefirst"]);
const LAST_HEADERS = new Set(["lastname", "last", "playerlast", "athletelast"]);
const JERSEY_HEADERS = new Set(["jersey", "jerseynumber", "number", "no", "#", "playernumber"]);
const DATE_HEADERS = new Set(["date", "gamedate", "game", "eventdate"]);
const OPPONENT_HEADERS = new Set(["opponent", "opp", "versus", "vs"]);
const CONTEXT_HEADERS = new Set(["team", "season", "position", "pos", "class", "grade", "starter", "starts", "games", "gamesplayed", "gp"]);

export function parseCsvText(csvText = "") {
  const text = String(csvText ?? "").replace(/^\uFEFF/, "");
  if (!text.trim()) return { ok: false, error: "csv_empty" };
  if (text.length > MAX_CSV_CHARS) return { ok: false, error: "csv_too_large" };

  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ",") { row.push(field); field = ""; continue; }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) return { ok: false, error: "csv_too_many_rows" };
      continue;
    }
    field += char;
  }
  if (quoted) return { ok: false, error: "csv_unclosed_quote" };
  row.push(field);
  if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  if (rows.length < 2) return { ok: false, error: "csv_requires_header_and_rows" };

  const headers = rows[0].map((value, index) => clean(value, 160) || `Column ${index + 1}`);
  if (headers.length > MAX_COLUMNS) return { ok: false, error: "csv_too_many_columns" };
  const normalizedHeaders = headers.map(compact);
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) return { ok: false, error: "csv_duplicate_headers" };

  const records = rows.slice(1).map((cells, rowIndex) => {
    const values = {};
    headers.forEach((header, index) => { values[header] = clean(cells[index] ?? "", 4000); });
    return { rowNumber: rowIndex + 2, values };
  });
  return { ok: true, headers, records };
}

function findHeader(headers, aliases) {
  return headers.find((header) => aliases.has(compact(header))) || "";
}

export function detectCsvColumns(headers = []) {
  const email = findHeader(headers, EMAIL_HEADERS);
  const name = findHeader(headers, NAME_HEADERS);
  const first = findHeader(headers, FIRST_HEADERS);
  const last = findHeader(headers, LAST_HEADERS);
  const jersey = findHeader(headers, JERSEY_HEADERS);
  const gameDate = findHeader(headers, DATE_HEADERS);
  const opponent = findHeader(headers, OPPONENT_HEADERS);
  const reserved = new Set([email, name, first, last, jersey, gameDate, opponent].filter(Boolean));
  for (const header of headers) if (CONTEXT_HEADERS.has(compact(header))) reserved.add(header);
  return { email, name, first, last, jersey, gameDate, opponent, reserved };
}

export function parseStatNumber(value) {
  const raw = clean(value, 120);
  if (!raw) return null;
  const normalizedValue = raw.replace(/,/g, "").replace(/%$/, "").replace(/^\((.*)\)$/, "-$1");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalizedValue)) return null;
  const number = Number(normalizedValue);
  return Number.isFinite(number) && Math.abs(number) <= 1_000_000_000 ? number : null;
}

export function inferStatDefinition(header = "") {
  const label = clean(header, 160);
  const key = compact(label).replace(/%/g, "pct").slice(0, 80) || "stat";
  const lower = normalize(label);
  const percentage = /%|pct|percentage|percent/.test(lower);
  const average = percentage || /\bavg\b|average|per game|pg$/.test(lower);
  return {
    key,
    label,
    aggregation: average ? "average" : "sum",
    unit: percentage ? "%" : "number",
  };
}

function recordIdentity(record, columns) {
  const values = record?.values || {};
  const email = columns.email ? normalizeEmail(values[columns.email]) : "";
  let name = columns.name ? normalizeName(values[columns.name]) : "";
  if (!name && (columns.first || columns.last)) {
    name = normalizeName([columns.first ? values[columns.first] : "", columns.last ? values[columns.last] : ""].filter(Boolean).join(" "));
  }
  const jersey = columns.jersey ? normalizeJersey(values[columns.jersey]) : "";
  return { email, name, jersey };
}

function rosterEntry(row = {}) {
  const email = normalizeEmail(row.email ?? row.player_email ?? row.playerEmail ?? row.invited_email);
  const first = clean(row.first_name ?? row.firstName, 160);
  const last = clean(row.last_name ?? row.lastName, 160);
  const name = normalizeName(row.name ?? row.player_name ?? row.playerName ?? [first, last].filter(Boolean).join(" "));
  const jersey = normalizeJersey(row.jersey_number ?? row.jerseyNumber ?? row.jersey);
  const playerId = clean(row.player_id ?? row.playerId ?? row.user_id ?? row.userId ?? row.id ?? email, 320);
  return { email, name, jersey, playerId, displayName: clean(row.name ?? [first, last].filter(Boolean).join(" ") ?? email, 320) || email || playerId };
}

export function buildRosterIndex(roster = []) {
  const entries = roster.map(rosterEntry).filter((row) => row.playerId || row.email || row.name);
  const add = (map, key, value) => {
    if (!key) return;
    const list = map.get(key) || [];
    if (!list.some((row) => row.playerId === value.playerId && row.email === value.email)) list.push(value);
    map.set(key, list);
  };
  const byEmail = new Map(), byName = new Map(), byJersey = new Map();
  for (const entry of entries) {
    add(byEmail, entry.email, entry);
    add(byName, entry.name, entry);
    add(byJersey, entry.jersey, entry);
  }
  return { entries, byEmail, byName, byJersey };
}

function intersectCandidates(candidateGroups = []) {
  const nonEmpty = candidateGroups.filter((group) => Array.isArray(group) && group.length);
  if (!nonEmpty.length) return [];
  let result = [...nonEmpty[0]];
  for (const group of nonEmpty.slice(1)) {
    result = result.filter((candidate) => group.some((other) => other.playerId === candidate.playerId && other.email === candidate.email));
  }
  return result;
}

export function matchCsvRecordToRoster(record, columns, rosterIndex) {
  const identity = recordIdentity(record, columns);
  const groups = [];
  if (identity.email) groups.push(rosterIndex.byEmail.get(identity.email) || []);
  if (identity.name) groups.push(rosterIndex.byName.get(identity.name) || []);
  if (identity.jersey) groups.push(rosterIndex.byJersey.get(identity.jersey) || []);
  let candidates = intersectCandidates(groups);
  if (!candidates.length && groups.length === 1) candidates = groups[0];
  if (candidates.length === 1) return { status: "matched", identity, player: candidates[0] };
  return { status: candidates.length > 1 ? "ambiguous" : "unmatched", identity, candidates };
}

export function normalizeDate(value) {
  const raw = clean(value, 80);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function buildGameStatCsvPreview({ csvText = "", roster = [], importKind = "season_total" } = {}) {
  const parsed = parseCsvText(csvText);
  if (!parsed.ok) return parsed;
  const columns = detectCsvColumns(parsed.headers);
  if (!columns.email && !columns.name && !(columns.first || columns.last) && !columns.jersey) {
    return { ok: false, error: "player_identity_column_required", headers: parsed.headers };
  }
  if (importKind === "game" && !columns.gameDate) return { ok: false, error: "game_date_column_required", headers: parsed.headers };

  const rosterIndex = buildRosterIndex(roster);
  const candidateStatHeaders = parsed.headers.filter((header) => !columns.reserved.has(header));
  const statHeaders = candidateStatHeaders.filter((header) => parsed.records.some((record) => parseStatNumber(record.values[header]) !== null));
  if (!statHeaders.length) return { ok: false, error: "numeric_stat_columns_required", headers: parsed.headers };
  const statDefinitions = statHeaders.map(inferStatDefinition);

  const rows = parsed.records.map((record) => {
    const match = matchCsvRecordToRoster(record, columns, rosterIndex);
    const gameDate = columns.gameDate ? normalizeDate(record.values[columns.gameDate]) : "";
    const opponent = columns.opponent ? clean(record.values[columns.opponent], 160) : "";
    const stats = statDefinitions.map((definition) => ({ ...definition, value: parseStatNumber(record.values[definition.label]) })).filter((stat) => stat.value !== null);
    return { rowNumber: record.rowNumber, match, gameDate, opponent, stats };
  }).filter((row) => row.stats.length);

  const unmatched = rows.filter((row) => row.match.status === "unmatched");
  const ambiguous = rows.filter((row) => row.match.status === "ambiguous");
  const invalidDates = importKind === "game" ? rows.filter((row) => !row.gameDate) : [];
  const matched = rows.filter((row) => row.match.status === "matched" && (importKind !== "game" || row.gameDate));
  return {
    ok: true,
    importKind,
    headers: parsed.headers,
    columns: { email: columns.email, name: columns.name, first: columns.first, last: columns.last, jersey: columns.jersey, gameDate: columns.gameDate, opponent: columns.opponent },
    statDefinitions,
    totalRows: rows.length,
    matchedRows: matched.length,
    unmatchedRows: unmatched.map((row) => ({ rowNumber: row.rowNumber, identity: row.match.identity })),
    ambiguousRows: ambiguous.map((row) => ({ rowNumber: row.rowNumber, identity: row.match.identity, candidateCount: row.match.candidates.length })),
    invalidDateRows: invalidDates.map((row) => row.rowNumber),
    rows,
    canCommit: rows.length > 0 && unmatched.length === 0 && ambiguous.length === 0 && invalidDates.length === 0,
  };
}

export const GAME_STAT_CSV_LIMITS = Object.freeze({ maxChars: MAX_CSV_CHARS, maxRows: MAX_ROWS, maxColumns: MAX_COLUMNS });
