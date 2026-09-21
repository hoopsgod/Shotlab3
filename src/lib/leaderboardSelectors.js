import { getActiveTeamPlayerIdentity } from './playerDataManagement.js';

const IDENTITY_FIELDS = ['email', 'player_email', 'playerId', 'player_id', 'userId', 'user_id', 'profileId', 'profile_id', 'id'];

const asText = (value) => String(value ?? '').trim();
const lower = (value) => asText(value).toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const rowTeamId = (row = {}) => asText(row?.teamId || row?.team_id);
const rowName = (row = {}) => asText(
  row?.player_display_name
  || row?.displayName
  || row?.name
  || row?.playerName
  || row?.player_name,
);
const rowScore = (row = {}) => Math.max(0, asNumber(
  row?.metricValue
  ?? row?.total_home_shots
  ?? row?.total_makes
  ?? row?.total
  ?? row?.score,
));
const identityKeys = (row = {}) => IDENTITY_FIELDS
  .map((field) => lower(row?.[field]))
  .filter(Boolean);

const firstIdentity = (row = {}) => identityKeys(row)[0] || '';
const isAuthoritativeRemoteRow = (row = {}) => lower(row?.leaderboard_source) === 'remote' && identityKeys(row).length > 0;

const chooseName = (...values) => values
  .map(asText)
  .find((value) => value && !['player', 'unknown player'].includes(lower(value))) || 'Player';

const stateForStatus = (status = '') => {
  const normalized = lower(status);
  if (['permission', 'forbidden', 'unauthorized'].includes(normalized)) return 'permission';
  if (['unavailable', 'not_found', 'endpoint_missing'].includes(normalized)) return 'unavailable';
  if (['missing_context', 'missing_team_context', 'team_id_required'].includes(normalized)) return 'missing_context';
  if (['loading', 'pending'].includes(normalized)) return 'loading';
  if (['refreshing', 'stale'].includes(normalized)) return 'refreshing';
  if (['error', 'failed', 'network_error'].includes(normalized)) return 'error';
  if (['success', 'ready', 'demo_local'].includes(normalized)) return 'success';
  return 'idle';
};

const buildRosterIndex = (rosterPlayers = []) => {
  const entities = new Map();
  const entityByIdentity = new Map();
  const entityIdsByName = new Map();

  asArray(rosterPlayers).forEach((player, index) => {
    const keys = identityKeys(player);
    if (!keys.length) return;
    const existingIds = [...new Set(keys.map((key) => entityByIdentity.get(key)).filter(Boolean))];
    const entityId = existingIds[0] || `roster:${index}:${keys[0]}`;
    const entity = entities.get(entityId) || { id: entityId, player, keys: new Set(), names: new Set() };
    if (!entities.has(entityId)) entities.set(entityId, entity);
    keys.forEach((key) => {
      entity.keys.add(key);
      entityByIdentity.set(key, entityId);
    });
    const name = lower(rowName(player));
    if (name) {
      entity.names.add(name);
      const names = entityIdsByName.get(name) || new Set();
      names.add(entityId);
      entityIdsByName.set(name, names);
    }
  });

  return { entities, entityByIdentity, entityIdsByName };
};

const resolveRosterMatch = (row = {}, rosterIndex) => {
  const rowKeys = identityKeys(row);
  const matchedIds = new Set(rowKeys.map((key) => rosterIndex.entityByIdentity.get(key)).filter(Boolean));
  if (matchedIds.size === 1) return rosterIndex.entities.get([...matchedIds][0]) || null;
  if (rowKeys.length > 0) return null;

  // A privacy-minimal remote response may not include a player id. A display
  // name is only a safe substitute when it identifies exactly one active roster
  // entity; duplicate names are intentionally omitted instead of guessed.
  const matchingNames = rosterIndex.entityIdsByName.get(lower(rowName(row))) || new Set();
  if (matchingNames.size !== 1) return null;
  return rosterIndex.entities.get([...matchingNames][0]) || null;
};

const withRosterIdentity = (row = {}, rosterPlayer = {}) => {
  const rosterId = asText(
    rosterPlayer?.playerId
    || rosterPlayer?.player_id
    || rosterPlayer?.userId
    || rosterPlayer?.user_id
    || rosterPlayer?.profileId
    || rosterPlayer?.profile_id
    || rosterPlayer?.id,
  );
  const rosterEmail = asText(rosterPlayer?.email || rosterPlayer?.player_email);
  return {
    ...row,
    ...(rosterId && !asText(row?.playerId || row?.player_id) ? { playerId: rosterId, player_id: rosterId } : {}),
    ...(rosterEmail && !asText(row?.email || row?.player_email) ? { email: rosterEmail } : {}),
    player_display_name: chooseName(rowName(row), rowName(rosterPlayer)),
    displayName: chooseName(rowName(row), rowName(rosterPlayer)),
  };
};

