import { useMemo, useState } from "react";
import TeamIdentityTitleStage from "../components/TeamIdentityTitleStage";
import { DominantObjectiveCard, MetricStrip } from "../components/VisualHierarchy.jsx";
import { DSButton, DSCard, DSChip, DSEmptyState, DSInput, DSSectionHeader } from "../components/ui/designSystem";

const Users = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const ChevronRight = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL PLAYERS");
  const [copied, setCopied] = useState(false);

  const players = [];
  const totalPlayers = players.length;
  const activePlayers = 0;
  const inactivePlayers = 0;

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = (player.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "ALL PLAYERS" ||
        (activeFilter === "ACTIVE" && player.active) ||
        (activeFilter === "INACTIVE" && !player.active);
      return matchesSearch && matchesFilter;
    });
  }, [players, searchQuery, activeFilter]);

  const shareInviteLink = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({ title: "Join my ShotLab Program", text: "Your coach has invited you to join their basketball training program", url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="premium-roster-workspace"
      style={{
        minHeight: "100%",
        padding: "4px 0 28px",
        display: "grid",
        gap: 12,
        background: "transparent",
        color: "#071820",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', sans-serif",
        "--pw-surface": "#faf7ef",
        "--pw-border": "rgba(7,24,32,.12)",
        "--pw-shadow": "none",
        "--text-1": "#071820",
        "--text-2": "#526167",
        "--text-3": "#718087",
        "--font-display": "'Barlow Condensed', 'Arial Narrow', sans-serif",
      }}
    >
      <TeamIdentityTitleStage
        variant="standard"
        surface="light"
        role="Coach roster"
        eyebrow="Athlete operations"
        title="PLAYERS"
        summary="Manage roster identity, engagement, account readiness, and player development from one workspace."
        actions={[{ key: "invite", label: copied ? "Copied" : "Invite players", onClick: shareInviteLink }]}
        brandTreatment="compact"
        dataMobileStage="editorial"
        dataVisualRole="coach-players-title-stage"
        dataPageKind="coach-players"
        testId="coach-players-title-stage"
      />

      <DominantObjectiveCard
        eyebrow="Roster command"
        title={totalPlayers ? `${activePlayers} athletes building momentum` : "Build the roster foundation"}
        description={totalPlayers ? "Identify who is active, who needs a follow-up touch, and where the next coaching action belongs." : "Invite players before the next session to unlock attendance trends, drill momentum, and development profiles."}
        actionLabel={copied ? "Invite link copied" : "Invite players"}
        onAction={shareInviteLink}
        badge={totalPlayers ? `${inactivePlayers} follow-up` : "First setup"}
        testId="coach-players-primary-objective"
      />

      <MetricStrip
        testId="coach-players-metrics"
        items={[
          { label: "Roster", value: totalPlayers, detail: "Connected athletes" },
          { label: "Active", value: activePlayers, detail: "Current momentum" },
          { label: "Follow-up", value: inactivePlayers, detail: "Needs attention" },
        ]}
      />

      <section aria-labelledby="coach-players-controls-title" style={{ borderTop: "1px solid var(--pw-border)", padding: "16px 0 4px" }}>
        <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
          <span style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase" }}>Find and segment</span>
          <h2 id="coach-players-controls-title" style={{ margin: 0, color: "var(--text-1)", fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 850, lineHeight: 1, letterSpacing: "-.02em", textTransform: "uppercase" }}>Roster controls</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center" }} className="roster-control-grid">
          <DSInput
            type="search"
            aria-label="Search players"
            placeholder="Search players"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minHeight: 48, width: "100%", fontSize: 14 }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
              <DSChip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)} style={{ borderRadius: 999 }}>
                {filter}
              </DSChip>
            ))}
          </div>
        </div>
      </section>

      {players.length === 0 ? (
        <section style={{ borderTop: "1px solid var(--pw-border)", padding: "22px 0 8px" }} aria-label="Roster setup">
          <div style={{ minHeight: 250, display: "grid", alignContent: "center", justifyItems: "center", gap: 14 }}>
            <div style={{ width: 70, height: 70, borderRadius: 20, display: "grid", placeItems: "center", border: "1px solid color-mix(in srgb,var(--pw-accent) 28%,var(--pw-border))", background: "color-mix(in srgb,var(--pw-accent) 10%,#faf7ef)" }}>
              <Users size={34} color="var(--pw-accent, var(--accent))" />
            </div>
            <DSEmptyState
              title="No athletes connected yet"
              message="Create the roster before the next session so every player can receive priorities, log work, and appear in team intelligence."
              style={{ maxWidth: 420, textAlign: "center", background: "transparent", border: 0 }}
            />
            <div style={{ display: "grid", width: "100%", maxWidth: 420 }}>
              {["Share the team invite link", "Confirm players create their accounts", "Use Events to publish the first team session"].map((step, index) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--pw-border)", padding: "10px 2px" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#071012", background: "var(--pw-accent, var(--accent))" }}>{index + 1}</span>
                  <span style={{ color: "var(--text-2)", fontSize: 12, fontWeight: 650 }}>{step}</span>
                </div>
              ))}
            </div>
            <DSButton onClick={shareInviteLink} variant="primary" style={{ minHeight: 46, paddingInline: 20 }}>
              {copied ? "Invite Link Copied" : "Invite Players"}
            </DSButton>
          </div>
        </section>
      ) : (
        <>
          <DSSectionHeader title="Roster" meta={`${filteredPlayers.length} shown`} />
          <div style={{ display: "grid", gap: 9 }}>
            {filteredPlayers.map((player) => (
              <DSCard key={player.id} className="ch" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "none" }}>
                <div style={{ width: 44, height: 44, background: "var(--pw-surface)", borderRadius: 14, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, color: "var(--text-1)", border: player.active ? "1px solid var(--pw-accent)" : "1px solid var(--pw-border)" }}>
                  {player.name?.[0] || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 750, color: "var(--text-1)", letterSpacing: ".01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{player.name}</div>
                  <div style={{ marginTop: 3, color: "var(--text-3)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" }}>{player.active ? "Active" : "Needs follow-up"}</div>
                </div>
                <ChevronRight size={17} color="var(--text-3)" />
              </DSCard>
            ))}
          </div>
        </>
      )}

      <style>{`@media (max-width:760px){.roster-control-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
