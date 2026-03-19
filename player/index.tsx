import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from '../features/player/HomePage';
import { TeamBrandingProvider } from '../src/branding/TeamBrandingProvider';
import PlayerSidebar from '../src/components/PlayerSidebar';
import PlayerWidgets from '../src/components/PlayerWidgets';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player app root element not found');
}

function StandalonePlayerPage() {
  return (
    <TeamBrandingProvider>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-0)',
          color: 'var(--text-1)',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <style>{`
          :root {
            --bg-0: #0b0d10;
            --surface-1: #0f1115;
            --surface-2: #141821;
            --surface-3: #171d28;
            --text-1: #e5e7eb;
            --text-2: #9ca3af;
            --text-3: #6b7280;
            --stroke-1: rgba(255, 255, 255, 0.08);
            --stroke-2: rgba(255, 255, 255, 0.12);
            --shadow-1: 0 2px 10px rgba(0, 0, 0, 0.35);
            --shadow-2: 0 8px 24px rgba(0, 0, 0, 0.45);
            --radius-card: 20px;
            --accent: #c8ff1a;
            --accent-soft: rgba(200, 255, 26, 0.18);
          }

          * {
            box-sizing: border-box;
          }

          html,
          body,
          #root {
            min-height: 100%;
          }

          body {
            margin: 0;
            background: var(--bg-0);
          }

          a {
            color: inherit;
          }
        `}</style>

        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <PlayerSidebar />
          <main
            style={{
              flex: 1,
              minWidth: 0,
              padding: '24px',
              display: 'grid',
              alignContent: 'start',
              gap: '24px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)',
            }}
          >
            <HomePage />
          </main>
          <PlayerWidgets />
        </div>
      </div>
    </TeamBrandingProvider>
  );
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <StandalonePlayerPage />
  </React.StrictMode>
);
