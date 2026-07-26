import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { DominantObjectiveCard, MetricStrip, QuietSection } from "../components/VisualHierarchy.jsx";
import { DSButton, DSCard, DSChip, DSEmptyState, DSInput, DSLoadingState, DSSectionHeader } from "../components/ui/designSystem";

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);

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

  useEffect(() => {
    const timer = setTimeout(() => setIsBootstrapping(false), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="premium-roster-workspace" style={{ minHeight: "100%", padding: "4px 0 28px", display: "grid", gap: 12 }}>
      <AppHeader
        eyebrow="Athlete operations"
        title="PLAYERS"
        subtitle="Manage roster identity, engagement, account readiness, and player development from one workspace."
        leading={<Users size={22} color="var(--pw-accent, var(--accent))" />}
        action={{ label: copied ? "Copied" : "Invite", onClick: shareInviteLink }}
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

      <QuietSection title="Roster controls" eyebrow="Find and segment">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center" }} className="roster-control-grid">
          <DSInput
            type="text"
            placeholder="Search players"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minHeight: 48, width: "100%", fontSize: 14 }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
              <DSChip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)} style={{ borderRadius: 999, minHeight: 38 }}>
                {filter}
              </DSChip>
            ))}
          </div>
        </div>
      </QuietSection>

      {isBootstrapping ? (
        <DSLoadingState
          label="Preparing your player workspace"
          lines={4}
          style={{ minHeight: 170, display: "grid", alignContent: "center", borderRadius: 18 }}
        />
      ) : null}

      {!isBootstrapping && players.length === 0 ? (
        <DSCard style={{ padding: 18, borderRadius: 20, background: "var(--pw-surface)", border: "1px solid var(--pw-border)", boxShadow: "var(--pw-shadow)" }}>
          <div style={{ minHeight: 260, display: "grid", alignContent: "center", justifyItems: "center", gap: 14 }}>
            <div style={{ width: 70, height: 70, borderRadius: 20, display: "grid", placeItems: "center", border: "1px solid color-mix(in srgb,var(--pw-accent) 28%,var(--pw-border))", background: "var(--pw-accent-faint)", boxShadow: "0 18px 40px rgba(0,0,0,.28)" }}>
              <Users size={34} color="var(--pw-accent, var(--accent))" />
            </div>
            <DSEmptyState
              title="No athletes connected yet"
              message="Create the roster before the next session so every player can receive priorities, log work, and appear in team intelligence."
              style={{ maxWidth: 420, textAlign: "center", background: "transparent", border: 0 }}
            />
            <div style={{ display: "grid", gap: 7, width: "100%", maxWidth: 420 }}>
              {["Share the team invite link", "Confirm players create their accounts", "Use Events to publish the first team session"].map((step, index) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--pw-border)", background: "rgba(255,255,255,.018)", borderRadius: 12, padding: "10px 12px" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#071012", background: "var(--pw-accent, var(--accent))" }}>{index + 1}</span>
                  <span style={{ color: "var(--text-2)", fontSize: 12, fontWeight: 600 }}>{step}</span>
                </div>
              ))}
            </div>
            <DSButton onClick={shareInviteLink} variant="primary" style={{ minHeight: 46, paddingInline: 20 }}>
              {copied ? "Invite Link Copied" : "Invite Players"}
            </DSButton>
          </div>
        </DSCard>
      ) : !isBootstrapping ? (
        <>
          <DSSectionHeader title="Roster" meta={`${filteredPlayers.length} shown`} />
          <div style={{ display: "grid", gap: 9 }}>
            {filteredPlayers.map((player) => (
              <DSCard key={player.id} className="ch" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, background: "var(--surface-1)", borderRadius: 14, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, color: "var(--text-1)", border: player.active ? "1px solid var(--pw-accent)" : "1px solid var(--pw-border)" }}>
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
      ) : null}

      <style>{`@media (max-width:760px){.roster-control-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
