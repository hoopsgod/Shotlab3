import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from '../features/player/HomePage';
import PlayerDashboardLayout from '../layouts/PlayerDashboardLayout';
import { Styles } from '../src/App';

function StandalonePlayerBootstrap() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (isDesktop) {
    return (
      <PlayerDashboardLayout>
        <HomePage />
      </PlayerDashboardLayout>
    );
  }

  return (
    <div className="app-shell is-mobile">
      <main className="shell-main">
        <div className="content-wrap">
          <div
            className="team-brand page"
            data-accent="home"
            style={{
              minHeight: '100dvh',
              background: 'var(--bg-0)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Barlow Condensed, system-ui, sans-serif',
              position: 'relative',
            }}
          >
            <div style={{ padding: '16px' }}>
              <HomePage />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player app root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Styles />
    <StandalonePlayerBootstrap />
  </React.StrictMode>,
);
