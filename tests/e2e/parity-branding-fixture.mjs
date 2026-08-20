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
  await page.evaluate(({ logoUrl }) => {
    const rawTeams = window.localStorage.getItem("sl:teams");
    if (!rawTeams) return;
    let teams;
    try {
      teams = JSON.parse(rawTeams);
    } catch {
      return;
    }
    if (!Array.isArray(teams)) return;
    window.localStorage.setItem("sl:teams", JSON.stringify(teams.map((team) => {
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
    })));
  }, { logoUrl: PARITY_CUSTOM_LOGO_URL });
  await page.reload();
}