export function resolveLeaderboardDataState({
  status = 'idle',
  rows = [],
  error = '',
  teamId = '',
} = {}) {
  const safeRows = asArray(rows).filter((row) => row && typeof row === 'object');
  const requested = stateForStatus(status);
  const hasRows = safeRows.length > 0;
  const message = asText(error);

  if (!asText(teamId)) return { kind: 'missing_context', rows: safeRows, message: message || 'A team is required before rankings can load.', hasRows };
  if (requested === 'loading') return { kind: hasRows ? 'refreshing' : 'loading', rows: safeRows, message, hasRows };
  if (requested === 'refreshing') return { kind: hasRows ? 'refreshing' : 'loading', rows: safeRows, message, hasRows };
  if (['error', 'permission', 'unavailable', 'missing_context'].includes(requested)) {
    return { kind: hasRows ? 'stale' : requested, rows: safeRows, message, hasRows, failureKind: requested };
  }
  if (requested === 'success') return { kind: hasRows ? 'ready' : 'empty', rows: safeRows, message, hasRows };
  return { kind: hasRows ? 'ready' : 'loading', rows: safeRows, message, hasRows };
}

/**
 * Makes a display-safe ranking from one already-aggregated leaderboard source.
 * It deliberately chooses the strongest duplicate row instead of adding values so
 * duplicate API records cannot inflate a player's score.
 */
export function selectLeaderboardRows({
  rows = [],
  players = [],
  teamId = '',
  includeArchivedPlayers = false,
  limit,
} = {}) {
  const requestedTeamId = asText(teamId);
  const roster = getActiveTeamPlayerIdentity(asArray(players), requestedTeamId);
  const needsActiveRosterFilter = !includeArchivedPlayers && Boolean(requestedTeamId);
  const rosterIndex = buildRosterIndex(roster.players);
  const eligibleRows = asArray(rows)
    .filter((row) => row && typeof row === 'object')
    .filter((row) => !requestedTeamId || !rowTeamId(row) || rowTeamId(row) === requestedTeamId)
    .filter((row) => rowScore(row) > 0)
    .map((row) => {
      const rosterMatch = resolveRosterMatch(row, rosterIndex);
      // The signed service is authoritative for current remote team membership.
      // Local and archive projections still require a client roster match.
      if (needsActiveRosterFilter && !rosterMatch && !isAuthoritativeRemoteRow(row)) return null;
      return rosterMatch ? withRosterIdentity(row, rosterMatch.player) : row;
    })
    .filter((row) => row && identityKeys(row).length > 0);
  const byIdentity = new Map();

  for (const row of eligibleRows) {
    const keys = identityKeys(row);
    const knownKey = keys.find((key) => byIdentity.has(key));
    const primaryKey = knownKey || keys[0];
    const existing = byIdentity.get(primaryKey);
    const candidate = {
      ...row,
      player_display_name: chooseName(rowName(row), existing?.player_display_name),
      displayName: chooseName(rowName(row), existing?.displayName),
      metricValue: rowScore(row),
    };
    const selected = !existing || candidate.metricValue > existing.metricValue
      || (candidate.metricValue === existing.metricValue && candidate.player_display_name.localeCompare(existing.player_display_name) < 0)
      ? candidate
      : existing;
    byIdentity.set(primaryKey, selected);
    keys.forEach((key) => byIdentity.set(key, selected));
  }

  const uniqueRows = [...new Set(byIdentity.values())]
    .sort((left, right) => right.metricValue - left.metricValue
      || left.player_display_name.localeCompare(right.player_display_name)
      || firstIdentity(left).localeCompare(firstIdentity(right)));
  let previousScore = null;
  let previousRank = 0;
  const ranked = uniqueRows.map((row, index) => {
    const rank = previousScore === row.metricValue ? previousRank : index + 1;
    previousScore = row.metricValue;
    previousRank = rank;
    return {
      ...row,
      rank,
      total: row.metricValue,
      score: row.metricValue,
      total_home_shots: row.total_home_shots ?? row.metricValue,
    };
  });
  return Number.isFinite(limit) ? ranked.slice(0, Math.max(0, limit)) : ranked;
}

