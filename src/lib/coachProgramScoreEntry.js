import { validateProgramDrillScore } from "./programDrillScoring.js";

const clean = (value) => String(value ?? "").trim();
const normalizeIdentity = (value) => clean(value).toLowerCase();

export function coachProgramScorePlayerOptions(players = []) {
  return (Array.isArray(players) ? players : [])
    .map((player) => ({
      player,
      id: clean(player?.id || player?.playerId || player?.player_id || player?.profileId || player?.email),
      email: normalizeIdentity(player?.email || player?.player_email || player?.invitedEmail),
      name: clean(player?.name || player?.displayName || [player?.firstName, player?.lastName].filter(Boolean).join(" ")),
    }))
    .filter((option) => option.id && option.email)
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
}

export function coachProgramScoreDrillOptions(drills = []) {
  return (Array.isArray(drills) ? drills : [])
    .map((drill) => ({
      drill,
      id: clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name),
      name: clean(drill?.name || drill?.drillName),
    }))
    .filter((option) => option.id && option.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function validateCoachProgramScoreEntry({ player, drill, score, date } = {}) {
  const email = normalizeIdentity(player?.email || player?.player_email || player?.invitedEmail);
  if (!email) return { ok: false, error: "Choose an active roster player." };
  if (!clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name)) {
    return { ok: false, error: "Choose a Program drill." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(date))) return { ok: false, error: "Choose a valid session date." };
  return validateProgramDrillScore(score, drill);
}

export function buildCoachVerifiedProgramScoreRow({
  id,
  player = {},
  drill = {},
  score,
  date,
  teamId,
  now = Date.now(),
} = {}) {
  const validation = validateCoachProgramScoreEntry({ player, drill, score, date });
  if (!validation.ok) return null;
  const email = normalizeIdentity(player?.email || player?.player_email || player?.invitedEmail);
  const drillId = clean(drill?.id || drill?.drill_id || drill?.key || drill?.slug || drill?.name);
  const normalizedTeamId = clean(teamId || player?.teamId || player?.team_id);
  if (!normalizedTeamId) return null;
  return {
    id: clean(id) || `coach_program_score_${now}`,
    email,
    playerId: email,
    player_id: email,
    teamId: normalizedTeamId,
    team_id: normalizedTeamId,
    name: clean(player?.name || player?.displayName || [player?.firstName, player?.lastName].filter(Boolean).join(" ")) || email,
    drillId,
    drill_id: drillId,
    drillName: clean(drill?.name || drill?.drillName),
    score: validation.score,
    date: clean(date),
    ts: now,
    src: "program",
  };
}
