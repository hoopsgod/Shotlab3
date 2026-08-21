const PARITY_LOGO_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <path d="M60 6 104 24v31c0 29-17 48-44 59C33 103 16 84 16 55V24Z" fill="#071820" stroke="#c8ff1a" stroke-width="6"/>
    <path d="M37 37h46v12H66v38H54V49H37Z" fill="#f7f5ee"/>
  </svg>
`;

export const PARITY_CUSTOM_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(PARITY_LOGO_SVG)}`;

export function withParityBranding(team = {}) {
  const teamName = String(team?.branding?.teamName || team?.teamName || team?.name || "Parity Team");
  return {
    ...team,
    logoUrl: PARITY_CUSTOM_LOGO_URL,
    logoMarkUrl: PARITY_CUSTOM_LOGO_URL,
    branding: {
      ...(team.branding || {}),
      teamName,
      logoUrl: PARITY_CUSTOM_LOGO_URL,
      logoMarkUrl: PARITY_CUSTOM_LOGO_URL,
    },
  };
}

export async function installParityBranding(page) {
  const restoreState = await page.evaluate(({ logoUrl }) => {
    const parse = (raw, fallback) => {
      try { return raw ? JSON.parse(raw) : fallback; }
      catch { return fallback; }
    };
    const idOf = (row) => String(row?.id || row?.teamId || row?.team_id || "");
    const teamIdOf = (row) => String(row?.teamId || row?.team_id || "");
    const emailOf = (row) => String(row?.email || "").trim().toLowerCase();

    const session = parse(window.localStorage.getItem("sl:session"), null)
      || parse(window.sessionStorage.getItem("sl:session"), null);
    const teams = parse(window.localStorage.getItem("sl:teams"), []);
    const players = parse(window.localStorage.getItem("sl:players"), []);
    if (!session || !Array.isArray(teams) || !Array.isArray(players)) return null;

    const sessionEmail = emailOf(session);
    const player = players.find((row) => emailOf(row) === sessionEmail) || null;
    const activeTeamId = String(session?.teamId || session?.team_id || teamIdOf(player) || teams[0]?.id || "");
    if (!sessionEmail || !activeTeamId) return null;

    const nextTeams = teams.map((team) => {
      if (idOf(team) !== activeTeamId) return team;
      const teamName = String(team?.branding?.teamName || team?.teamName || team?.name || "Parity Team");
      return {
        ...team,
        logoUrl,
        logoMarkUrl: logoUrl,
        branding: {
          ...(team?.branding || {}),
          teamName,
          logoUrl,
          logoMarkUrl: logoUrl,
        },
      };
    });
    const activeTeam = nextTeams.find((team) => idOf(team) === activeTeamId) || null;
    if (!activeTeam) return null;

    window.localStorage.setItem("sl:teams", JSON.stringify(nextTeams));
    return {
      profile: {
        email: String(player?.email || session?.email || ""),
        name: String(player?.name || session?.name || ""),
        role: player?.role === "coach" || session?.role === "coach" ? "coach" : "player",
        team_id: activeTeamId,
        teamId: activeTeamId,
        hide_from_leaderboards: player?.hideFromLeaderboards === true || player?.hide_from_leaderboards === true,
      },
      team: activeTeam,
    };
  }, { logoUrl: PARITY_CUSTOM_LOGO_URL });

  if (!restoreState?.profile?.email || !restoreState?.team?.id) {
    throw new Error("Parity branding requires an active signed-in profile and team before reload");
  }

  const authPattern = "**/v1/legacy-auth/restore";
  const teamPattern = "**/v1/teams/restore-context";
  const authHandler = (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, profile: restoreState.profile }),
  });
  const teamHandler = (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, team: restoreState.team }),
  });

  await page.route(authPattern, authHandler);
  await page.route(teamPattern, teamHandler);
  try {
    await page.reload();
    const rootTestId = restoreState.profile.role === "coach"
      ? "coach-command-center-full"
      : "player-daily-command-center";
    await page.getByTestId(rootTestId).waitFor({ state: "visible", timeout: 20_000 });
    const viewportWidth = page.viewportSize()?.width ?? 430;
    if (viewportWidth < 768) {
      await page.getByTestId("mobile-navigation-dock").waitFor({ state: "visible", timeout: 20_000 });
    }
  } finally {
    await page.unroute(authPattern, authHandler);
    await page.unroute(teamPattern, teamHandler);
  }
}
