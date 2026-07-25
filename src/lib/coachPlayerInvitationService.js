const clean = (value) => String(value ?? "").trim();
const emailKey = (value) => clean(value).toLowerCase();

const errorMessage = (code, status = 0) => {
  if (status === 401 || code === "unauthorized") return "Sign in again before inviting a player.";
  if (status === 403 || code === "forbidden") return "Only an authorized coach can invite players to this team.";
  if (status === 409 && code === "account_on_other_team") return "That email is already connected to another ShotLab team.";
  if (status === 409 && code === "account_role_conflict") return "That email belongs to a coach account and cannot be added as a player.";
  if (status === 429 || code === "rate_limited") return "Too many invitation attempts. Wait briefly and try again.";
  if (code === "invalid_request") return "Enter a first name and a valid player email.";
  return "The player invitation could not be created. No password was generated or exposed.";
};

export async function provisionCoachPlayer({ coach, teamId, firstName, lastName, email, jerseyNumber, fetchImpl = globalThis.fetch } = {}) {
  const requester = emailKey(coach?.email);
  if (!requester || clean(coach?.role) !== "coach" || !clean(teamId) || typeof fetchImpl !== "function") {
    return { ok: false, error: "Only an authorized coach can invite a player." };
  }
  try {
    const response = await fetchImpl("/v1/coach/players/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": requester },
      body: JSON.stringify({
        team_id: clean(teamId),
        first_name: clean(firstName),
        last_name: clean(lastName),
        email: emailKey(email),
        jersey_number: clean(jerseyNumber),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, code: body?.error || "provision_failed", error: errorMessage(body?.error, response.status) };
    return { ok: true, ...body };
  } catch {
    return { ok: false, code: "network_error", error: "The invitation service could not be reached." };
  }
}

export async function loadCoachPlayerInvitations({ coach, teamId, fetchImpl = globalThis.fetch } = {}) {
  const requester = emailKey(coach?.email);
  if (!requester || !clean(teamId) || typeof fetchImpl !== "function") return { ok: false, invitations: [] };
  try {
    const response = await fetchImpl(`/v1/coach/players/provision?team_id=${encodeURIComponent(clean(teamId))}`, { headers: { "x-user-id": requester } });
    const body = await response.json().catch(() => ({}));
    return response.ok ? { ok: true, invitations: Array.isArray(body?.invitations) ? body.invitations : [] } : { ok: false, invitations: [] };
  } catch {
    return { ok: false, invitations: [] };
  }
}
