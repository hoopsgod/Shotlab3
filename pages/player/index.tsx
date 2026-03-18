import React from 'react';
import ReactDOM from 'react-dom/client';
import PlayerDashboardLayout from '../../layouts/PlayerDashboardLayout';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Player demo root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <PlayerDashboardLayout>
      <div style={{ color: 'white', padding: '24px' }}>
        PLAYER LAYOUT TEST
      </div>
    </PlayerDashboardLayout>
  </React.StrictMode>
);
