export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const upsertPlayerProfile = (players, profile) => {
  const normalized = normalizeEmail(profile?.email);
  const nextProfile = {
    email: normalized,
    name: profile?.name || '',
    password: profile?.password || '',
    role: profile?.role || 'player',
    teamId: profile?.teamId ?? null,
    hideFromLeaderboards: profile?.hideFromLeaderboards === true,
  };
  let found = false;
  const nextPlayers = (players || []).map((player) => {
    if (normalizeEmail(player?.email) !== normalized) return player;
    found = true;
    return { ...player, ...nextProfile };
  });
  if (!found) nextPlayers.push(nextProfile);
  return nextPlayers;
};

export const isPendingConfirmation = (authData) => !authData?.access_token;
