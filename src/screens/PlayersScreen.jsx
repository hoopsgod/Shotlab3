import { useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { DSButton, DSCard, DSChip, DSEmptyState, DSInput, DSMetricCard, DSSectionHeader } from "../components/ui/designSystem";

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
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", padding: "14px 14px 28px", display: "grid", gap: 12 }}>
      <AppHeader title="PLAYERS" subtitle="Manage your roster and track player engagement" leading={<Users size={22} color="var(--text-2)" />} />

      <DSInput
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ minHeight: 46, width: "100%", fontSize: 14 }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
          <DSChip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)} style={{ borderRadius: 999, minHeight: 34 }}>
            {filter}
          </DSChip>
        ))}
      </div>

      <DSCard style={{ padding: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {[[totalPlayers, "Total", "var(--text-1)"], [activePlayers, "Active", "var(--accent)"], [inactivePlayers, "Inactive", "var(--text-2)"]].map(([count, label, color]) => (
            <DSMetricCard key={label} label={label} value={count} style={{ minHeight: 80, border: "1px solid var(--stroke-1)", background: "var(--surface-2)", boxShadow: "none" }} valueStyle={{ color, fontSize: 22 }} />
          ))}
        </div>
      </DSCard>

      {players.length === 0 ? (
        <DSCard style={{ padding: 14 }}>
          <div style={{ minHeight: 240, display: "grid", alignContent: "center", justifyItems: "center", gap: 10 }}>
            <Users size={44} color="var(--text-3)" />
            <DSEmptyState
              title="Build your roster"
              message="No players are linked yet. Share your invite and start tracking engagement immediately."
              style={{ maxWidth: 360, textAlign: "center", background: "transparent", border: "1px dashed var(--stroke-2)" }}
            />
            <DSButton onClick={shareInviteLink} variant="primary" style={{ minHeight: 44, paddingInline: 18 }}>
              {copied ? "Link Copied" : "Invite Players"}
            </DSButton>
          </div>
        </DSCard>
      ) : (
        <>
          <DSSectionHeader title="Roster" meta={`${filteredPlayers.length} shown`} />
          {filteredPlayers.map((player) => (
            <DSCard key={player.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "var(--surface-2)" }}>
              <div style={{ width: "42px", height: "42px", background: "var(--surface-1)", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "16px", fontWeight: 700, color: "var(--text-1)", border: player.active ? "2px solid var(--accent-soft)" : "2px solid var(--stroke-1)" }}>
                {player.name?.[0] || "?"}
              </div>
              <div style={{ flex: 1, fontSize: "14px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-1)", letterSpacing: ".04em" }}>{player.name}</div>
              <ChevronRight size={16} color="var(--text-3)" />
            </DSCard>
          ))}
        </>
      )}
    </div>
  );
}
