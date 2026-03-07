import { useMemo, useState } from "react";

const Users = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const UserPlus = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const ChevronRight = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      const matchesFilter = activeFilter === "ALL PLAYERS" || (activeFilter === "ACTIVE" && player.active) || (activeFilter === "INACTIVE" && !player.active);
      return matchesSearch && matchesFilter;
    });
  }, [players, searchQuery, activeFilter]);

  const shareInviteLink = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({
        title: "Join my ShotLab Program",
        text: "Your coach has invited you to join their basketball training program",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "var(--page-pad)", color: "var(--text-1)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <Users size={24} color="var(--text-2)" />
        <h1 style={{ fontSize: "var(--fs-title)", margin: 0 }}>Players</h1>
      </header>

      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-2)", marginBottom: "var(--space-3)" }}>Manage your roster and track player engagement.</p>

      <label htmlFor="players-search" style={{ display: "block", marginBottom: "var(--space-1)", fontSize: "var(--fs-caption)", color: "var(--text-2)" }}>
        Search players
      </label>
      <input
        id="players-search"
        className="input"
        type="text"
        placeholder="Search players"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search players"
        style={{ marginBottom: "var(--space-2)" }}
      />

      <div role="toolbar" aria-label="Player status filters" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
        {["ALL PLAYERS", "ACTIVE", "INACTIVE"].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`btn ${activeFilter === filter ? "btn--primary" : "btn--secondary"}`}
            aria-pressed={activeFilter === filter}
            aria-label={`Filter by ${filter.toLowerCase()}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="page-responsive-grid" aria-label="Player statistics" style={{ marginBottom: "var(--space-3)" }}>
        <article className="card" style={{ padding: "var(--card-pad)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-h2)", fontWeight: 700 }}>{totalPlayers}</div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>Total</div>
        </article>
        <article className="card" style={{ padding: "var(--card-pad)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-h2)", fontWeight: 700, color: "var(--accent)" }}>{activePlayers}</div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>Active</div>
        </article>
        <article className="card" style={{ padding: "var(--card-pad)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-h2)", fontWeight: 700 }}>{inactivePlayers}</div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>Inactive</div>
        </article>
      </section>

      {players.length === 0 ? (
        <section className="card" style={{ minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", padding: "var(--card-pad)" }}>
          <Users size={48} color="var(--text-2)" />
          <p style={{ fontSize: "var(--fs-h3)", fontWeight: 700, margin: 0 }}>No players yet</p>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-3)", textAlign: "center", maxWidth: "300px", margin: 0 }}>Invite players to join your program.</p>
          <button type="button" className="btn btn--primary" aria-label="Invite players">Invite players</button>
        </section>
      ) : (
        <section aria-label="Filtered player list">
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className="card"
              aria-label={`Open player ${player.name}`}
              style={{ width: "100%", marginBottom: "var(--space-2)", padding: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)", textAlign: "left", background: "var(--surface-2)", cursor: "pointer" }}
            >
              <div style={{ width: "44px", height: "44px", background: "var(--surface-1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-body)", fontWeight: 700, border: player.active ? "2px solid var(--accent-soft)" : "2px solid var(--border-1)" }}>
                {player.name?.[0] || "?"}
              </div>
              <span style={{ flex: 1, fontSize: "var(--fs-body)", fontWeight: 700 }}>{player.name}</span>
              <ChevronRight size={18} color="var(--text-3)" />
            </button>
          ))}
        </section>
      )}

      <section className="card" style={{ marginTop: "var(--space-3)", padding: "var(--card-pad)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }} aria-label="Roster growth actions">
        <UserPlus size={32} color="var(--text-2)" />
        <h2 style={{ fontSize: "var(--fs-h3)", margin: 0 }}>Invite a player</h2>
        <p style={{ fontSize: "var(--fs-body)", color: "var(--text-3)", textAlign: "center", maxWidth: "300px", margin: 0 }}>Share your program link and players can join instantly.</p>
        <button onClick={shareInviteLink} className="btn btn--primary" type="button" aria-label="Share invite link">
          Share invite link
        </button>
        {copied && <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-2)", margin: 0 }}>Link copied.</p>}
      </section>
    </main>
  );
}
