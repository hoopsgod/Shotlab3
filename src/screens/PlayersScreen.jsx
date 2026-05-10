import { useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";

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
      const matchesSearch = (player.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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

  const chipStyle = (isActive) => ({
    borderRadius: "999px",
    minHeight: "34px",
    padding: "0 14px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: "pointer",
    border: isActive ? "1px solid color-mix(in srgb,var(--accent) 26%, transparent)" : "1px solid var(--stroke-1)",
    background: isActive ? "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0)), var(--accent)" : "var(--surface-1)",
    color: isActive ? "#0B0D10" : "var(--text-2)",
    fontWeight: isActive ? 700 : 600,
    transition: "all .15s ease",
  });

  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh", padding: "14px 14px 28px", display: "grid", gap: 12 }}>
      <AppHeader title="PLAYERS" subtitle="Manage your roster and track player engagement" leading={<Users size={22} color="var(--text-2)" />} />

      <input
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: "12px", height: "46px", padding: "0 14px", fontSize: "14px", color: "var(--text-1)", width: "100%" }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
          <button key={filter} onClick={() => setActiveFilter(filter)} style={chipStyle(activeFilter === filter)}>
            {filter}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: "16px", padding: "14px 12px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        {[[totalPlayers, "Total", "var(--text-1)"], [activePlayers, "Active", "var(--accent)"], [inactivePlayers, "Inactive", "var(--text-2)"]].map(([count, label, color]) => (
          <div key={label} style={{ display: "grid", placeItems: "center", borderLeft: label === "Total" ? "none" : "1px solid var(--stroke-1)" }}>
            <span style={{ fontSize: "22px", fontWeight: 900, color }}>{count}</span>
            <span style={{ fontSize: "10px", letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginTop: "4px" }}>{label}</span>
          </div>
        ))}
      </div>

      {players.length === 0 ? (
        <div style={{ minHeight: "260px", border: "1px dashed var(--stroke-2)", borderRadius: "16px", background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "20px" }}>
          <Users size={44} color="var(--text-3)" />
          <p style={{ fontSize: "18px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-1)", margin: 0, letterSpacing: ".05em" }}>Build your roster</p>
          <p style={{ fontSize: "13px", color: "var(--text-2)", textAlign: "center", maxWidth: "280px", margin: 0 }}>No players are linked yet. Share your invite and start tracking engagement immediately.</p>
          <button onClick={shareInviteLink} style={{ background: "var(--accent)", color: "#000", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", minHeight: "48px", borderRadius: "12px", padding: "0 18px", border: "1px solid color-mix(in srgb,var(--accent) 70%, transparent)", cursor: "pointer" }}>
            {copied ? "Link Copied" : "Invite Players"}
          </button>
        </div>
      ) : (
        filteredPlayers.map((player) => (
          <div key={player.id} style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: "16px", padding: "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <div style={{ width: "42px", height: "42px", background: "var(--surface-1)", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "16px", fontWeight: 700, color: "var(--text-1)", border: player.active ? "2px solid var(--accent-soft)" : "2px solid var(--stroke-1)" }}>
              {player.name?.[0] || "?"}
            </div>
            <div style={{ flex: 1, fontSize: "14px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-1)", letterSpacing: ".04em" }}>{player.name}</div>
            <ChevronRight size={16} color="var(--text-3)" />
          </div>
        ))
      )}
    </div>
  );
}