const rowMatchesCurrentUser = (row = {}, currentUser = {}, userEmail = '') => {
  if (row?.isCurrentUser === true || row?.is_current_user === true) return true;
  const currentKeys = new Set([
    userEmail,
    currentUser?.email,
    currentUser?.playerId,
    currentUser?.player_id,
    currentUser?.userId,
    currentUser?.user_id,
    currentUser?.profileId,
    currentUser?.profile_id,
    currentUser?.id,
  ].map(lower).filter(Boolean));
  return identityKeys(row).some((key) => currentKeys.has(key));
};

const dateKey = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const weekStartKey = (now) => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
};

const isCurrentWeekRow = (row = {}, now) => dateKey(row?.date || row?.session_date || row?.logged_at || row?.created_at || row?.ts) >= weekStartKey(now);

export function buildLeaderboardWeeklyActivity({
  category = 'home_shots',
  teamId = '',
  viewerRole = 'player',
  currentUser = {},
  userEmail = '',
  shotLogs = [],
  programScores = [],
  events = [],
  rsvps = [],
  scLogs = [],
  now = new Date(),
} = {}) {
  const matches = (row) => row && typeof row === 'object'
    && (!asText(teamId) || !rowTeamId(row) || rowTeamId(row) === asText(teamId))
    && (viewerRole === 'coach' || rowMatchesCurrentUser(row, currentUser, userEmail))
    && isCurrentWeekRow(row, now);
  const scopedRows = (rows) => asArray(rows).filter(matches);
  if (category === 'drill_shots') return { value: scopedRows(programScores).length, detail: 'Program entries' };
  if (category === 'event_participation') {
    const eventDateById = new Map(asArray(events).filter((event) => !asText(teamId) || !rowTeamId(event) || rowTeamId(event) === asText(teamId)).map((event) => [asText(event?.id), event?.date || event?.startDate || event?.start_date]));
    const currentWeekRsvps = asArray(rsvps).filter((row) => matches({ ...row, date: eventDateById.get(asText(row?.eventId || row?.event_id)) || row?.date || row?.created_at }));
    return { value: currentWeekRsvps.length, detail: 'Event responses' };
  }
  if (category === 'strength_conditioning_participation') return { value: scopedRows(scLogs).length, detail: 'Completed logs' };
  return {
    value: scopedRows(shotLogs).reduce((total, row) => total + Math.max(0, asNumber(row?.made)), 0),
    detail: 'Home-shot makes',
  };
}

export function buildLeaderboardDecisionSurface({
  rows = [],
  players = [],
  teamId = '',
  viewerRole = 'player',
  currentUser = {},
  userEmail = '',
  shotLogs = [],
  weeklyActivity = null,
  now = new Date(),
  includeArchivedPlayers = false,
} = {}) {
  const rankedRows = selectLeaderboardRows({ rows, players, teamId, includeArchivedPlayers });
  const currentRow = rankedRows.find((row) => rowMatchesCurrentUser(row, currentUser, userEmail)) || null;
  const leader = rankedRows[0] || null;
  const nextHigher = currentRow
    ? rankedRows.find((row) => row.metricValue > currentRow.metricValue) || null
    : null;
  const gapToNext = currentRow && nextHigher
    ? Math.max(0, nextHigher.metricValue - currentRow.metricValue)
    : null;
  const resolvedWeeklyActivity = weeklyActivity && typeof weeklyActivity === 'object'
    ? { value: Math.max(0, asNumber(weeklyActivity.value)), detail: asText(weeklyActivity.detail) || 'This-week activity' }
    : buildLeaderboardWeeklyActivity({ teamId, viewerRole, currentUser, userEmail, shotLogs, now });
  const runnerUp = rankedRows[1] || null;

  return {
    rows: rankedRows,
    currentRow,
    leader,
    gapToNext,
    metrics: viewerRole === 'coach'
      ? [
        { label: 'Leader', value: leader ? leader.metricValue : '—', detail: leader?.player_display_name || 'No result yet' },
        { label: 'Lead margin', value: leader && runnerUp ? Math.max(0, leader.metricValue - runnerUp.metricValue) : '—', detail: leader && runnerUp ? 'Over second place' : 'No comparison yet' },
        { label: 'This week', value: resolvedWeeklyActivity.value, detail: resolvedWeeklyActivity.detail },
      ]
      : [
        { label: 'Your rank', value: currentRow ? `#${currentRow.rank}` : '—', detail: currentRow ? `${currentRow.metricValue} recorded` : 'Log a result to enter' },
        { label: 'Gap to next', value: currentRow?.rank === 1 ? 'Top' : gapToNext ?? '—', detail: currentRow?.rank === 1 ? 'You hold the top spot' : 'Makes or points needed' },
        { label: 'This week', value: resolvedWeeklyActivity.value, detail: resolvedWeeklyActivity.detail },
      ],
  };
}
