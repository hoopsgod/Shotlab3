import type { CSSProperties, ReactNode } from "react";

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
  {
    href: "/player/home",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
      </svg>
    ),
  },
  {
    href: "/player/duels",
    label: "Duels",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}>
        <path d="M7 20V9l4-5 4 5v11" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
  {
    href: "/player/quick",
    label: "Quick",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}>
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
    ),
  },
  {
    href: "/player/training",
    label: "Training",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}>
        <path d="M3 10h6v4H3zM15 10h6v4h-6z" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/player/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
  },
];

const styles = {
  aside: {
    width: "240px",
    background: "#111827",
    color: "#f3f4f6",
    borderRight: "1px solid #1f2937",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
  },
  brand: {
    padding: "16px",
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  nav: {
    flex: 1,
    padding: "0 8px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "8px",
    color: "#f3f4f6",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "background-color 150ms ease",
  },
  icon: {
    color: "#d1d5db",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default function PlayerSidebar() {
  return (
    <aside style={styles.aside}>
      <div style={styles.brand}>ShotLab</div>
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={styles.link}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1f2937";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
