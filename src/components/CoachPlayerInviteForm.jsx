import { useEffect, useMemo, useState } from "react";
import { loadCoachPlayerInvitations, provisionCoachPlayer } from "../lib/coachPlayerInvitationService.js";

const styles = {
  shell: { background: "var(--surface-1, #151515)", border: "1px solid var(--stroke-1, #333)", borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { color: "var(--text-1, #fff)", fontSize: 16, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" },
  copy: { color: "var(--text-3, #aaa)", fontSize: 11, lineHeight: 1.5, margin: "6px 0 12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 },
  input: { width: "100%", minHeight: 44, borderRadius: 9, border: "1px solid var(--stroke-1, #333)", background: "var(--surface-0, #0b0b0b)", color: "var(--text-1, #fff)", padding: "0 11px", fontSize: 15 },
  button: { width: "100%", minHeight: 44, marginTop: 10, border: 0, borderRadius: 9, background: "var(--accent, #c8ff00)", color: "#080808", fontWeight: 900, letterSpacing: ".05em", cursor: "pointer" },
};

const statusLabel = (status) => ({ sent: "Invite Sent", pending: "Invite Pending", claimed: "Account Active", expired: "Invite Expired", revoked: "Invite Revoked" }[status] || "Invite Pending");

export default function CoachPlayerInviteForm({ coach, teamId, onProvisioned }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", jerseyNumber: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [setupUrl, setSetupUrl] = useState("");
  const [invitations, setInvitations] = useState([]);

  const refresh = async () => {
    const result = await loadCoachPlayerInvitations({ coach, teamId });
    if (result.ok) setInvitations(result.invitations);
  };
  useEffect(() => { if (teamId && coach?.email) void refresh(); }, [teamId, coach?.email]);

  const recent = useMemo(() => invitations.slice(0, 8), [invitations]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    setSetupUrl("");
    const result = await provisionCoachPlayer({ coach, teamId, ...form });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    if (result.status === "account_active") {
      setMessage("This player already had a ShotLab login. The roster profile is now connected to that account.");
    } else if (result.email_delivery_status === "sent") {
      setMessage(`Invitation emailed to ${form.email.trim().toLowerCase()}. The player will choose their own password.`);
    } else {
      setMessage("The roster account was prepared, but email delivery is not configured. Copy the secure setup link below.");
      setSetupUrl(result.setup_url || "");
    }
    setForm({ firstName: "", lastName: "", email: "", jerseyNumber: "" });
    onProvisioned?.(result);
    await refresh();
  };
  const copySetupLink = async () => {
    if (!setupUrl) return;
    try { await navigator.clipboard.writeText(setupUrl); setMessage("Secure setup link copied. Send it directly to the player."); }
    catch { setMessage(setupUrl); }
  };

  return <section data-testid="coach-player-invite-form" style={styles.shell}>
    <div style={styles.title}>Add Player &amp; Send Login Invite</div>
    <p style={styles.copy}>Add the player to your roster and email a single-use account setup link. ShotLab never shows or emails a permanent password.</p>
    <div style={styles.grid}>
      <input aria-label="First name" value={form.firstName} onChange={update("firstName")} placeholder="First name" style={styles.input} />
      <input aria-label="Last name" value={form.lastName} onChange={update("lastName")} placeholder="Last name" style={styles.input} />
      <input aria-label="Player email" value={form.email} onChange={update("email")} placeholder="Player email" inputMode="email" autoCapitalize="none" style={{ ...styles.input, gridColumn: "1 / -1" }} />
      <input aria-label="Jersey number" value={form.jerseyNumber} onChange={update("jerseyNumber")} placeholder="Jersey # (optional)" style={styles.input} />
    </div>
    <button type="button" disabled={busy} onClick={submit} style={{ ...styles.button, opacity: busy ? .55 : 1 }}>{busy ? "SENDING…" : "ADD PLAYER & SEND INVITE"}</button>
    {message && <div role="status" style={{ color: "var(--accent, #c8ff00)", fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>{message}</div>}
    {error && <div role="alert" style={{ color: "#ff8f8f", fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>{error}</div>}
    {setupUrl && <button type="button" onClick={copySetupLink} style={{ ...styles.button, background: "transparent", color: "var(--text-1, #fff)", border: "1px solid var(--stroke-1, #333)" }}>COPY SECURE SETUP LINK</button>}
    {recent.length > 0 && <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--stroke-1, #333)" }}>
      <div style={{ ...styles.title, fontSize: 12, color: "var(--text-3, #aaa)" }}>Recent Player Invitations</div>
      {recent.map((invite) => <div key={invite.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ minWidth: 0 }}><div style={{ color: "var(--text-1, #fff)", fontSize: 12, fontWeight: 800 }}>{invite.player_name}</div><div style={{ color: "var(--text-3, #aaa)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" }}>{invite.player_email}</div></div>
        <span style={{ flexShrink: 0, borderRadius: 999, border: "1px solid rgba(200,255,0,.35)", padding: "4px 8px", color: invite.status === "claimed" ? "var(--accent, #c8ff00)" : "var(--text-3, #aaa)", fontSize: 9, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase" }}>{statusLabel(invite.status)}</span>
      </div>)}
    </div>}
  </section>;
}
