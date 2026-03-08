import { useMemo, useState } from "react";
import Button from "../components/ui/Button";

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

const StatusBadge = ({ active }) => {
  const tone = active
    ? {
        label: "Active",
        color: "var(--color-success)",
        border: "rgba(99, 222, 143, 0.42)",
        bg: "rgba(99, 222, 143, 0.16)",
      }
    : {
        label: "Inactive",
        color: "var(--color-pending)",
        border: "rgba(255, 191, 102, 0.42)",
        bg: "rgba(255, 191, 102, 0.18)",
      };

  return (
    <span
      className="status-chip"
      style={{
        color: tone.color,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        fontSize: "11px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {tone.label}
    </span>
  );
};

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All players");
  const [copied, setCopied] = useState(false);

  const players = [];
  const totalPlayers = players.length;
  const activePlayers = 0;
  const inactivePlayers = 0;

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = (player.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "All players" ||
        (activeFilter === "Active" && player.active) ||
        (activeFilter === "Inactive" && !player.active);
      return matchesSearch && matchesFilter;
    });
  }, [players, searchQuery, activeFilter]);

  const shareInviteLink = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({
        title: "Join my ShotLab Program",
        text: "Your coach invited you to the training roster",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "var(--bg-0)",
        minHeight: "100vh",
        paddingLeft: "var(--page-gutter)",
        paddingRight: "var(--page-gutter-right)",
        paddingTop: "var(--space-5)",
        paddingBottom: "calc(var(--nav-height, 74px) + var(--space-8) + env(safe-area-inset-bottom))",
      }}
    >
      <section
        style={{
          background: "var(--surface-1)",
          border: "1px solid rgba(122,145,186,.36)",
          borderRadius: "16px",
          padding: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <Users size={18} color="var(--accent)" />
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-2)", fontWeight: 700 }}>Primary goal</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.05, color: "var(--text-1)" }}>Grow active players</h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 13, lineHeight: 1.35 }}>Add players first, then monitor who needs follow-up.</p>
          </div>
          <Button variant="primary" onClick={shareInviteLink} aria-label="Invite players">
            Invite
          </Button>
        </div>

        <div
          style={{
            marginTop: "var(--space-4)",
            border: "1px solid var(--stroke-1)",
            borderRadius: "12px",
            padding: "10px 12px",
            background: "var(--surface-2)",
          }}
        >
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-2)", fontWeight: 700 }}>Primary metric</div>
          <div style={{ fontSize: 34, color: "var(--accent)", fontWeight: 900, lineHeight: 1 }}>{inactivePlayers}</div>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>Inactive players this week</div>
        </div>

        <details style={{ marginTop: "var(--space-3)" }}>
          <summary style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-2)", cursor: "pointer" }}>See roster summary</summary>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: 10, padding: "8px" }}><div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{totalPlayers}</div><div style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase" }}>Total</div></div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: 10, padding: "8px" }}><div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{activePlayers}</div><div style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase" }}>Active</div></div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--stroke-1)", borderRadius: 10, padding: "8px" }}><div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-2)" }}>{inactivePlayers}</div><div style={{ fontSize: 10, color: "var(--text-2)", textTransform: "uppercase" }}>Inactive</div></div>
          </div>
        </details>
      </section>

      <input className="input" type="text" placeholder="Search players" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ fontSize: "var(--fs-body)", marginBottom: "var(--space-3)" }} />

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        {["All players", "Active", "Inactive"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              borderRadius: 999,
              height: 32,
              padding: "0 12px",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: activeFilter === filter ? "1px solid rgba(91, 243, 255, 0.34)" : "1px solid var(--stroke-1)",
              background: activeFilter === filter ? "rgba(91, 243, 255, 0.18)" : "var(--surface-1)",
              color: activeFilter === filter ? "var(--text-1)" : "var(--text-3)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div style={{ minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)" }}>
          <Users size={44} color="#555555" />
          <p style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-2)", margin: 0 }}>No players yet</p>
          <p style={{ fontSize: "12px", color: "var(--text-3)", textAlign: "center", maxWidth: "230px", margin: 0 }}>Invite your first player to start roster tracking.</p>
        </div>
      ) : (
        filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="interactive-card"
            role="button"
            tabIndex={0}
            aria-label={`${player.name} status ${player.active ? "active" : "inactive"}`}
            style={{
              background: "var(--surface-2)",
              border: "1px solid rgba(167, 187, 211, 0.34)",
              borderRadius: "16px",
              padding: "var(--space-4)",
              marginBottom: "var(--space-3)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "var(--surface-1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-1)",
                border: player.active ? "2px solid rgba(91, 243, 255, 0.44)" : "2px solid rgba(167, 187, 211, 0.36)",
              }}
            >
              {player.name?.[0] || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-1)", marginBottom: "6px" }}>{player.name}</div>
              <StatusBadge active={player.active} />
            </div>
            <ChevronRight size={16} color="var(--text-3)" />
          </div>
        ))
      )}

      {copied && <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>Invite link copied</p>}
    </div>
  );
}
