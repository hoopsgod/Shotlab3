import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { useTeamBranding } from "../branding/TeamBrandingProvider";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const iconStyle: CSSProperties = {
  width: 18,
  height: 18,
  display: "block",
};

const navItems: NavItem[] = [
  { href: "/player/home", label: "Home", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13V10.5" /></svg> },
  { href: "/player/duels", label: "Duels", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><path d="M7 20V9l4-5 4 5v11" /><path d="M10 14h4" /></svg> },
  { href: "/player/quick", label: "Quick", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg> },
  { href: "/player/training", label: "Training", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><path d="M3 10h6v4H3zM15 10h6v4h-6z" /><path d="M9 12h6" /></svg> },
  { href: "/player/profile", label: "Profile", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg> },
];

export default function PlayerSidebar() {
  const { teamName, teamWordmark, tokens } = useTeamBranding();
  const activePath = typeof window !== "undefined" ? window.location.pathname : "";
  const teamInitial = useMemo(() => (teamName || "S").trim().charAt(0).toUpperCase(), [teamName]);

  return (
    <aside
      style={{
        width: "240px",
        background: "var(--surface-1)",
        color: tokens.text,
        borderRight: "1px solid var(--stroke-1)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <div style={{ padding: "14px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "12px", border: "1px solid var(--stroke-1)", background: tokens.surface }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#111", background: tokens.primary, fontWeight: 800 }}>{teamInitial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", color: tokens.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Team Identity</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.25, overflowWrap: "anywhere" }}>{teamWordmark}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = activePath.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                minHeight: "40px",
                padding: "10px 12px",
                borderRadius: "8px",
                color: isActive ? tokens.primary : tokens.text,
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: isActive ? `1px solid ${tokens.primarySoft}` : "1px solid transparent",
                background: isActive ? tokens.primarySoft : "transparent",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: isActive ? tokens.primary : tokens.muted, marginTop: "1px", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.3, overflowWrap: "anywhere" }}>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
