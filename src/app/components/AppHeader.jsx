const GearIcon = ({ size = 17 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 14H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function AppHeader({ title, initials, onOpenSettings, contextTeam, contextView }) {
  const hasContext = Boolean(contextTeam && contextView);

  return (
    <header className="app-header">
      <div className="app-bar">
        <div className="app-bar__logo" aria-label="Shotlab logo">
          <span className="logo-text">SHOT<span className="logo-accent">LAB</span></span>
        </div>
        <h1 className="app-bar__title">{title}</h1>
        <div className="app-bar__actions">
          <div className="avatar-circle" aria-label="User avatar">{initials}</div>
          <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </div>
      </div>

      {hasContext ? (
        <div className="context-strip" aria-label="Active context">
          <span className="context-team">{contextTeam}</span>
          <span className="context-divider">·</span>
          <span className="context-view">{contextView}</span>
        </div>
      ) : null}
    </header>
  );
}
