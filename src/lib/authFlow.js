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

export const resolveExpiresAt = (payload, nowSeconds = Math.floor(Date.now() / 1000)) => {
  const expiresAt = Number(payload?.expires_at || 0);
  if (expiresAt) return expiresAt;
  const expiresIn = Number(payload?.expires_in || 0);
  if (!expiresIn) return null;
  return nowSeconds + expiresIn;
};
