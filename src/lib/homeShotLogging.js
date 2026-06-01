const asText = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => asText(value).toLowerCase();

export const HOME_SHOT_VALIDATION_MESSAGE = 'Enter at least 1 made shot before logging.';

export function validateHomeShotLogInput({ made, date } = {}) {
  const numericMade = Number.parseInt(String(made ?? ''), 10);
  if (!Number.isFinite(numericMade) || numericMade <= 0) {
    return { ok: false, error: HOME_SHOT_VALIDATION_MESSAGE };
  }
  if (!asText(date)) {
    return { ok: false, error: 'Choose a date before logging shots.' };
  }
  return { ok: true, made: numericMade, date: asText(date) };
}

export function buildLocalHomeShotLog({ id, user, made, date, ts = Date.now() } = {}) {
  const email = normalizeEmail(user?.email);
  const teamId = asText(user?.teamId);
  if (!email || !teamId) return null;
  return {
    id: asText(id),
    email,
    playerId: email,
    teamId,
    name: asText(user?.name) || email,
    made: Number(made) || 0,
    date: asText(date),
    ts,
  };
}

export function normalizeSavedHomeShotLog(saved = {}, fallback = {}) {
  return {
    id: asText(saved.id) || fallback.id,
    email: normalizeEmail(saved.email || fallback.email),
    playerId: normalizeEmail(saved.player_id || saved.playerId || fallback.playerId || fallback.email),
    teamId: asText(saved.team_id || saved.teamId || fallback.teamId),
    name: asText(saved.name || fallback.name),
    made: Number(saved.made ?? fallback.made) || 0,
    date: asText(saved.date || fallback.date),
    ts: Number.isFinite(Number(saved.ts)) ? Number(saved.ts) : fallback.ts,
  };
}

export function shouldUseQuietHomeShotFallback({ errorCode, message, userEmail, teamId, playerName } = {}) {
  const normalizedCode = asText(errorCode).toLowerCase();
  const normalizedMessage = asText(message).toLowerCase();
  const normalizedEmail = normalizeEmail(userEmail);
  const normalizedTeamId = asText(teamId).toLowerCase();
  const normalizedName = asText(playerName).toLowerCase();
  const demoContext =
    normalizedEmail.includes('demo') ||
    normalizedEmail.endsWith('@demo.shotlab.app') ||
    normalizedTeamId.includes('demo') ||
    normalizedName.includes('demo player');

  if (normalizedCode === 'missing_durable_membership' || normalizedMessage.includes('missing durable membership')) return true;
  if (normalizedCode === 'forbidden' && normalizedMessage.includes('no active membership') && demoContext) return true;

  return false;
}

export function upsertHomeShotsLeaderboardRow(rows = [], { user, made, limit = 10 } = {}) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const email = normalizeEmail(user?.email);
  const displayName = asText(user?.name) || email || 'Player';
  const madeCount = Number(made) || 0;
  const nextRows = sourceRows.map((row) => ({ ...row }));
  const existingIndex = nextRows.findIndex((row) => {
    const rowEmail = normalizeEmail(row?.email || row?.player_email || row?.player_id || row?.playerId);
    if (email && rowEmail) return rowEmail === email;
    return asText(row?.player_display_name).toLowerCase() === displayName.toLowerCase();
  });

  if (existingIndex >= 0) {
    nextRows[existingIndex].email = nextRows[existingIndex].email || email;
    nextRows[existingIndex].player_display_name = nextRows[existingIndex].player_display_name || displayName;
    nextRows[existingIndex].total_home_shots = (Number(nextRows[existingIndex].total_home_shots) || 0) + madeCount;
  } else {
    nextRows.push({ email, player_display_name: displayName, total_home_shots: madeCount });
  }

  return nextRows
    .sort((a, b) => (Number(b.total_home_shots) || 0) - (Number(a.total_home_shots) || 0) || asText(a.player_display_name).localeCompare(asText(b.player_display_name)))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
