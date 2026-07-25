const clean = (value) => String(value ?? "").trim();
const escapeHtml = (value) => clean(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function sendPlayerSetupEmail(env, {
  to,
  playerName,
  teamName,
  teamCode,
  setupUrl,
  expiresAt,
} = {}) {
  const apiKey = clean(env?.RESEND_API_KEY);
  const from = clean(env?.SHOTLAB_FROM_EMAIL || env?.RESEND_FROM_EMAIL);
  if (!apiKey || !from) return { ok: false, status: "not_configured" };

  const safeName = clean(playerName) || "Player";
  const safeTeam = clean(teamName) || "your team";
  const safeCode = clean(teamCode);
  const expiry = new Date(expiresAt).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" });
  const subject = `You’ve been added to ${safeTeam} on ShotLab`;
  const text = [
    `Hi ${safeName},`,
    "",
    `A coach added you to ${safeTeam} on ShotLab.`,
    safeCode ? `Team code: ${safeCode}` : "",
    "",
    "Set your password using this one-time link:",
    setupUrl,
    "",
    `This link expires ${expiry}.`,
    "If you were not expecting this invitation, ignore this email.",
  ].filter(Boolean).join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#0b0b0b;color:#fff;padding:24px"><div style="max-width:560px;margin:auto;background:#171717;border:1px solid #333;border-radius:16px;padding:24px"><div style="font-size:12px;letter-spacing:2px;color:#c8ff00;font-weight:700">SHOTLAB</div><h1 style="font-size:24px;margin:10px 0 12px">You’ve been added to ${escapeHtml(safeTeam)}</h1><p>Hi ${escapeHtml(safeName)},</p><p>A coach added you to the roster. Create your password to activate the account.</p>${safeCode ? `<p><strong>Team code:</strong> ${escapeHtml(safeCode)}</p>` : ""}<p style="margin:24px 0"><a href="${escapeHtml(setupUrl)}" style="display:inline-block;background:#c8ff00;color:#0b0b0b;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:10px">Set your password</a></p><p style="color:#aaa;font-size:13px">This single-use link expires ${escapeHtml(expiry)}.</p><p style="color:#777;font-size:12px">If you were not expecting this invitation, ignore this email.</p></div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [clean(to).toLowerCase()], subject, text, html }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: "provider_error", providerStatus: response.status, providerCode: clean(body?.name || body?.message) };
  return { ok: true, status: "sent", providerId: clean(body?.id) };
}
