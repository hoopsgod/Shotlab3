const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconShell({ size = 22, children, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      {children}
    </svg>
  );
}

export const BrandIcons = {
  home: ({ size, className }) => <IconShell size={size} className={className}><path d="M3 10.5L12 3l9 7.5"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5h4v5"/></IconShell>,
  drills: ({ size, className }) => <IconShell size={size} className={className}><circle cx="12" cy="12" r="9"/><path d="M8 7l8 10"/><path d="M9 16h6"/></IconShell>,
  duels: ({ size, className }) => <IconShell size={size} className={className}><path d="M5 18c2.5-2 3.5-4.3 3.5-6.5S7.5 7 5 5"/><path d="M19 18c-2.5-2-3.5-4.3-3.5-6.5S16.5 7 19 5"/><circle cx="12" cy="12" r="2.5"/></IconShell>,
  events: ({ size, className }) => <IconShell size={size} className={className}><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M8 2.5v4"/><path d="M16 2.5v4"/><path d="M3 9h18"/><path d="M8 13h3"/></IconShell>,
  strength: ({ size, className }) => <IconShell size={size} className={className}><path d="M2.5 9.5v5"/><path d="M21.5 9.5v5"/><path d="M6.5 7H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1.5"/><path d="M17.5 7H19a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1.5"/><path d="M6.5 12h11"/></IconShell>,
  players: ({ size, className }) => <IconShell size={size} className={className}><circle cx="9" cy="8" r="2.5"/><path d="M3 19a5 5 0 0 1 10 0"/><path d="M16.5 10.5a2.5 2.5 0 1 0 0-5"/><path d="M14.5 19a4 4 0 0 1 6.5-3.1"/></IconShell>,
  settings: ({ size, className }) => <IconShell size={size} className={className}><circle cx="12" cy="12" r="2.8"/><path d="M12 4.2v2"/><path d="M12 17.8v2"/><path d="M19.8 12h-2"/><path d="M6.2 12h-2"/><path d="M17.5 6.5l-1.4 1.4"/><path d="M7.9 16.1l-1.4 1.4"/><path d="M17.5 17.5l-1.4-1.4"/><path d="M7.9 7.9L6.5 6.5"/></IconShell>,
  menu: ({ size, className }) => <IconShell size={size} className={className}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h11"/></IconShell>,
};

export const BrandBadges = {
  rookieFlame: ({ size = 30, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2c.5 3-1 4.5-2.2 6.2C8.7 9.8 8 11 8 12.6A4 4 0 0 0 12 16.5a4 4 0 0 0 4-3.9c0-2.3-1.8-4-4-5.8" stroke={color} strokeWidth="1.9" strokeLinecap="round"/></svg>
  ),
  doubleFlame: ({ size = 30, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4c.4 2.1-.7 3.2-1.5 4.4C6.7 9.5 6 10.5 6 12a3 3 0 0 0 3 3" stroke={color} strokeWidth="1.9"/><path d="M15 3.5c.5 2.5-.8 3.7-1.8 5.1-1 1.4-1.7 2.4-1.7 4A3.5 3.5 0 0 0 15 16a3.5 3.5 0 0 0 3.5-3.4c0-2-1.4-3.6-3.5-5.2" stroke={color} strokeWidth="1.9"/></svg>
  ),
  crownBolt: ({ size = 30, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9l3 2.5L12 7l5 4.5L20 9l-2 8H6L4 9z" stroke={color} strokeWidth="1.9"/><path d="M12 10l-1.2 3h1.7L11 16" stroke={color} strokeWidth="1.9"/></svg>
  ),
  ironShield: ({ size = 30, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7 3v5c0 4.4-2.7 7.8-7 10-4.3-2.2-7-5.6-7-10V6l7-3z" stroke={color} strokeWidth="1.9"/><path d="M9 12h6" stroke={color} strokeWidth="1.9"/></svg>
  ),
  legacyMark: ({ size = 30, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l2.8 5.6L21 9.5l-4.5 4.2 1 6.3-5.5-2.9-5.5 2.9 1-6.3L3 9.5l6.2-.9L12 3z" stroke={color} strokeWidth="1.9"/><path d="M12 8.5v7" stroke={color} strokeWidth="1.9"/></svg>
  ),
};
