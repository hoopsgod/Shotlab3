export const VISUAL_FOUNDATION_2026_CSS = String.raw`
:root {
  color-scheme: light;
  --bg-0: #f3f0e8;
  --surface-1: #ffffff;
  --surface-2: #f8f6f0;
  --surface-3: #ece9e1;
  --surface-ink: #0d151b;
  --text-1: #121a20;
  --text-2: #4e5a63;
  --text-3: #76818a;
  --text-on-ink: #f6f7f3;
  --stroke-1: rgba(18, 27, 34, .10);
  --stroke-2: rgba(18, 27, 34, .17);
  --shadow-0: none;
  --shadow-1: 0 12px 34px rgba(27, 35, 41, .08);
  --shadow-2: 0 20px 54px rgba(27, 35, 41, .12);
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 26px;
  --radius-card: 18px;
  --stack-gap: 24px;
  --card-pad: 20px;
  --mini-card-pad: 16px;
  --accent: #c8ff1a;
  --accent-soft: rgba(153, 198, 14, .13);
  --accent-ink: #101806;
  --color-primary: var(--accent);
  --color-primary-dim: #7f9f18;
  --color-primary-glow: var(--accent-soft);
  --color-bg-base: var(--bg-0);
  --color-bg-card: var(--surface-1);
  --color-bg-elevated: var(--surface-2);
  --color-bg-subtle: var(--surface-3);
  --color-text-primary: var(--text-1);
  --color-text-secondary: var(--text-2);
  --color-text-muted: var(--text-3);
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  --tracking-tight: -.018em;
  --tracking-default: -.006em;
  --tracking-wide: .075em;
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --motion-ease-standard: cubic-bezier(.2, .74, .22, 1);
}

html,
body,
#root {
  min-height: 100%;
  background: var(--bg-0);
}

body {
  color: var(--text-1);
  background:
    radial-gradient(circle at 88% -8%, rgba(200, 255, 26, .10), transparent 26rem),
    var(--bg-0) !important;
  font-family: var(--font-body);
  font-feature-settings: "kern" 1, "ss01" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font-family: var(--font-body);
}

.coach-mode,
.performance-shell,
.premium-screen {
  color: var(--text-1) !important;
  background:
    radial-gradient(circle at 90% 0%, rgba(200, 255, 26, .08), transparent 24rem),
    var(--bg-0) !important;
}

.performance-shell,
.premium-screen {
  --pw-accent: var(--team-brand-primary, var(--accent));
  --pw-accent-soft: color-mix(in srgb, var(--pw-accent) 12%, transparent);
  --pw-accent-faint: color-mix(in srgb, var(--pw-accent) 6%, transparent);
  --pw-border: var(--stroke-1);
  --pw-border-strong: var(--stroke-2);
  --pw-surface: var(--surface-1);
  --pw-surface-raised: var(--surface-1);
  --pw-surface-inset: var(--surface-2);
  --pw-shadow: var(--shadow-1);
  --pw-shadow-raised: var(--shadow-2);
  --pw-radius: var(--radius-md);
  --pw-radius-lg: var(--radius-lg);
  --pw-copy: var(--text-1);
  --pw-muted: var(--text-2);
  --pw-dim: var(--text-3);
}

.performance-workspace::before,
.performance-workspace::after,
.performance-shell .premiumSummaryPanel::after,
.performance-shell--coach .coachDashboardOperationalContent::before,
.performance-shell--coach .coachDashboardOperationalContent::after {
  display: none !important;
}

.performance-shell .shell-main,
.performance-shell .content-wrap,
.performance-workspace {
  background: transparent !important;
}

.performance-shell .player-scroll-container,
.performance-shell .coach-scroll-container {
  max-width: 1120px !important;
  padding-inline: clamp(14px, 3vw, 28px) !important;
}

.performance-shell .sidebar-nav {
  border-right: 1px solid var(--stroke-1) !important;
  background: rgba(250, 249, 245, .94) !important;
  box-shadow: 12px 0 36px rgba(27, 35, 41, .05) !important;
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  backdrop-filter: blur(20px) saturate(120%);
}

.performance-shell .sidebar-nav .nav-title {
  color: var(--text-3) !important;
  font-family: var(--font-body) !important;
  font-size: 10px !important;
  letter-spacing: .08em !important;
}

.performance-shell .sidebar-nav .nav-item {
  min-height: 46px !important;
  border: 1px solid transparent !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text-2) !important;
  background: transparent !important;
  box-shadow: none !important;
}

.performance-shell .sidebar-nav .nav-item:hover,
.performance-shell .sidebar-nav .nav-item:focus-visible {
  color: var(--text-1) !important;
  border-color: var(--stroke-1) !important;
  background: var(--surface-1) !important;
}

.performance-shell .sidebar-nav .nav-item.is-active {
  color: var(--text-1) !important;
  border-color: color-mix(in srgb, var(--pw-accent) 30%, var(--stroke-1)) !important;
  background: color-mix(in srgb, var(--pw-accent) 9%, var(--surface-1)) !important;
  box-shadow: inset 3px 0 var(--pw-accent) !important;
}

.performance-shell .appHeader,
.premium-screen .appHeader {
  padding: 0 0 18px !important;
  overflow: visible !important;
  border: 0 !important;
  border-bottom: 1px solid var(--stroke-1) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.performance-shell .appHeader::before,
.premium-screen .appHeader::before {
  display: none !important;
}

.performance-shell .appHeaderTitle,
.premium-screen .appHeaderTitle {
  color: var(--text-1) !important;
  font-family: var(--font-display) !important;
  font-size: clamp(30px, 4vw, 44px) !important;
  font-weight: 780 !important;
  line-height: 1.02 !important;
  letter-spacing: -.04em !important;
  text-transform: none !important;
}

.performance-shell .appHeaderSubtitle,
.premium-screen .appHeaderSubtitle {
  color: var(--text-2) !important;
  font-family: var(--font-body) !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.performance-shell .appHeaderEyebrow,
.premium-screen .appHeaderEyebrow {
  color: color-mix(in srgb, var(--pw-accent) 62%, #496000) !important;
  font-family: var(--font-body) !important;
  font-size: 10px !important;
  font-weight: 760 !important;
  letter-spacing: .08em !important;
}

.performance-shell .appHeaderAction,
.premium-screen .appHeaderAction,
.performance-shell .pageHeaderPill {
  min-height: 42px !important;
  border: 1px solid var(--stroke-1) !important;
  border-radius: 999px !important;
  background: rgba(255, 255, 255, .78) !important;
  color: var(--text-1) !important;
  box-shadow: 0 6px 18px rgba(27, 35, 41, .06) !important;
}

.performance-shell .accent-card,
.performance-shell .premiumSummaryPanel,
.performance-shell .premiumStatTile,
.performance-shell .ch,
.performance-shell [class*="Card"],
.performance-shell [class*="Panel"],
.premium-screen [class*="Card"],
.premium-screen [class*="Panel"] {
  border-color: var(--stroke-1) !important;
  background: var(--surface-1) !important;
  color: var(--text-1) !important;
  box-shadow: var(--shadow-1) !important;
}

.performance-shell .premiumSummaryPanel {
  border-radius: var(--radius-lg) !important;
}

.performance-shell .premiumStatGrid {
  gap: 1px !important;
  border-color: var(--stroke-1) !important;
  background: var(--stroke-1) !important;
}

.performance-shell .premiumStatTile {
  background: var(--surface-2) !important;
  box-shadow: none !important;
}

.performance-shell .heroStatVal,
.performance-shell .progressValue,
.performance-shell .metricValue {
  color: var(--text-1) !important;
}

.performance-shell .heroStatLbl,
.performance-shell .metricLabel {
  color: var(--text-3) !important;
}

.performance-shell .feedListItem:hover {
  border-color: var(--stroke-1) !important;
  background: var(--surface-2) !important;
}

.performance-shell input,
.performance-shell textarea,
.performance-shell select,
.premium-screen input,
.premium-screen textarea,
.premium-screen select {
  min-height: 48px;
  border: 1px solid var(--stroke-2) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--surface-1) !important;
  color: var(--text-1) !important;
  box-shadow: 0 1px 0 rgba(255, 255, 255, .7), inset 0 1px 2px rgba(27, 35, 41, .03) !important;
}

.performance-shell input::placeholder,
.performance-shell textarea::placeholder,
.premium-screen input::placeholder,
.premium-screen textarea::placeholder {
  color: var(--text-3) !important;
}

.performance-shell input:focus,
.performance-shell textarea:focus,
.performance-shell select:focus,
.premium-screen input:focus,
.premium-screen textarea:focus,
.premium-screen select:focus {
  outline: none !important;
  border-color: color-mix(in srgb, var(--pw-accent) 58%, #66721b) !important;
  background: var(--surface-1) !important;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--pw-accent) 14%, transparent) !important;
}

.performance-shell label,
.premium-screen label {
  color: var(--text-2) !important;
  font-family: var(--font-body) !important;
  letter-spacing: .05em !important;
}

.cta-primary,
.cta-primary-accent,
.cta-brand,
.performance-shell .cta-primary,
.performance-shell .pageHeaderPillBrand {
  min-height: 50px !important;
  border: 1px solid color-mix(in srgb, var(--accent) 72%, #607600) !important;
  border-radius: 14px !important;
  background: var(--accent) !important;
  color: var(--accent-ink) !important;
  box-shadow: 0 9px 24px rgba(102, 132, 15, .14) !important;
  font-family: var(--font-body) !important;
  font-size: 14px !important;
  font-weight: 760 !important;
  letter-spacing: -.006em !important;
  text-transform: none !important;
}

.cta-secondary,
.performance-shell .cta-secondary {
  min-height: 48px !important;
  border: 1px solid var(--stroke-1) !important;
  border-radius: 14px !important;
  background: var(--surface-1) !important;
  color: var(--text-1) !important;
  box-shadow: 0 6px 18px rgba(27, 35, 41, .05) !important;
  font-family: var(--font-body) !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  letter-spacing: -.006em !important;
  text-transform: none !important;
}

.cta-ghost,
.performance-shell .cta-ghost {
  color: var(--text-2) !important;
  font-family: var(--font-body) !important;
  text-transform: none !important;
}

.performance-shell .btn-v,
.btn-v {
  border-radius: 14px !important;
  font-family: var(--font-body) !important;
  font-weight: 720 !important;
  letter-spacing: -.004em !important;
  transition: transform var(--motion-fast) var(--motion-ease-standard), box-shadow var(--motion-base) var(--motion-ease-standard), filter var(--motion-base) var(--motion-ease-standard) !important;
}

.performance-shell .btn-v:hover,
.performance-shell .btn-v:focus-visible,
.btn-v:hover,
.btn-v:focus-visible {
  transform: translateY(-1px);
  filter: brightness(1.01);
}

.performance-shell .btn-v:active,
.btn-v:active {
  transform: scale(.985);
}

.performance-shell details,
.premium-screen details {
  border: 1px solid var(--stroke-1) !important;
  border-radius: var(--radius-md) !important;
  background: var(--surface-1) !important;
  box-shadow: var(--shadow-1) !important;
}

.performance-shell [class*="Empty"],
.premium-screen [class*="Empty"] {
  border: 1px solid var(--stroke-1) !important;
  background: var(--surface-2) !important;
  color: var(--text-2) !important;
  box-shadow: none !important;
}

.performance-shell .player-quick-actions button:hover,
.performance-shell .player-quick-actions button:focus-visible {
  border-color: var(--stroke-1) !important;
  background: var(--surface-1) !important;
  color: var(--text-1) !important;
}

@media (max-width: 767px) {
  :root {
    --stack-gap: 20px;
    --card-pad: 18px;
    --radius-card: 16px;
  }

  .performance-shell .player-scroll-container,
  .performance-shell .coach-scroll-container {
    padding-inline: 14px !important;
  }

  .performance-shell .appHeader,
  .premium-screen .appHeader {
    padding: 2px 0 16px !important;
  }

  .performance-shell .appHeaderTitle,
  .premium-screen .appHeaderTitle {
    font-size: 32px !important;
  }

  .performance-shell .premiumSummaryPanel {
    border-radius: 20px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`;

export default VISUAL_FOUNDATION_2026_CSS;
