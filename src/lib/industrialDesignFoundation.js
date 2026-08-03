const STYLE_ID = "shotlab-industrial-design-foundation";

export const INDUSTRIAL_DESIGN_TOKENS = Object.freeze({
  canvas: "#f4f3ef",
  surface: "#ffffff",
  surfaceMuted: "#eeece6",
  ink: "#151719",
  inkMuted: "#62676b",
  line: "rgba(21,23,25,.09)",
  radius: "20px",
  shadow: "0 18px 55px rgba(26,30,33,.08)",
});

const CSS = `
/* ShotLab Industrial Design Foundation — editorial light system */
.performance-shell,
.premium-screen {
  --pw-accent: var(--team-brand-primary, var(--accent, #94c800));
  --pw-accent-soft: color-mix(in srgb, var(--pw-accent) 13%, transparent);
  --pw-accent-faint: color-mix(in srgb, var(--pw-accent) 7%, transparent);
  --pw-border: rgba(21,23,25,.09);
  --pw-border-strong: rgba(21,23,25,.14);
  --pw-surface: #fff;
  --pw-surface-raised: #fff;
  --pw-surface-inset: #f0eee8;
  --pw-shadow: 0 18px 55px rgba(26,30,33,.08);
  --pw-shadow-raised: 0 24px 70px rgba(26,30,33,.12);
  --pw-radius: 16px;
  --pw-radius-lg: 22px;
  --pw-copy: #151719;
  --pw-muted: #62676b;
  --pw-dim: #8a8e91;
  color: var(--pw-copy) !important;
  background: #f4f3ef !important;
  color-scheme: light;
}

.performance-shell::before,
.performance-workspace::before {
  background:
    radial-gradient(circle at 84% 2%, color-mix(in srgb, var(--pw-accent) 8%, transparent), transparent 30rem),
    linear-gradient(180deg, rgba(255,255,255,.72), transparent 19rem) !important;
}
.performance-workspace::after { opacity:.12 !important; }

.performance-shell .sidebar-nav {
  border-right:1px solid var(--pw-border) !important;
  background:rgba(250,249,246,.94) !important;
  box-shadow:none !important;
  backdrop-filter:blur(24px) saturate(1.15);
}
.performance-shell .sidebar-nav .nav-title { color:#999b98 !important; }
.performance-shell .sidebar-nav .nav-item {
  color:#666b6e !important;
  border-radius:13px !important;
}
.performance-shell .sidebar-nav .nav-item:hover,
.performance-shell .sidebar-nav .nav-item:focus-visible {
  color:#17191b !important;
  border-color:var(--pw-border) !important;
  background:#fff !important;
  transform:none !important;
}
.performance-shell .sidebar-nav .nav-item.is-active {
  color:#151719 !important;
  border-color:rgba(21,23,25,.07) !important;
  background:#fff !important;
  box-shadow:0 9px 28px rgba(25,28,30,.08), inset 3px 0 var(--pw-accent) !important;
}

.performance-shell .appHeader,
.premium-screen .appHeader {
  padding:clamp(22px,4vw,38px) !important;
  border:1px solid rgba(21,23,25,.075) !important;
  border-radius:26px !important;
  background:
    linear-gradient(125deg, color-mix(in srgb, var(--pw-accent) 5%, #fff), #fff 42%, #fdfcf9) !important;
  box-shadow:var(--pw-shadow) !important;
}
.performance-shell .appHeader::before,
.premium-screen .appHeader::before {
  background:linear-gradient(115deg, var(--pw-accent-faint), transparent 42%) !important;
}
.performance-shell .appHeaderTitle,
.premium-screen .appHeaderTitle {
  color:#151719 !important;
  font-size:clamp(34px,5vw,58px) !important;
  line-height:.96 !important;
  letter-spacing:-.018em !important;
}
.performance-shell .appHeaderSubtitle,
.premium-screen .appHeaderSubtitle { color:#6b7073 !important; font-size:14px !important; }
.performance-shell .appHeaderEyebrow,
.premium-screen .appHeaderEyebrow { color:#555b5e !important; }

.performance-shell .accent-card,
.performance-shell .premiumSummaryPanel,
.performance-shell .premiumStatTile,
.performance-shell .ch,
.performance-shell [class*="Card"],
.performance-shell [class*="Panel"],
.premium-screen [class*="Card"],
.premium-screen [class*="Panel"] {
  border-color:var(--pw-border) !important;
  color:#151719;
}
.performance-shell .accent-card,
.performance-shell .premiumSummaryPanel,
.performance-shell .ch,
.premium-screen [class*="Card"],
.premium-screen [class*="Panel"] {
  background:#fff !important;
  box-shadow:0 12px 38px rgba(26,30,33,.065) !important;
}
.performance-shell .premiumSummaryPanel { border:0 !important; border-radius:26px !important; }
.performance-shell .premiumSummaryPanel::after { opacity:.24; }
.performance-shell .premiumStatGrid {
  gap:10px !important;
  border:0 !important;
  background:transparent !important;
}
.performance-shell .premiumStatTile {
  border:1px solid var(--pw-border) !important;
  border-radius:16px !important;
  background:#f7f6f2 !important;
}
.performance-shell .heroStatVal { color:#17191b !important; }
.performance-shell .heroStatLbl { color:#818588 !important; }
.performance-shell .ch:hover,
.performance-shell .ch:focus-within {
  transform:translateY(-2px);
  background:#fff !important;
  border-color:rgba(21,23,25,.13) !important;
  box-shadow:var(--pw-shadow-raised) !important;
}

.performance-shell .pageHeaderPill,
.performance-shell .appHeaderAction {
  border-color:var(--pw-border) !important;
  background:#f7f6f2 !important;
  color:#303437 !important;
  box-shadow:none !important;
}
.performance-shell .pageHeaderPillBrand,
.performance-shell .cta-primary,
.performance-shell .btn-v.is-primary {
  border-color:#17191b !important;
  background:#17191b !important;
  color:#fff !important;
  box-shadow:0 12px 28px rgba(20,22,24,.16) !important;
}

.performance-shell input,
.performance-shell textarea,
.performance-shell select,
.premium-screen input,
.premium-screen textarea,
.premium-screen select {
  border-color:var(--pw-border-strong) !important;
  background:#fff !important;
  color:#17191b !important;
  box-shadow:0 1px 0 rgba(255,255,255,.8), inset 0 1px 2px rgba(22,25,27,.025) !important;
}
.performance-shell input::placeholder,
.performance-shell textarea::placeholder,
.premium-screen input::placeholder,
.premium-screen textarea::placeholder { color:#a1a4a5 !important; }
.performance-shell input:focus,
.performance-shell textarea:focus,
.performance-shell select:focus,
.premium-screen input:focus,
.premium-screen textarea:focus,
.premium-screen select:focus {
  border-color:color-mix(in srgb,var(--pw-accent) 65%,#202326) !important;
  background:#fff !important;
  box-shadow:0 0 0 4px var(--pw-accent-faint) !important;
}
.performance-shell label,
.premium-screen label { color:#74797c !important; }

.performance-shell p,
.performance-shell small,
.performance-shell [class*="Subtitle"],
.performance-shell [class*="Meta"],
.premium-screen p,
.premium-screen small { color:#6b7073; }

.performance-shell .feedListItem:hover { background:#f7f6f2 !important; }

.performance-shell button,
.premium-screen button { transition:transform .16s ease, box-shadow .18s ease, background .18s ease !important; }
.performance-shell button:active,
.premium-screen button:active { transform:scale(.985); }
.performance-shell :focus-visible,
.premium-screen :focus-visible { outline:3px solid var(--pw-accent-soft) !important; outline-offset:2px; }

@media (max-width: 720px) {
  .performance-shell,
  .premium-screen { background:#f6f5f1 !important; }
  .performance-shell .appHeader,
  .premium-screen .appHeader { padding:22px 18px !important; border-radius:22px !important; }
  .performance-shell .appHeaderTitle,
  .premium-screen .appHeaderTitle { font-size:38px !important; }
  .performance-shell .premiumSummaryPanel { padding:17px !important; border-radius:22px !important; }
  .performance-shell .premiumStatGrid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
}

@media (prefers-reduced-motion: reduce) {
  .performance-shell *, .premium-screen * { scroll-behavior:auto !important; animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
`;

export function installIndustrialDesignFoundation() {
  if (typeof document === "undefined") return false;
  if (document.getElementById(STYLE_ID)) return true;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.dataset.designSystem = "industrial-light-v1";
  style.textContent = CSS;
  document.head.appendChild(style);
  document.documentElement.dataset.shotlabDesign = "industrial-light-v1";
  return true;
}
