import { useEffect, useMemo, useState } from "react";
import { buildCoachPlayerInviteEmailLink, loadCoachPlayerInvitations, provisionCoachPlayer } from "../lib/coachPlayerInvitationService.js";
import { DSButton, DSInput } from "./ui/designSystem.jsx";

const styles = {
  shell: { background: "var(--surface-1, #151515)", border: "1px solid var(--stroke-1, #333)", borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { color: "var(--text-1, #fff)", fontSize: 16, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" },
  copy: { color: "var(--text-3, #aaa)", fontSize: 11, lineHeight: 1.5, margin: "6px 0 12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 },
  input: { width: "100%", minHeight: 44, borderRadius: 9, border: "1px solid var(--stroke-1, #333)", background: "var(--surface-0, #0b0b0b)", color: "var(--text-1, #fff)", padding: "0 11px", fontSize: 15 },
  button: { width: "100%", minHeight: 44, marginTop: 10, borderRadius: 9, fontWeight: 900, letterSpacing: ".05em" },
};

const statusLabel = (status) => ({ sent: "Invite Sent", pending: "Invite Pending", claimed: "Account Active", expired: "Invite Expired", revoked: "Invite Revoked" }[status] || "Invite Pending");
const technicalErrorPattern = /(pgrst|postgres|supabase|jwt|schema|column|relation|typeerror|stack|fetch failed|networkerror|http\s*\d{3}|\b5\d\d\b)/i;

export function friendlyPlayerInviteError(value) {
  const message = String(value || "").trim();
  if (!message || message.length > 180 || technicalErrorPattern.test(message)) {
    return "We couldn’t add this player right now. Check the details and try again.";
  }
  return message;
}

export default function CoachPlayerInviteForm({ coach, teamId, onProvisioned }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", jerseyNumber: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [setupUrl, setSetupUrl] = useState("");
  const [setupRecipient, setSetupRecipient] = useState("");
  const [setupPlayerName, setSetupPlayerName] = useState("");
  const [setupExpiresAt, setSetupExpiresAt] = useState("");
  const [invitations, setInvitations] = useState([]);

  const refresh = async () => {
    const result = await loadCoachPlayerInvitations({ coach, teamId });
    if (result.ok) setInvitations(result.invitations);
  };
  useEffect(() => { if (teamId && coach?.email) void refresh(); }, [teamId, coach?.email]);

  const recent = useMemo(() => invitations.slice(0, 8), [invitations]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event?.preventDefault?.();
    if (busy) return;
    const invitationEmail = form.email.trim().toLowerCase();
    const invitationName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim() || "Player";
    setBusy(true);
    setMessage("");
    setError("");
    setSetupUrl("");
    setSetupRecipient("");
    setSetupPlayerName("");
    setSetupExpiresAt("");
    try {
      const result = await provisionCoachPlayer({ coach, teamId, ...form });
      if (!result.ok) { setError(friendlyPlayerInviteError(result.error)); return; }
      if (result.status === "account_active") {
        setMessage("Player connected. Their existing ShotLab login now points to this roster.");
      } else if (result.email_delivery_status === "sent") {
        setMessage(`Invite sent to ${invitationEmail}. The player will choose their password.`);
      } else {
        setMessage("Player added. Email delivery is unavailable, so share the secure setup link below.");
        setSetupUrl(result.setup_url || "");
        setSetupRecipient(invitationEmail);
        setSetupPlayerName(invitationName);
        setSetupExpiresAt(result.expires_at || "");
      }
      setForm({ firstName: "", lastName: "", email: "", jerseyNumber: "" });
      onProvisioned?.(result);
      await refresh();
    } catch (caught) {
      setError(friendlyPlayerInviteError(caught?.message));
    } finally {
      setBusy(false);
    }
  };
  const copySetupLink = async () => {
    if (!setupUrl) return;
    try { await navigator.clipboard.writeText(setupUrl); setMessage("Secure setup link copied. Send it directly to the player."); }
    catch { setMessage("Couldn’t copy the link. Open your email app to send the invitation instead."); }
  };
  const openEmailApp = () => {
    const mailto = buildCoachPlayerInviteEmailLink({ recipient: setupRecipient, playerName: setupPlayerName, setupUrl, expiresAt: setupExpiresAt });
    if (!mailto) return;
    window.location.href = mailto;
  };

  return <form id="coach-add-player-form" data-testid="coach-player-invite-form" aria-busy={busy || undefined} onSubmit={submit} style={styles.shell}>
    <div style={styles.title}>Add Player &amp; Send Login Invite</div>
    <p style={styles.copy}>Add the player to your roster and send a single-use account setup link. ShotLab never displays a permanent password.</p>
    <div style={styles.grid}>
      <DSInput aria-label="First name" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} placeholder="First name" style={styles.input} />
      <DSInput aria-label="Last name" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} placeholder="Last name" style={styles.input} />
      <DSInput aria-label="Player email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" value={form.email} onChange={update("email")} placeholder="Player email" style={{ ...styles.input, gridColumn: "1 / -1" }} />
      <DSInput aria-label="Jersey number" inputMode="numeric" pattern="[0-9]*" value={form.jerseyNumber} onChange={update("jerseyNumber")} placeholder="Jersey # (optional)" style={{ ...styles.input, gridColumn: "1 / -1" }} />
    </div>
    <DSButton type="submit" variant="primary" loading={busy} loadingLabel="Sending invite" style={styles.button}>ADD PLAYER & SEND INVITE</DSButton>
    {message && <div role="status" aria-live="polite" style={{ color: "var(--accent, #c8ff00)", fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>{message}</div>}
    {error && <div role="alert" aria-live="assertive" style={{ color: "#ff8f8f", fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>{error}</div>}
    {setupUrl && <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
      <DSButton type="button" variant="secondary" onClick={copySetupLink} style={{ ...styles.button, background: "transparent", color: "var(--text-1, #fff)", border: "1px solid var(--stroke-1, #333)" }}>COPY SECURE LINK</DSButton>
      <DSButton type="button" variant="secondary" onClick={openEmailApp} style={{ ...styles.button, background: "transparent", color: "var(--accent, #c8ff00)", border: "1px solid rgba(200,255,0,.45)" }}>OPEN EMAIL APP</DSButton>
    </div>}
    {recent.length > 0 && <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--stroke-1, #333)" }}>
      <div style={{ ...styles.title, fontSize: 12, color: "var(--text-3, #aaa)" }}>Recent Player Invitations</div>
      {recent.map((invite) => <div key={invite.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ minWidth: 0 }}><div style={{ color: "var(--text-1, #fff)", fontSize: 12, fontWeight: 800 }}>{invite.player_name}</div><div style={{ color: "var(--text-3, #aaa)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" }}>{invite.player_email}</div></div>
        <span style={{ flexShrink: 0, borderRadius: 999, border: "1px solid rgba(200,255,0,.35)", padding: "4px 8px", color: invite.status === "claimed" ? "var(--accent, #c8ff00)" : "var(--text-3, #aaa)", fontSize: 9, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase" }}>{statusLabel(invite.status)}</span>
      </div>)}
    </div>}
  </form>;
}
